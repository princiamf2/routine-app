import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fetchAnalytics } from "@/src/services/analyticsService";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Colors } from "@/constants/theme";

export default function StatsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const completedDays = analytics?.activeDays ?? 0;
  const streak = analytics?.streak ?? 0;

  async function loadAnalytics() {
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.log("Erreur stats:", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.heroStats}>
        <AnimatedCircularProgress
          size={220}
          width={18}
          fill={(completedDays / 30) * 100}
          tintColor={Colors.light.primary}
          backgroundColor={Colors.light.soft}
          rotation={0}
          lineCap="round"
        >
          {() => (
            <View style={styles.circleContent}>
              <Text style={styles.circleNumber}>{completedDays}/30</Text>
              <Text style={styles.circleLabel}>jours complétés</Text>
            </View>
          )}
        </AnimatedCircularProgress>

        <Text style={styles.streakBig}>
          🔥 Série actuelle : {streak} jours
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F4F1EA",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 22,
    gap: 10,
  },

  heroStats: {
    alignItems: "center",
    marginBottom: 36,
  },

  circleContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  circleNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: Colors.light.text,
  },

  circleLabel: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    marginTop: 6,
  },

  streakBig: {
    marginTop: 26,
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.primary,
  },
});