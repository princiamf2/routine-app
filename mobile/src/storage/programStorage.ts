import { createAccountStorage } from "./accountStorage";

const pendingDays = new Map<string, Promise<number>>();

async function readCurrentDay(userId: string): Promise<number> {
  const storage = createAccountStorage(userId);
  let startDate = await storage.getItem("start_date");

  if (!startDate) {
    startDate = new Date().toISOString();
    await storage.setItem("start_date", startDate);
  }

  const startTime = new Date(startDate).getTime();

  if (!Number.isFinite(startTime)) {
    throw new Error("La date de début du programme est invalide.");
  }

  const elapsedDays = Math.floor(
    (Date.now() - startTime) / (24 * 60 * 60 * 1000)
  );

  return Math.max(1, elapsedDays + 1);
}

export function getCurrentDay(userId: string): Promise<number> {
  const pending = pendingDays.get(userId);

  if (pending) {
    return pending;
  }

  const request = readCurrentDay(userId).finally(() => {
    pendingDays.delete(userId);
  });

  pendingDays.set(userId, request);
  return request;
}