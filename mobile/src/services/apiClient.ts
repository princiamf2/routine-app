import { API_URL } from "../config/api";
import { getAuthToken } from "../storage/authTokenStorage";

type SessionRejectedHandler = (token: string) => void;

let sessionRejectedHandler: SessionRejectedHandler | null = null;

export function setSessionRejectedHandler(
  handler: SessionRejectedHandler
): void {
  sessionRejectedHandler = handler;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  authenticated?: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    authenticated = true,
  }: RequestOptions = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Le chemin de l’API est invalide.");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let requestToken: string | null = null;
  if (authenticated) {
    requestToken = await getAuthToken();
    if (!requestToken)
        throw new ApiError("Connecte-toi pour continuer.", 401);
    headers.Authorization = `Bearer ${requestToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 401 && requestToken !== null)
        sessionRejectedHandler?.(requestToken);
    const text = await response.text();
    let data: unknown = null;

    try {
      data = JSON.parse(text);
    } catch {
      // Une réponse HTML ou vide n'est pas une réponse JSON exploitable.
    }

    if (!response.ok) {
      const details = isObject(data) ? data : {};

      const retryHeader = response.headers.get("Retry-After");
      const retryValue = typeof details.retryAfterSeconds === "number"
        ? details.retryAfterSeconds
        : retryHeader === null
          ? NaN
          : Number(retryHeader);

      throw new ApiError(
        typeof details.error === "string"
          ? details.error
          : `La requête a échoué (${response.status}).`,
        response.status,
        typeof details.code === "string" ? details.code : undefined,
        Number.isFinite(retryValue) && retryValue >= 0
          ? Math.ceil(retryValue)
          : undefined,
      );
    }

    if (data === null) {
      throw new ApiError(
        "Le serveur a renvoyé une réponse invalide.",
        response.status,
        "INVALID_RESPONSE",
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiError(
        "Le serveur met trop de temps à répondre. Réessaie.",
        0,
        "REQUEST_TIMEOUT",
      );
    }

    throw new ApiError(
      "Impossible de joindre le serveur. Vérifie ta connexion.",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}