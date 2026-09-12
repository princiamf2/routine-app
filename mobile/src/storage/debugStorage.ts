import AsyncStorage from "@react-native-async-storage/async-storage";

export async function resetAppStorage() {
  const today = new Date().toISOString().slice(0, 10);
  const APP_KEYS = [
    "start_date",
    "deviceId",
    "completed_" + today,
  ];
  try {
    await AsyncStorage.multiRemove(APP_KEYS);
    console.log("App reset OK");
  } catch (error) {
    console.log("Storage already cleared");
  }
}