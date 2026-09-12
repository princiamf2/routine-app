import { API_URL } from "../config/api";
import { getDeviceId } from "../storage/deviceStorage";

export async function sendAppOpenedEvent() {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: deviceId,
      date: new Date().toISOString().slice(0, 10),
      appOpened: true,
    }),
  });

  return response.json();
}

export async function sendActionCompletedEvent(feedbackValue: number, feedbackText: string) {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: deviceId,
      date: new Date().toISOString().slice(0, 10),
      appOpened: false,
      actionCompleted: true,
      feedbackValue,
      feedbackText,
    }),
  });

  return response.json();
}