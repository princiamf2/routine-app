import { apiRequest } from "./apiClient";

export type UserAnalytics = {
  userId: string;
  activeDays: number;
  regularityPercent: number;
  streak: number;
  totalOpenCount: number;
  opensToday: number;
  feedbackAverage: number | null;
  latestFeedback: number | null;
  completedDates: string[];
};

export async function fetchAnalytics(): Promise<UserAnalytics> {
  return apiRequest<UserAnalytics>("/analytics");
}