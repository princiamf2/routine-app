import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "routine.auth.token";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export async function getAuthToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (token !== null && !TOKEN_PATTERN.test(token)) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return null;
  }

  return token;
}

export async function saveAuthToken(token: string): Promise<void> {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    throw new Error("Le jeton de connexion est invalide.");
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}