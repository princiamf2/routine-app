const localTherapists = require("../data/therapistsStore");

const MAX_DISTANCE_KM = 10;

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistanceKm(userLat, userLng, placeLat, placeLng) {
  const earthRadiusKm = 6371;

  const latDiff = degreesToRadians(placeLat - userLat);
  const lngDiff = degreesToRadians(placeLng - userLng);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(degreesToRadians(userLat)) *
      Math.cos(degreesToRadians(placeLat)) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function formatDistance(distanceKm) {
  return `${distanceKm.toFixed(1)} km`;
}

function formatGooglePlace(place, userLat, userLng, index) {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (!latitude || !longitude) {
    return null;
  }

  const distanceKm = calculateDistanceKm(userLat, userLng, latitude, longitude);

  return {
    id: place.id || `google-${index}`,
    name: place.displayName?.text || "Thérapeute",
    specialty: "Physiothérapie / santé",
    distanceValue: distanceKm,
    distance: formatDistance(distanceKm),
    phone: place.internationalPhoneNumber,
    address: place.formattedAddress,
    latitude,
    longitude,
  };
}

function findLocalTherapists(userLat, userLng) {
  return localTherapists
    .map((therapist) => {
      const distanceKm = calculateDistanceKm(
        userLat,
        userLng,
        therapist.latitude,
        therapist.longitude
      );

      return {
        ...therapist,
        distanceValue: distanceKm,
        distance: formatDistance(distanceKm),
      };
    })
    .filter((therapist) => therapist.distanceValue <= MAX_DISTANCE_KM)
    .sort((a, b) => a.distanceValue - b.distanceValue)
    .map(({ distanceValue, ...therapist }) => therapist);
}

async function findGoogleTherapists(userLat, userLng) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.log("GOOGLE_PLACES_API_KEY manquante, fallback local.");
    return [];
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber",
      },
      body: JSON.stringify({
        includedTypes: ["physiotherapist"],
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: {
              latitude: userLat,
              longitude: userLng,
            },
            radius: 10000,
          },
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.log("Erreur Google Places:", data);
    return [];
  }

  return (data.places || [])
    .map((place, index) => formatGooglePlace(place, userLat, userLng, index))
    .filter(Boolean)
    .filter((therapist) => therapist.distanceValue <= MAX_DISTANCE_KM)
    .sort((a, b) => a.distanceValue - b.distanceValue)
    .map(({ distanceValue, ...therapist }) => therapist);
}

async function findNearbyTherapists(lat, lng) {
  const userLat = Number(lat);
  const userLng = Number(lng);

  const googleResults = await findGoogleTherapists(userLat, userLng);

  if (googleResults.length > 0) {
    return googleResults;
  }

  return findLocalTherapists(userLat, userLng);
}

module.exports = {
  findNearbyTherapists,
};