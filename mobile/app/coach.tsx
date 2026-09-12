import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from "react-native";
import { Colors } from "@/constants/theme";
import { CoachResponse, sendCoachMessage } from "@/src/services/coachService";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  coachResponse?: CoachResponse;
};

export default function CoachScreen() {
    const params = useLocalSearchParams();
    const movementTitle = typeof params.movementTitle === "string" ? params.movementTitle : "";
    const movementDescription = typeof params.movementDescription === "string" ? params.movementDescription : "";
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
      {
        id: 1,
        role: "assistant",
        text:
        movementTitle
          ? `Bonjour, je suis ton assistant mouvement. Tu es sur l’exercice : ${movementTitle}. Décris-moi ce que tu ressens : douleur, gêne, fatigue, raideur ou inquiétude.`
          : "Bonjour, je suis ton assistant mouvement. Décris-moi ce que tu ressens pendant ou après l'exercice : douleur, gêne, fatigue, raideur ou inquiétude."
      },
    ]);

    const scrollRef = useRef<ScrollView>(null);

    async function sendMessage() {
      const cleanText = input.trim();

      if (!cleanText) {
        return;
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        text: cleanText,
      };

      setMessages((previous) => [...previous, userMessage]);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setInput("");
      Keyboard.dismiss();

      try {
        const history = messages.map((message) => ({
          role: message.role,
          text: message.text,
        }));

        const response = await sendCoachMessage(cleanText, history, movementTitle, movementDescription);

        const assistantText = response.followUpQuestion
          ? `${response.reply}\n\n${response.followUpQuestion}`
          : response.reply;

        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          text: assistantText,
          coachResponse: response,
        };

        setMessages((previous) => [...previous, assistantMessage]);

        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: Date.now() + 2,
          role: "assistant",
          text: "Désolé, je n’arrive pas à analyser ton message pour le moment. Vérifie que le backend est bien lancé.",
        };

        setMessages((previous) => [...previous, errorMessage]);
      }
    }
    return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.smallTitle}>Assistant mouvement</Text>
        <Text style={styles.title}>Coach sécurité</Text>
        <Text style={styles.subtitle}>
          Pose une question ou décris une sensation pendant l’exercice.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                message.role === "user"
                  ? styles.userBubbleText
                  : styles.assistantBubbleText,
              ]}
            >
              {message.text}
            </Text>

            {message.coachResponse?.shouldShowTherapists && (
              <Pressable
                style={styles.therapistButton}
                onPress={() => router.push("/therapists")}
              >
                <Text style={styles.therapistButtonText}>
                  Trouver un thérapeute proche
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          placeholder="Écris ta sensation..."
          placeholderTextColor={Colors.light.secondaryText}
          value={input}
          onChangeText={setInput}
          multiline
          textAlignVertical="top"
        />

        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },

  smallTitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.light.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.secondaryText,
  },

  messagesContainer: {
    flex: 1,
  },

  messagesContent: {
    padding: 24,
    paddingTop: 10,
    gap: 14,
  },

  bubble: {
    maxWidth: "85%",
    padding: 16,
    borderRadius: 22,
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 6,
  },

  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 6,
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 23,
  },

  userBubbleText: {
    color: "white",
    fontWeight: "600",
  },

  assistantBubbleText: {
    color: Colors.light.text,
  },

  therapistButton: {
    marginTop: 14,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  therapistButtonText: {
    color: "white",
    fontWeight: "800",
  },

  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.soft,
  },

  input: {
    minHeight: 52,
    maxHeight: 110,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 10,
  },

  sendButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 10,
  },

  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },

  backButton: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
  },

  backButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "800",
  },
});