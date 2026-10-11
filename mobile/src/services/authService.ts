import { ApiError, apiRequest } from "./apiClient";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: "patient" | "therapist";
  createdAt: number;
  emailVerifiedAt: number;
};

export type RegistrationInput = {
  email: string;
  displayName: string;
  password: string;
};

export type RegistrationResult = {
  email: string;
  codeSent: boolean;
  message: string;
};

export type LoginResult = {
  token: string;
  expiresAt: number;
  user: AuthUser;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new ApiError(
    "Les données reçues du serveur sont invalides.",
    0,
    "INVALID_RESPONSE",
  );
}

function readUser(value: unknown): AuthUser {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    typeof value.email !== "string" ||
    typeof value.displayName !== "string" ||
    (value.role !== "patient" && value.role !== "therapist") ||
    typeof value.createdAt !== "number" ||
    !Number.isSafeInteger(value.createdAt) ||
    typeof value.emailVerifiedAt !== "number" ||
    !Number.isSafeInteger(value.emailVerifiedAt)
  ) {
    return invalidResponse();
  }

  return {
    id: value.id,
    email: value.email,
    displayName: value.displayName,
    role: value.role,
    createdAt: value.createdAt,
    emailVerifiedAt: value.emailVerifiedAt,
  };
}

function readMessage(value: unknown): string {
  if (
    !isObject(value) ||
    value.success !== true ||
    typeof value.message !== "string"
  ) {
    return invalidResponse();
  }

  return value.message;
}

export async function registerPatient(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const data = await apiRequest<unknown>("/auth/register", {
    method: "POST",
    authenticated: false,
    body: {
      email: input.email,
      displayName: input.displayName,
      password: input.password,
    },
  });

  if (
    !isObject(data) ||
    data.success !== true ||
    data.verificationRequired !== true ||
    typeof data.email !== "string" ||
    typeof data.codeSent !== "boolean" ||
    typeof data.message !== "string"
  ) {
    return invalidResponse();
  }

  return {
    email: data.email,
    codeSent: data.codeSent,
    message: data.message,
  };
}

export async function loginPatient(
  email: string,
  password: string,
): Promise<LoginResult> {
  const data = await apiRequest<unknown>("/auth/login", {
    method: "POST",
    authenticated: false,
    body: { email, password },
  });

  if (
    !isObject(data) ||
    data.success !== true ||
    typeof data.token !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(data.token) ||
    typeof data.expiresAt !== "number" ||
    !Number.isSafeInteger(data.expiresAt) ||
    data.expiresAt <= Date.now()
  ) {
    return invalidResponse();
  }

  return {
    token: data.token,
    expiresAt: data.expiresAt,
    user: readUser(data.user),
  };
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await apiRequest<unknown>("/auth/me");

  if (!isObject(data) || data.success !== true) {
    return invalidResponse();
  }

  return readUser(data.user);
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<string> {
  const data = await apiRequest<unknown>("/auth/verify-email", {
    method: "POST",
    authenticated: false,
    body: { email, code },
  });

  return readMessage(data);
}

export async function resendVerification(email: string): Promise<string> {
  const data = await apiRequest<unknown>("/auth/resend-verification", {
    method: "POST",
    authenticated: false,
    body: { email },
  });

  return readMessage(data);
}

export async function logoutPatient(): Promise<void> {
  const data = await apiRequest<unknown>("/auth/logout", {
    method: "POST",
  });

  readMessage(data);
}