import { API_URL } from "../config/api";

export type CoachLevel = "green" | "yellow" | "red" | "emergency";

export type CoachResponse = {
  success: boolean;
  level: CoachLevel;
  title: string;
  shouldShowTherapists: boolean;
  needsQuestions: boolean;
  suggestedAction: string;
  reply: string;
  followUpQuestion: string | null;
};

export type CoachHistoryMessage = {
  role: "user" | "assistant";
  text: string;
};

export async function sendCoachMessage(
  message: string,
  history: CoachHistoryMessage[],
  movementTitle?: string,
  movementDescription?: string
): Promise<CoachResponse> {
  const response = await fetch(`${API_URL}/coach/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      movementTitle,
      movementDescription,
    }),
  });

  if (!response.ok) {
    throw new Error("Erreur pendant l’analyse du message");
  }

  return response.json();
}