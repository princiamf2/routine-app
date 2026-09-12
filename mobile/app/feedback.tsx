import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Colors } from "@/constants/theme";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { sendActionCompletedEvent } from "@/src/services/eventsService";
import { hasCompletedToday, markCompletedToday } from "@/src/storage/deviceStorage";
import { analyzeMovementMessage } from "@/src/services/movementSafetyBot";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function FeedbackScreen() {
  const params = useLocalSearchParams();
  const previewDay = params.day ? Number(params.day) : null;
  const isPreviewMode = params.preview === "true";
  const [feedback, setFeedback] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  async function finishDay() {
    if (!isPreviewMode) {
      const alreadyDone = await hasCompletedToday();

      if (alreadyDone) {
        router.replace("/");
        return;
      }

      await markCompletedToday();
    }

    await sendActionCompletedEvent(feedback, feedbackText);
    const analysis = analyzeMovementMessage(feedbackText);
    if (analysis.level === "red") {
      router.replace("/therapists");
      return;
    }

    router.replace({
      pathname: "/success",
      params: {
        day: previewDay ?? "",
        preview: isPreviewMode ? "true" : "false",
      },
    });
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.smallTitle}>Ressenti du jour</Text>

        <Text style={styles.title}>Comment tu te sens ?</Text>

        <Text style={styles.subtitle}>
          Note ton ressenti après l’exercice. Cela aide à suivre ton évolution.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Ton score</Text>

          <Text style={styles.value}>{feedback}/10</Text>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={feedback}
            onValueChange={setFeedback}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor={Colors.light.soft}
            thumbTintColor={Colors.light.primary}
          />

          <Text style={styles.scoreHint}>
            1 = très difficile · 10 = très bien
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.textCard}>
          <Text style={styles.sectionTitle}>Quelques mots</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Douleur, fatigue, gêne, amélioration..."
            placeholderTextColor={Colors.light.secondaryText}
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Pressable style={styles.primaryButton} onPress={finishDay}>
          <Text style={styles.buttonText}>Valider mon ressenti</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.secondaryText,
    marginBottom: 34,
    textAlign: "center",
    maxWidth: 320,
  },
  value: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.light.primary,
    marginBottom: 34,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
  textInput: {
    minHeight: 130,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 18,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    textAlignVertical: "top",
  },
  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  scoreCard: {
    width: "100%",
    backgroundColor: Colors.light.card,
    padding: 24,
    borderRadius: 30,
    marginBottom: 18,
    alignItems: "center",
  },

  scoreLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.primary,
    marginBottom: 10,
  },

  slider: {
    width: "100%",
    height: 60,
  },

  scoreHint: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: "center",
  },

  textCard: {
    width: "100%",
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 26,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.light.primary,
    marginBottom: 10,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },
});