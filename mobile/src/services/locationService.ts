import * as Location from "expo-location";

export type UserLocation = {
    latitude: number;
    longitude: number;
};

export async function getUserLocation(): Promise<UserLocation | null> {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
        return null;
    }
    const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });
    return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
    };
}