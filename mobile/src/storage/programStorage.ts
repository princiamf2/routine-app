import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getCurrentDay() {
  let startDate = await AsyncStorage.getItem("start_date");

  if (!startDate) {
    const now = new Date().toISOString();
    await AsyncStorage.setItem("start_date", now);
    startDate = now;
  }

  const start = new Date(startDate);
  const today = new Date();

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
}