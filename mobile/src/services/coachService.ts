import { apiRequest } from "./apiClient";

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
  movementDescription?: string,
): Promise<CoachResponse> {
  return apiRequest<CoachResponse>("/coach/message", {
    method: "POST",
    body: {
      message,
      history,
      movementTitle,
      movementDescription,
    },
  });
}