import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAnalytics,
  type UserAnalytics,
} from "@/src/services/analyticsService";

export default function ProfileScreen() {
  const { user, signOut, isBusy } = useAuth();
  const userId = user?.id;

  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [logoutError, setLogoutError] = useState("");

  const logoutRunningRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      let active = true;

      async function loadStats() {
        setLoading(true);
        setStatsError("");
        setAnalytics(null);

        try {
          const data = await fetchAnalytics();

          if (!active) return;

          if (data.userId !== userId) {
            throw new Error("Les statistiques ne correspondent pas au compte.");
          }

          setAnalytics(data);
        } catch {
          if (active) {
            setStatsError(
              "Impossible de charger ta progression. Vérifie ta connexion."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadStats();

      return () => {
        active = false;
      };
    }, [userId, reloadKey])
  );

  async function handleSignOut() {
    if (logoutRunningRef.current || isBusy) return;

    logoutRunningRef.current = true;
    setLogoutError("");

    try {
      await signOut();
    } catch {
      setLogoutError(
        "La déconnexion n’a pas pu être terminée. Vérifie ta connexion et réessaie."
      );
    } finally {
      logoutRunningRef.current = false;
    }
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Mon espace</Text>
        <Text style={styles.title}>Mon profil</Text>
        <Text style={styles.subtitle}>
          Retrouve les informations de ton compte et ta progression.
        </Text>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Mon compte
          </Text>

          <Text style={styles.label}>Nom</Text>
          <Text selectable style={styles.value}>
            {user.displayName}
          </Text>

          <Text style={styles.label}>Adresse e-mail</Text>
          <Text selectable style={styles.value}>
            {user.email}
          </Text>

          <Text style={styles.verified}>✓ Adresse e-mail vérifiée</Text>
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Ma progression
          </Text>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.description}>
                Chargement de ta progression…
              </Text>
            </View>
          ) : statsError ? (
            <>
              <Text accessibilityRole="alert" style={styles.error}>
                {statsError}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => setReloadKey((value) => value + 1)}
                style={styles.retryButton}
              >
                <Text style={styles.buttonText}>Réessayer</Text>
              </Pressable>
            </>
          ) : analytics ? (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Jours complétés au total</Text>
                <Text style={styles.statValue}>{analytics.activeDays}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Série actuelle</Text>
                <Text style={styles.statValue}>
                  {analytics.streak} jour(s)
                </Text>
              </View>

              {analytics.activeDays === 0 && (
                <Text style={styles.description}>
                  Ta progression apparaîtra ici après ta première journée validée.
                </Text>
              )}
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Ma session
          </Text>

          <Text style={styles.description}>
            Ta progression sera conservée lorsque tu te déconnecteras.
          </Text>

          {logoutError !== "" && (
            <Text accessibilityRole="alert" style={styles.error}>
              {logoutError}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Se déconnecter du compte"
            accessibilityState={{ disabled: isBusy, busy: isBusy }}
            disabled={isBusy}
            onPress={handleSignOut}
            style={[styles.logoutButton, isBusy && styles.disabled]}
          >
            <Text style={styles.buttonText}>
              {isBusy ? "Déconnexion en cours…" : "Se déconnecter"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  eyebrow: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  title: {
    color: Colors.light.text,
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.light.secondaryText,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
  },
  label: {
    color: Colors.light.secondaryText,
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 18,
  },
  verified: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: Colors.light.secondaryText,
    fontSize: 15,
    lineHeight: 23,
  },
  loading: {
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  statLabel: {
    color: Colors.light.secondaryText,
    fontSize: 15,
    flexShrink: 1,
  },
  statValue: {
    color: Colors.light.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  error: {
    color: "#B42318",
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 12,
  },
  retryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: Colors.light.soft,
    marginTop: 12,
    padding: 12,
  },
  logoutButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    marginTop: 20,
    padding: 14,
  },
  buttonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.5,
  },
});