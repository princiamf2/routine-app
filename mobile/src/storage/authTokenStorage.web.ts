let currentToken: string | null = null;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  return currentToken;
}

export async function saveAuthToken(token: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("La connexion doit être effectuée dans le navigateur.");
  }

  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    throw new Error("Le jeton de connexion est invalide.");
  }

  currentToken = token;
}

export async function clearAuthToken(): Promise<void> {
  currentToken = null;
}