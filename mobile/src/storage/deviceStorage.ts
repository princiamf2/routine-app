import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAccountStorage } from "./accountStorage";

let deviceIdPromise: Promise<string> | null = null;

export function getDeviceId(): Promise<string> {
  if (deviceIdPromise === null) {
    deviceIdPromise = (async () => {
      let deviceId = await AsyncStorage.getItem("deviceId");

      if (!deviceId) {
        deviceId = "use_" + Math.random().toString(36).substring(2, 10);
        await AsyncStorage.setItem("deviceId", deviceId);
      }

      return deviceId;
    })().finally(() => {
      deviceIdPromise = null;
    });
  }

  return deviceIdPromise;
}

export async function hasCompletedToday(userId: string) {
  const storage = createAccountStorage(userId);
  const today = new Date().toISOString().slice(0, 10);

  const value = await storage.getItem(`completed_${today}`);
  return value === "true";
}

export async function markCompletedToday(userId: string) {
  const storage = createAccountStorage(userId);
  const today = new Date().toISOString().slice(0, 10);

  await storage.setItem(`completed_${today}`, "true");
}