import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import ProPaywall from "@/components/ProPaywall";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBusiness } from "@/context/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { streamChat, type ChatMessage } from "@/lib/api";

const SUGGESTIONS = [
  "Write a LinkedIn post about our latest product launch",
  "What hashtags work best for Instagram fitness content?",
  "Create a week-long posting schedule for our brand",
  "How do I grow engagement on TikTok?",
  "Write a Facebook ad for a 20% off sale",
];

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const colors = useColors();
  const isAI = message.role === "assistant";

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      style={[styles.bubbleRow, isAI ? styles.bubbleRowLeft : styles.bubbleRowRight]}
    >
      {isAI && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <MaterialCommunityIcons name="robot-outline" size={16} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isAI
            ? { backgroundColor: colors.card, borderColor: colors.border }
            : { backgroundColor: colors.primary },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isAI ? colors.foreground : "#fff" },
          ]}
        >
          {message.content}
          {isStreaming && <Text style={{ color: colors.primary }}>▌</Text>}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useBusiness();
  const { isPro } = useSubscription();
  const scrollRef = useRef<ScrollView>(null);

  if (!isPro) {
    return <ProPaywall visible={true} />;
  }
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: profile.name
        ? `Hi! I'm your AI social media manager for ${profile.name}. I can write posts, build content strategies, suggest hashtags, and help you grow across every platform. What would you like to do?`
        : "Hi! I'm your AI social media manager. I can write posts, build content strategies, suggest hashtags, and help you grow across every platform. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, streamingContent]);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || streaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setStreaming(true);
    setStreamingContent("");

    try {
      const full = await streamChat(
        updatedHistory,
        profile.name || undefined,
        profile.description || undefined,
        (partial) => setStreamingContent(partial),
      );

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setStreamingContent("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." },
      ]);
      setStreamingContent("");
    } finally {
      setStreaming(false);
    }
  };

  const clearChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([
      {
        role: "assistant",
        content: profile.name
          ? `Hi! I'm your AI social media manager for ${profile.name}. How can I help?`
          : "Hi! I'm your AI social media manager. How can I help?",
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? insets.top + 67 : 20,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + "20" }]}>
          <MaterialCommunityIcons name="robot-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Chat</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Your social media strategist
          </Text>
        </View>
        <TouchableOpacity onPress={clearChat} hitSlop={8}>
          <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.messages,
          { paddingBottom: isWeb ? insets.bottom + 34 + 80 : 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {streaming && streamingContent && (
          <MessageBubble
            message={{ role: "assistant", content: streamingContent }}
            isStreaming
          />
        )}
        {streaming && !streamingContent && (
          <View style={styles.typingRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <MaterialCommunityIcons name="robot-outline" size={16} color={colors.primary} />
            </View>
            <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}

        {/* Suggestions (only at start) */}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => send(s)}
                style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: isWeb ? insets.bottom + 34 + 84 : insets.bottom + 84 + 4,
          },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          placeholder="Ask your AI social media manager…"
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={() => send()}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={() => send()}
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !streaming ? colors.primary : colors.secondary },
          ]}
          disabled={!input.trim() || streaming}
          activeOpacity={0.8}
        >
          <Feather
            name="send"
            size={18}
            color={input.trim() && !streaming ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  messages: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  typingRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  suggestions: {
    marginTop: 8,
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  suggestionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
