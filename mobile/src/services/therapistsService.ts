import { apiRequest } from "./apiClient";
import type { UserLocation } from "./locationService";

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
  location: UserLocation,
): Promise<Therapist[]> {
  return apiRequest<Therapist[]>(
    `/therapists/nearby?lat=${encodeURIComponent(location.latitude)}&lng=${encodeURIComponent(location.longitude)}`,
  );
}