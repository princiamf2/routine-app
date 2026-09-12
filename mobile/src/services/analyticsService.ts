import { API_URL } from "../config/api";
import { getDeviceId } from "../storage/deviceStorage";

export async function fetchAnalytics() {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_URL}/analytics/${deviceId}`);
  return response.json();
}