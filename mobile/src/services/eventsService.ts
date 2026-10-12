import { apiRequest } from "./apiClient";

export type EventResponse = {
  success: boolean;
  event: {
    id: number;
    userId: string;
    date: string;
    appOpened: boolean;
    actionCompleted: boolean;
    feedbackValue: number | null;
    feedbackText: string | null;
    receivedAt: string;
  };
};

export async function sendAppOpenedEvent(): Promise<EventResponse> {
  return apiRequest<EventResponse>("/events", {
    method: "POST",
    body: {
      date: new Date().toISOString().slice(0, 10),
      appOpened: true,
    },
  });
}

export async function sendActionCompletedEvent(
  feedbackValue: number,
  feedbackText: string,
): Promise<EventResponse> {
  return apiRequest<EventResponse>("/events", {
    method: "POST",
    body: {
      date: new Date().toISOString().slice(0, 10),
      appOpened: false,
      actionCompleted: true,
      feedbackValue,
      feedbackText,
    },
  });
}