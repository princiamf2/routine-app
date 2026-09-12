import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, Pressable, StyleSheet, Image } from "react-native";
import { hasCompletedToday } from "@/src/storage/deviceStorage";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/theme";
import { getCurrentDay } from "@/src/storage/programStorage";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  AdaptiveSession,
  fetchAdaptiveSession,
} from "@/src/services/adaptiveProgramService";
import {
  clearMovementSessionProgress,
  getMovementSessionProgress,
  saveMovementSessionProgress,
} from "@/src/storage/sessionStorage";

function getRestSeconds(restText: string) {
  if (restText.includes("2-3")) {
    return 150;
  }
  if (restText.includes("3")) {
    return 180;
  }
  if (restText.includes("2")) {
    return 120;
  }
  return 60;
}

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds/60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getLevelLabel(levels: string[]) {
  if (levels.length === 1 && levels[0] === "green") {
    return "🟢 Niveau débutant";
  }

  if (levels.length === 1 && levels[0] === "orange") {
    return "🟠 Niveau intermédiaire";
  }

  if (levels.length === 1 && levels[0] === "red") {
    return "🔴 Niveau avancé";
  }

  if (levels.includes("green") && levels.includes("orange")) {
    return "🟢🟠 Niveau progressif";
  }

  if (levels.includes("orange") && levels.includes("red")) {
    return "🟠🔴 Niveau progressif";
  }

  return "Programme adapté";
}

export default function MovementScreen() {
  const params = useLocalSearchParams();
  const previewDay = params.day ? Number(params.day) : null;
  const isPreviewMode = params.preview === "true";

  const [currentDay, setCurrentDay] = useState(1);
  const [session, setSession] = useState<AdaptiveSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);

  const displayedDay = previewDay ?? currentDay;
  const currentExercise = session?.exercises[currentExerciseIndex];
  const isLastExercise =
    session && currentExerciseIndex === session.exercises.length - 1;

  const movementImages: any = {
    stretch: require("../assets/movements/stretch.png"),
    walking: require("../assets/movements/walking.png"),
    squat: require("../assets/movements/squat.png"),
    core: require("../assets/movements/core.png"),
    rest: require("../assets/movements/rest.png"),
  };

  async function finishMovement() {
    if (!session) return;

    const alreadyDone = await hasCompletedToday();

    if (alreadyDone) {
      router.back();
      return;
    }

    await clearMovementSessionProgress();

    router.push({
      pathname: "/feedback",
      params: {
        day: displayedDay,
        preview: isPreviewMode ? "true" : "false",
      },
    });
  }

  function finishCurrentExercise() {
    if (!session) return;
    if (isLastExercise) {
      finishMovement();
      return;
    }
    setRestSecondsLeft(getRestSeconds(session.progression.rest));
    setIsResting(true);
  }

  function goToNextExercise() {
    if (!session) return;
    setIsResting(false);
    setRestSecondsLeft(0);
    setCurrentExerciseIndex(currentExerciseIndex + 1);
  }

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        setError("");
        setCurrentExerciseIndex(0);

        const day = await getCurrentDay();
        setCurrentDay(day);

        const targetDay = previewDay ?? day;
        const adaptiveSession = await fetchAdaptiveSession(targetDay);

        setSession(adaptiveSession);
        
        const savedProgress = await getMovementSessionProgress();

        if (savedProgress && savedProgress.day === targetDay) {
          setCurrentExerciseIndex(savedProgress.currentExerciseIndex);
          setIsResting(savedProgress.isResting);
          setRestSecondsLeft(savedProgress.restSecondsLeft);
        }
      } catch (error) {
        console.log("Erreur séance adaptée:", error);
        setError("Impossible de charger la séance du jour.");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [previewDay]);

  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setRestSecondsLeft((previous) => previous - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isResting, restSecondsLeft]);

  useEffect(() => {
    if (!isResting) {
      return;
    }
    if (restSecondsLeft === 0) {
      goToNextExercise();
    }
  }, [restSecondsLeft, isResting]);

  useEffect(() => {
    if (!session) {
      return;
    }

    saveMovementSessionProgress({
      day: displayedDay,
      currentExerciseIndex,
      isResting,
      restSecondsLeft,
    });
  }, [session, displayedDay, currentExerciseIndex, isResting, restSecondsLeft]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.smallTitle}>Séance adaptée du jour</Text>

          <Text style={styles.dayText}>
            Jour {Math.min(displayedDay, 30)} sur 30
          </Text>

          {session && (
            <Text style={styles.adaptiveText}>
              Exercice {currentExerciseIndex + 1} / {session.exercises.length} ·{" "}
              Série actuelle : {session.streak} jours
            </Text>
          )}
          {session && (
            <Text style={styles.levelText}>
              {getLevelLabel(session.allowedLevels)}
            </Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.heroCard}>
            <Image
              source={
                currentExercise?.image
                  ? movementImages[currentExercise.image]
                  : movementImages.rest
              }
              style={styles.heroImage}
            />

            <View style={styles.heroOverlay}>
              <Text style={styles.heroLabel}>Exercice</Text>

              <Text style={styles.heroTitle}>
                {currentExercise?.title ?? "Séance adaptée"}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.infoCard}>
            {loading ? (
              <>
                <Text style={styles.sectionTitle}>Chargement</Text>
                <Text style={styles.infoText}>Chargement de ta séance...</Text>
              </>
            ) : error ? (
              <>
                <Text style={styles.sectionTitle}>Erreur</Text>
                <Text style={styles.infoText}>{error}</Text>
              </>
            ) : isResting ? (
              <>
                <Text style={styles.sectionTitle}>Temps de repos</Text>

                <Text style={styles.restTimer}>
                  {formatSeconds(restSecondsLeft)}
                </Text>

                <Text style={styles.infoText}>
                  Respire tranquillement avant de passer à l’exercice suivant.
                </Text>
              </>
            ) : currentExercise && session ? (
              <>
                <Text style={styles.sectionTitle}>Instructions</Text>

                <Text style={styles.exerciseTitle}>{currentExercise.title}</Text>

                <Text style={styles.infoText}>
                  {currentExercise.category} · Niveau {currentExercise.level}
                </Text>

                <Text style={styles.infoText}>
                  {session.progression.series} séries ×{" "}
                  {session.progression.reps} répétitions
                </Text>

                <Text style={styles.infoText}>
                  Repos : {session.progression.rest}
                </Text>
                {session.progression.note && (
                  <Text style={styles.adaptationNote}>
                    {session.progression.note}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Aucune séance</Text>
                <Text style={styles.infoText}>
                  Aucune séance disponible pour aujourd’hui.
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={styles.tipCard}>
            <Text style={styles.sectionTitle}>Conseil</Text>

            <Text style={styles.infoText}>
              Respire lentement, garde une intensité confortable et arrête si la
              douleur augmente.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/coach",
                params: {
                  day: displayedDay,
                  movementTitle: currentExercise?.title ?? "",
                  movementDescription: session
                    ? `${session.progression.series} séries × ${session.progression.reps} répétitions · repos ${session.progression.rest}`
                    : "",
                  preview: isPreviewMode ? "true" : "false",
                },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>
              J’ai une douleur ou une gêne
            </Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            onPress={isResting ? goToNextExercise : finishCurrentExercise}
          >
            <Text style={styles.buttonText}>
              {isResting
                ? "Passer le repos"
                : isLastExercise
                ? "J’ai terminé la séance"
                : "J’ai terminé cet exercice"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineButtonText}>Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 20,
  },

  footer: {
    padding: 24,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  outlineButtonText: {
    color: Colors.light.primary,
    fontSize: 17,
    fontWeight: "800",
  },

  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 18,
  },

  adaptiveText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 18,
  },

  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  secondaryButton: {
    marginBottom: 14,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },

  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "800",
  },

  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },

  dayText: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    marginBottom: 8,
  },

  heroCard: {
    height: 360,
    borderRadius: 30,
    marginBottom: 18,
    overflow: "hidden",
    backgroundColor: Colors.light.card,
  },

  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "space-between",
  },

  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "white",
  },

  infoCard: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 24,
    marginBottom: 14,
  },

  tipCard: {
    backgroundColor: Colors.light.soft,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.light.primary,
    marginBottom: 8,
  },

  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: 4,
  },

  exerciseTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 10,
  },

  heroLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  restTimer: {
    fontSize: 54,
    fontWeight: "900",
    color: Colors.light.primary,
    textAlign: "center",
    marginVertical: 20,
  },

  levelText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.primary,
    marginBottom: 16,
  },

  adaptationNote: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFF3CD",
    color: "#856404",
    fontSize: 15,
    fontWeight: "600",
  },
});