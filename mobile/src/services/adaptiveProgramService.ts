import { apiRequest } from "./apiClient";

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
  latestFeedback: number | null;
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

export async function fetchAdaptiveSession(
  day: number,
): Promise<AdaptiveSession> {
  if (!Number.isSafeInteger(day) || day < 1) {
    throw new Error("Le jour doit être un entier positif valide.");
  }

  return apiRequest<AdaptiveSession>(`/adaptive-session?day=${day}`);
}