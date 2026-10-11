import {
  fetchCurrentUser,
  loginPatient,
  logoutPatient,
  type AuthUser,
} from "./authService";
import { ApiError } from "./apiClient";
import {
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
} from "../storage/authTokenStorage";

export type AuthSnapshot = {
  status: "loading" | "signedOut" | "signedIn" | "error";
  user: AuthUser | null;
  error: string | null;
  isBusy: boolean;
};

const initialSnapshot: AuthSnapshot = {
  status: "loading",
  user: null,
  error: null,
  isBusy: false,
};

let snapshot: AuthSnapshot = initialSnapshot;
let operationRunning = false;
const listeners = new Set<() => void>();

function publish(next: AuthSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function publishUser(user: AuthUser | null): void {
  publish({
    status: user ? "signedIn" : "signedOut",
    user,
    error: null,
    isBusy: operationRunning,
  });
}

function publishError(message: string): void {
  publish({
    status: "error",
    user: null,
    error: message,
    isBusy: operationRunning,
  });
}

function beginOperation(): void {
  if (operationRunning) {
    throw new Error("Une opération est déjà en cours. Patiente un instant.");
  }

  operationRunning = true;
  publish({ ...snapshot, isBusy: true });
}

function finishOperation(): void {
  operationRunning = false;
  publish({ ...snapshot, isBusy: false });
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

export function getServerAuthSnapshot(): AuthSnapshot {
  return initialSnapshot;
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function restoreSession(): Promise<void> {
  if (operationRunning) {
    return;
  }

  beginOperation();

  publish({
    status: "loading",
    user: null,
    error: null,
    isBusy: true,
  });

  try {
    const token = await getAuthToken();

    if (!token) {
      publishUser(null);
      return;
    }

    try {
      const user = await fetchCurrentUser();
      publishUser(user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearAuthToken();
        publishUser(null);
        return;
      }

      throw error;
    }
  } catch {
    publishError(
      "Impossible de restaurer la connexion. Vérifie ta connexion et réessaie.",
    );
  } finally {
    finishOperation();
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<void> {
  if (snapshot.status !== "signedOut") {
    throw new Error("La connexion n’est pas disponible dans l’état actuel.");
  }

  beginOperation();

  try {
    const result = await loginPatient(email, password);

    try {
      await saveAuthToken(result.token);
    } catch {
      publishError("Impossible d’enregistrer la connexion sur cet appareil.");
      throw new Error("Impossible d’enregistrer la connexion sur cet appareil.");
    }

    publishUser(result.user);
  } finally {
    finishOperation();
  }
}

export async function signOut(): Promise<void> {
  beginOperation();

  try {
    const token = await getAuthToken();

    if (token) {
      try {
        await logoutPatient();
      } catch (error) {
        // Une session déjà invalide peut être supprimée de l'appareil.
        if (!(error instanceof ApiError && error.status === 401)) {
          throw error;
        }
      }
    }

    try {
      await clearAuthToken();
    } catch {
      publishError("Impossible de supprimer la connexion sur cet appareil.");
      throw new Error("Impossible de supprimer la connexion sur cet appareil.");
    }

    publishUser(null);
  } finally {
    finishOperation();
  }
}