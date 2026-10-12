import { createAccountStorage } from "./accountStorage";

const SESSION_PROGRESS_KEY = "movement_session_progress";

export type MovementSessionProgress = {
  day: number;
  currentExerciseIndex: number;
  isResting: boolean;
  restSecondsLeft: number;
};

export async function saveMovementSessionProgress(
  userId: string,
  progress: MovementSessionProgress
): Promise<void> {
  const storage = createAccountStorage(userId);

  await storage.setItem(
    SESSION_PROGRESS_KEY,
    JSON.stringify(progress)
  );
}

export async function getMovementSessionProgress(
  userId: string
): Promise<MovementSessionProgress | null> {
  const storage = createAccountStorage(userId);
  const value = await storage.getItem(SESSION_PROGRESS_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as MovementSessionProgress;
}

export async function clearMovementSessionProgress(
  userId: string
): Promise<void> {
  const storage = createAccountStorage(userId);

  await storage.removeItem(SESSION_PROGRESS_KEY);
}