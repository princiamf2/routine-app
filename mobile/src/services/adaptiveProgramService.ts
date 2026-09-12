import { API_URL } from "../config/api";
import { getDeviceId } from "../storage/deviceStorage";

export type AdaptiveExercise = {
  id: number;
  title: string;
  level: "green" | "orange" | "red";
  category: string;
  image: "stretch" | "walking" | "squat" | "core" | "rest";
};

export type AdaptiveSession = {
  success: boolean;
  streak: number;
  day: number;
  feedbackAverage: number | null;
  allowedLevels: string[];
  progression: {
    label: string;
    reps: number;
    series: number;
    rest: string;
    note?: string;
  };
  exercises: AdaptiveExercise[];
};

export async function fetchAdaptiveSession(day: number): Promise<AdaptiveSession> {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_URL}/adaptive-session/${deviceId}?day=${day}`);

  if (!response.ok) {
    throw new Error("Impossible de charger la séance adaptée");
  }

  return response.json();
}