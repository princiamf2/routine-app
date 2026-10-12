import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/src/services/apiClient";
import {
  registerPatient,
  resendVerification,
  verifyEmail,
} from "@/src/services/authService";

type Mode = "login" | "register" | "verify";

function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        style={styles.input}
      />
    </View>
  );
}

export default function AuthScreen() {
  const { signIn, isBusy } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [information, setInformation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  const busy = submitting || isBusy;
  const remainingSeconds = Math.max(
    0,
    Math.ceil((resendAt - now) / 1000),
  );

  useEffect(() => {
    if (resendAt <= Date.now()) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (current >= resendAt) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [resendAt]);

  function waitBeforeResend(seconds: number) {
    const current = Date.now();
    setNow(current);
    setResendAt(current + seconds * 1000);
  }

  function changeMode(nextMode: Mode) {
    if (submittingRef.current || isBusy) return;

    setMode(nextMode);
    setPassword("");
    setConfirmation("");
    setCode("");
    setError("");
    setInformation("");
  }

  async function run(action: () => Promise<void>) {
    if (submittingRef.current || isBusy) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    setInformation("");

    try {
      await action();
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.status === 429 &&
        mode === "verify"
      ) {
        waitBeforeResend(caught.retryAfterSeconds ?? 60);
      }

      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue. Réessaie.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function submit() {
    void run(async () => {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Saisis ton adresse e-mail.");
      }

      if (mode === "login") {
        try {
          await signIn(cleanEmail, password);
        } catch (caught) {
          if (
            caught instanceof ApiError &&
            caught.code === "EMAIL_NOT_VERIFIED"
          ) {
            setEmail(cleanEmail);
            setPassword("");
            setConfirmation("");
            setCode("");
            setMode("verify");
            setInformation(
              "Ton adresse n’est pas encore vérifiée. Saisis le code reçu ou demande un nouveau code.",
            );
            return;
          }

          throw caught;
        }

        return;
      }

      if (mode === "register") {
        if (password !== confirmation) {
          throw new Error("Les deux mots de passe ne correspondent pas.");
        }

        const result = await registerPatient({
          email: cleanEmail,
          displayName: displayName.trim(),
          password,
        });

        setEmail(result.email);
        setPassword("");
        setConfirmation("");
        setCode("");
        setMode("verify");
        setInformation(result.message);
        waitBeforeResend(60);
        return;
      }

      const cleanCode = code.trim();

      if (!/^\d{6}$/.test(cleanCode)) {
        throw new Error("Saisis le code à 6 chiffres reçu par e-mail.");
      }

      const message = await verifyEmail(cleanEmail, cleanCode);

      setEmail(cleanEmail);
      setCode("");
      setPassword("");
      setConfirmation("");
      setMode("login");
      setInformation(message);
      setResendAt(0);
    });
  }

  function resendCode() {
    if (Date.now() < resendAt) return;

    void run(async () => {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Saisis ton adresse e-mail.");
      }

      const message = await resendVerification(cleanEmail);
      setInformation(message);
      waitBeforeResend(60);
    });
  }

  const title = {
    login: "Bienvenue dans Routine",
    register: "Créer mon compte",
    verify: "Vérifier mon adresse",
  }[mode];

  const subtitle = {
    login: "Connecte-toi pour retrouver ton programme.",
    register: "Un compte personnel pour suivre ta progression.",
    verify: "Saisis le code reçu par e-mail. Il est valable 10 minutes.",
  }[mode];

  const buttonLabel = {
    login: "Me connecter",
    register: "Créer mon compte",
    verify: "Vérifier mon adresse",
  }[mode];

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.brand}>ROUTINE</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {mode === "register" && (
              <Field
                label="Ton nom"
                value={displayName}
                onChangeText={setDisplayName}
                autoComplete="name"
                textContentType="name"
                maxLength={200}
                editable={!busy}
              />
            )}

            <Field
              label="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={254}
              editable={!busy}
            />

            {mode !== "verify" && (
              <Field
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                textContentType={
                  mode === "register" ? "newPassword" : "password"
                }
                maxLength={256}
                editable={!busy}
              />
            )}

            {mode === "register" && (
              <>
                <Text style={styles.hint}>
                  Entre 8 et 128 caractères, avec une majuscule, un chiffre
                  et un caractère spécial.
                </Text>

                <Field
                  label="Confirmer le mot de passe"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  maxLength={256}
                  editable={!busy}
                />
              </>
            )}

            {mode === "verify" && (
              <Field
                label="Code de vérification"
                value={code}
                onChangeText={(value) => {
                  setCode(value.replace(/[^0-9]/g, "").slice(0, 6));
                }}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                editable={!busy}
              />
            )}

            {information !== "" && (
              <Text accessibilityLiveRegion="polite" style={styles.information}>
                {information}
              </Text>
            )}

            {error !== "" && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={submit}
              style={[styles.button, busy && styles.disabled]}
            >
              <Text style={styles.buttonText}>
                {busy ? "Veuillez patienter…" : buttonLabel}
              </Text>
            </Pressable>

            {mode === "verify" && (
              <Pressable
                accessibilityRole="button"
                disabled={busy || remainingSeconds > 0}
                onPress={resendCode}
                style={styles.linkButton}
              >
                <Text
                  style={[
                    styles.linkText,
                    (busy || remainingSeconds > 0) && styles.disabled,
                  ]}
                >
                  {remainingSeconds > 0
                    ? `Renvoyer un code dans ${remainingSeconds} s`
                    : "Renvoyer un code"}
                </Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => changeMode(mode === "login" ? "register" : "login")}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                {mode === "login"
                  ? "Créer un compte"
                  : "Retour à la connexion"}
              </Text>
            </Pressable>

            {mode === "login" && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => changeMode("verify")}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  Vérifier mon adresse e-mail
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  brand: {
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 3,
  },
  title: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.light.secondaryText,
    fontSize: 16,
    lineHeight: 23,
  },
  field: {
    gap: 8,
  },
  label: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.light.secondaryText,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
    fontSize: 16,
  },
  hint: {
    color: Colors.light.secondaryText,
    fontSize: 13,
    lineHeight: 19,
  },
  information: {
    color: Colors.light.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: "#B42318",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.light.primary,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  linkButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});