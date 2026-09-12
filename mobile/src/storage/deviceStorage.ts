import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getDeviceId() {
  let deviceId = await AsyncStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = "use_" + Math.random().toString(36).substring(2, 10);
    await AsyncStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
}

export async function hasCompletedToday() {
  const today = new Date().toISOString().slice(0, 10);
  const key = "completed_" + today;

  const value = await AsyncStorage.getItem(key);
  return value === "true";
}

export async function markCompletedToday() {
  const today = new Date().toISOString().slice(0, 10);
  const key = "completed_" + today;

  await AsyncStorage.setItem(key, "true");
}