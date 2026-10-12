import { useEffect, useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from "react-native";
import { sendAppOpenedEvent } from "@/src/services/eventsService";
import { fetchAnalytics } from "@/src/services/analyticsService";
import { movementsProgram, nutritionProgram } from "@/src/data/program";
import { nutritionImages } from "@/src/data/nutritionImages";
import { Colors } from "@/constants/theme";
import { getCurrentDay } from "@/src/storage/programStorage";
import { hasCompletedToday } from "@/src/storage/deviceStorage";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export default function HomeScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedToday, setCompletedToday] = useState(false);

  const displayedDay = currentDay;
  const todayMovement = movementsProgram.find((p) => p.day === displayedDay);
  const todayNutrition = nutritionProgram.find((p) => p.day === displayedDay);
  const movementImages: any = {
    stretch: require("../../assets/movements/stretch.png"),
    walking: require("../../assets/movements/walking.png"),
    squat: require("../../assets/movements/squat.png"),
    core: require("../../assets/movements/core.png"),
    rest: require("../../assets/movements/rest.png"),
  };
  const helpImage = require("../../assets/images/cards/help.png");
  const statsImage = require("../../assets/images/cards/stats.png");
  const nutritionScale = useSharedValue(1);
  const movementScale = useSharedValue(1);
  const nutritionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nutritionScale.value }],
  }));
  const movementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: movementScale.value }],
  }));

  async function sendEvent() {
    try {
      await sendAppOpenedEvent();
    } catch (error) {
      console.log("Erreur:", error);
    }
  }

  async function loadAnalytics() {
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.log("Erreur stats:", error);
    }
  }

  useEffect(() => {
    sendEvent();
    getCurrentDay().then(setCurrentDay);
    loadAnalytics();
    hasCompletedToday().then(setCompletedToday);
  }, []);

  useFocusEffect(
    useCallback(() => {
      hasCompletedToday().then(setCompletedToday);
      loadAnalytics();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.smallTitle}>Routine 30 jours</Text>

        <Text style={styles.title}>Ton programme du jour</Text>

        <Text style={styles.subtitle}>
          Avance simplement, une petite action à la fois.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            Jour {Math.min(displayedDay, 30)} sur 30
          </Text>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(Math.min(displayedDay, 30) / 30) * 100}%` },
              ]}
            />
          </View>

          {analytics && (
            <Text style={styles.streakText}>
              Série en cours : {analytics.streak} jour(s)
            </Text>
          )}
        </View>
      </Animated.View>

      <View style={styles.cardsGrid}>
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Animated.View style={nutritionAnimatedStyle}>
            <Pressable
              style={styles.heroCard}
              onPressIn={() => {
                nutritionScale.value = withSpring(0.97);
              }}
              onPressOut={() => {
                nutritionScale.value = withSpring(1);
              }}
              onPress={() =>
                router.push("/nutrition")
              }
            >
              <Image
                source={
                  todayNutrition?.nutritionImage
                    ? nutritionImages[
                        todayNutrition.nutritionImage as keyof typeof nutritionImages
                      ]
                    : nutritionImages.eggs
                }
                style={styles.heroImage}
              />

              <View style={styles.heroOverlay}>
                <Text style={styles.heroLabel}>Nutrition</Text>

                <Text style={styles.heroTitle}>
                  {todayNutrition?.nutritionFood ?? "Nutrition"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Animated.View style={movementAnimatedStyle}>
            <Pressable
              style={[
                styles.heroCard,
                completedToday && styles.cardDisabled,
              ]}
              onPressIn={() => {
                movementScale.value = withSpring(0.97);
              }}
              onPressOut={() => {
                movementScale.value = withSpring(1);
              }}
              onPress={() =>
                router.push("/movement")
              }
              disabled={completedToday}
            >
              <Image
                source={
                  todayMovement?.movementImage
                    ? movementImages[todayMovement.movementImage]
                    : movementImages.rest
                }
                style={styles.heroImage}
              />

              <View style={styles.heroOverlay}>
                <Text style={styles.heroLabel}>Exercices</Text>

                <Text style={styles.heroTitle}>
                  {todayMovement?.movementTitle ?? "Exercice"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.smallCardsRow}>
            <Pressable
              style={styles.smallHeroCard}
              onPress={() =>
                router.push({
                  pathname: "/coach",
                  params: {
                    day: displayedDay,
                    movementTitle: todayMovement?.movementTitle ?? "",
                    movementDescription: todayMovement?.movementDescription ?? "",
                  },
                })
              }
            >
              <Image source={helpImage} style={styles.smallHeroImage} />

              <View style={styles.smallHeroOverlay}>
                <Text style={styles.smallHeroLabel}>Aide</Text>
                <Text style={styles.smallHeroTitle}>
                  Douleur ou gêne ?
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.smallHeroCard}
              onPress={() => router.push("/stats")}
            >
              <Image source={statsImage} style={styles.smallHeroImage} />

              <View style={styles.smallHeroOverlay}>
                <Text style={styles.smallHeroLabel}>Progression</Text>
                <Text style={styles.smallHeroTitle}>
                  Mes stats
                </Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {completedToday && (
        <Text style={styles.completedText}>
          Journée validée avec succès.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: Colors.light.background,
  },

  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    color: Colors.light.secondaryText,
    marginBottom: 24,
  },

  progressCard: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 26,
    marginBottom: 22,
  },

  progressLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 12,
  },

  progressBar: {
    height: 10,
    backgroundColor: Colors.light.soft,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },

  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
  },

  streakText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.primary,
  },

  cardsGrid: {
    gap: 16,
  },

  card: {
    backgroundColor: Colors.light.card,
    padding: 22,
    borderRadius: 28,
    minHeight: 155,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  cardDisabled: {
    opacity: 0.6,
  },

  cardEmoji: {
    fontSize: 34,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 8,
  },

  cardHint: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.secondaryText,
  },

  completedText: {
    marginTop: 20,
    color: Colors.light.primary,
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },

  heroCard: {
    height: 240,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 18,
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
    justifyContent: "space-between",
  },

  heroLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  heroTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  smallCardsRow: {
    flexDirection: "row",
    gap: 14,
  },

  smallCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    padding: 18,
    borderRadius: 24,
    minHeight: 145,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  smallCardEmoji: {
    fontSize: 30,
    marginBottom: 12,
  },

  smallCardTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  smallCardText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: Colors.light.text,
  },

  smallHeroCard: {
    flex: 1,
    height: 180,
    borderRadius: 26,
    overflow: "hidden",
  },

  smallHeroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  smallHeroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    justifyContent: "space-between",
  },

  smallHeroLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  smallHeroTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});