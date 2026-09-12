import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import { getUserLocation, UserLocation } from "@/src/services/locationService";
import { findNearbyTherapists, Therapist } from "@/src/services/therapistsService";

export default function TherapistsScreen() {
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [therapists, setTherapists] = useState<Therapist[]>([]);

    useEffect(() => {
        async function loadData() {
            const userLocation = await getUserLocation();
            setLocation(userLocation);

            if (userLocation) {
                const nearbyTherapists = await findNearbyTherapists(userLocation);
                setTherapists(nearbyTherapists);
            }
            setLoading(false);
        }
        loadData();
    }, []);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.smallTitle}>Professionnels proches</Text>

      <Text style={styles.title}>Thérapeutes recommandés</Text>

      <Text style={styles.subtitle}>
        Cette liste est affichée à titre informatif. Le choix du professionnel
        reste entièrement libre.
      </Text>

      {loading ? (
        <Text style={styles.locationText}>Recherche de votre position...</Text>
      ) : location ? (
        <Text style={styles.locationText}>
            Position détectée :
            {"\n"}
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.locationText}>
            {"impossible d'accéder à votre position."}
        </Text>
      )}

      {therapists.map((therapist) => (
        <View key={therapist.id} style={styles.card}>
          <Text style={styles.cardTitle}>{therapist.name}</Text>
          <Text style={styles.cardText}>{therapist.specialty}</Text>
          <Text style={styles.cardDistance}>{therapist.distance}</Text>
          <View style={styles.actions}>
            {therapist.phone && (
                <Pressable
                style={styles.smallButton}
                onPress={() => Linking.openURL(`tel:${therapist.phone}`)}
                >
                <Text style={styles.smallButtonText}>Appeler</Text>
                </Pressable>
            )}

            {therapist.latitude && therapist.longitude && (
                <Pressable
                    style={styles.smallButtonSecondary}
                    onPress={() =>
                    Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${therapist.latitude},${therapist.longitude}`
                    )
                    }
                >
                    <Text style={styles.smallButtonSecondaryText}>Ouvrir Maps</Text>
                </Pressable>
                )}
            </View>
        </View>
      ))}

      <Pressable style={styles.primaryButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Retour</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: Colors.light.background,
  },

  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 18,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.secondaryText,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 22,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 6,
  },

  cardText: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },

  cardDistance: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.primary,
  },

  primaryButton: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },

  locationText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.secondaryText,
    marginBottom: 24,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  smallButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  smallButtonText: {
    color: "white",
    fontWeight: "800",
  },

  smallButtonSecondary: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  smallButtonSecondaryText: {
    color: Colors.light.primary,
    fontWeight: "800",
  },

});