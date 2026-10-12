import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const {
    status,
    user,
    error,
    isBusy,
    restoreSession,
  } = useAuth();

  const dark = colorScheme === "dark";
  const colors = dark ? Colors.dark : Colors.light;
  const signedIn = status === "signedIn" && user !== null;

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      {status === "loading" ? (
        <View
          style={[
            styles.centered,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.message, { color: colors.text }]}
          >
            Vérification de ta connexion…
          </Text>
        </View>
      ) : status === "error" ? (
        <View
          style={[
            styles.centered,
            { backgroundColor: colors.background },
          ]}
        >
          <Text
            accessibilityRole="alert"
            style={[styles.message, { color: colors.text }]}
          >
            {error ?? "Impossible de vérifier la connexion."}
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => {
              void restoreSession();
            }}
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isBusy && styles.disabled,
            ]}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <Stack key={user?.id ?? "signed-out"}>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen
              name="auth"
              options={{ headerShown: false }}
            />
          </Stack.Protected>

          <Stack.Protected guard={signedIn}>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="movement" />
            <Stack.Screen name="nutrition" />
            <Stack.Screen name="feedback" />
            <Stack.Screen name="success" />
            <Stack.Screen name="coach" />
            <Stack.Screen name="therapists" />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                title: "Modal",
              }}
            />
          </Stack.Protected>
        </Stack>
      )}

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 440,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
});