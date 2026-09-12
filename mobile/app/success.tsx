import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Colors } from "@/constants/theme";

export default function SuccessScreen() {
  const params = useLocalSearchParams();
  const day = params.day ? Number(params.day) : null;

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(500)} style={styles.badge}>
        <Text style={styles.badgeText}>✓</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Image
          source={require("../assets/images/cards/success.png")}
          style={styles.image}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={styles.smallTitle}>Journée validée</Text>

        <Text style={styles.title}>Bravo, c’est fait</Text>

        <Text style={styles.subtitle}>
          Tu as terminé ton activité du jour. Reviens demain pour continuer ta progression.
        </Text>

        {day && (
          <Text style={styles.dayText}>
            Jour {Math.min(day, 30)} sur 30
          </Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.replace("/")}>
          <Text style={styles.buttonText}>Retour à l’accueil</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: Colors.light.background,
    alignItems: "center",
  },

  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  badgeText: {
    color: "white",
    fontSize: 38,
    fontWeight: "900",
  },

  image: {
    width: 320,
    height: 300,
    borderRadius: 32,
    marginBottom: 30,
  },

  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
    textAlign: "center",
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    color: Colors.light.secondaryText,
    marginBottom: 20,
    maxWidth: 330,
  },

  dayText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.primary,
    textAlign: "center",
  },

  footer: {
    width: "100%",
    marginTop: "auto",
    paddingBottom: 20,
  },

  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
});