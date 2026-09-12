import { API_URL } from "../config/api";
import { UserLocation } from "./locationService";

export type Therapist = {
  id: number;
  name: string;
  specialty: string;
  distance: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export async function findNearbyTherapists(
  location: UserLocation
): Promise<Therapist[]> {
  const response = await fetch(
    `${API_URL}/therapists/nearby?lat=${location.latitude}&lng=${location.longitude}`
  );

  if (!response.ok) {
    console.log("Erreur backend therapists:", response.status);
    return [];
  }

  return response.json();
}