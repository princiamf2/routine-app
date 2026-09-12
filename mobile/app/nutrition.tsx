import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { nutritionImages } from "@/src/data/nutritionImages";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { nutritionProgram } from "@/src/data/program";
import { getCurrentDay } from "@/src/storage/programStorage";

export default function NutritionScreen() {
  const params = useLocalSearchParams();
  const previewDay = params.day ? Number(params.day) : null;
  const [currentDay, setCurrentDay] = useState(1);

  const displayedDay = previewDay ?? currentDay;
  const todayNutrition = nutritionProgram.find((p) => p.day === displayedDay);

  useEffect(() => {
    getCurrentDay().then(setCurrentDay);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.smallTitle}>Nutrition du jour</Text>

        <Text style={styles.dayText}>
          Jour {Math.min(displayedDay, 30)} sur 30
        </Text>

        <View style={styles.heroCard}>
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
            <Text style={styles.heroTitle}>
              {todayNutrition?.nutritionFood ?? "Conseil nutrition"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Pourquoi ?</Text>
          <Text style={styles.infoText}>
            {todayNutrition?.nutritionWhy ??
              "Un petit conseil simple pour mieux accompagner ton corps aujourd’hui."}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>À la place de</Text>
          <Text style={styles.infoText}>
            {todayNutrition?.nutritionReplace ??
              "Un choix plus transformé ou moins adapté au quotidien."}
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.sectionTitle}>Simplement</Text>
          <Text style={styles.infoText}>
            {todayNutrition?.nutritionSimple ??
              "Applique une petite action simple aujourd’hui."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
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

  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  dayText: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    marginBottom: 18,
  },

  card: {
    backgroundColor: Colors.light.card,
    padding: 24,
    borderRadius: 30,
    marginBottom: 18,
  },

  nutritionImage: {
    width: "100%",
    height: 190,
    borderRadius: 22,
    marginBottom: 20,
    resizeMode: "cover",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 12,
  },

  description: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.secondaryText,
  },

  infoCard: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 24,
    marginBottom: 14,
  },

  warningCard: {
    backgroundColor: Colors.light.soft,
    padding: 20,
    borderRadius: 24,
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
  },

  footer: {
    padding: 24,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
  },

  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
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
    padding: 24,
  },

  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});