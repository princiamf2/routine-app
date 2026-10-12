import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Colors } from "@/constants/theme";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { sendActionCompletedEvent } from "@/src/services/eventsService";
import { hasCompletedToday, markCompletedToday } from "@/src/storage/deviceStorage";
import { analyzeMovementMessage } from "@/src/services/movementSafetyBot";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function FeedbackScreen() {
  const params = useLocalSearchParams();
  const sessionDay = params.day ? Number(params.day) : null;
  const [feedback, setFeedback] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);
  const completionSentRef = useRef(false);

  async function finishDay() {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const alreadyDone = await hasCompletedToday();

      if (alreadyDone) {
        router.replace("/");
        return;
      }

      if (!completionSentRef.current) {
        await sendActionCompletedEvent(feedback, feedbackText);
        completionSentRef.current = true;
      }

      await markCompletedToday();

      const analysis = analyzeMovementMessage(feedbackText);

      if (analysis.level === "red") {
        router.replace("/therapists");
        return;
      }

      router.replace({
        pathname: "/success",
        params: {
          day: sessionDay ?? "",
        },
      });
    } catch (error) {
      console.log("Erreur validation du ressenti:", error);

      setSubmitError(
        completionSentRef.current
          ? "La séance a été reçue par le serveur, mais la confirmation locale a échoué. Réessaie pour terminer."
          : "La validation n’a pas pu être confirmée. Vérifie ta connexion et réessaie."
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting || completionSentRef.current}
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
            maxLength={2000}
            editable={!isSubmitting && !completionSentRef.current}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        {submitError !== "" && (
          <Text accessibilityRole="alert" style={styles.submitError}>
            {submitError}
          </Text>
        )}

        <Pressable
          style={styles.primaryButton}
          onPress={finishDay}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting
              ? "Validation en cours…"
              : "Valider mon ressenti"}
          </Text>
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

  submitError: {
    color: "#B42318",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },
});