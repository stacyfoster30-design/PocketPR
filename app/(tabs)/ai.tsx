import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
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

import { PlatformPill } from "@/components/PlatformPill";
import { useBusiness } from "@/context/BusinessContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { generatePosts } from "@/lib/api";

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "humorous", label: "Humorous" },
  { id: "inspirational", label: "Inspirational" },
  { id: "promotional", label: "Promotional" },
] as const;

type Tone = (typeof TONES)[number]["id"];

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accounts, postNow } = useApp();
  const { profile } = useBusiness();
  const { isPro } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const isWeb = Platform.OS === "web";

  if (!isPro) {
    return (
      <>
        <ProPaywall visible={true} />
      </>
    );
  }

  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, string>>({});
  const [editedPosts, setEditedPosts] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set());

  const connectedAccounts = accounts.filter((a) => a.connected);

  const togglePlatform = (id: string) => {
    Haptics.selectionAsync();
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!brief.trim() || selectedPlatforms.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setGeneratedPosts({});
    setEditedPosts({});
    setPostedIds(new Set());
    try {
      const posts = await generatePosts({
        brief: brief.trim(),
        platforms: selectedPlatforms,
        tone,
        businessName: profile.name || undefined,
        businessDescription: profile.description || undefined,
      });
      setGeneratedPosts(posts);
      setEditedPosts(posts);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (platformId: string) => {
    const content = editedPosts[platformId];
    if (!content) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(platformId);
    try {
      await postNow({ content, platforms: [platformId], status: "posting" });
      setPostedIds((prev) => new Set([...prev, platformId]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setPosting(null);
    }
  };

  const handlePostAll = async () => {
    const unposted = selectedPlatforms.filter(
      (p) => editedPosts[p] && !postedIds.has(p)
    );
    if (!unposted.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPosting("all");
    try {
      const content = Object.values(editedPosts)[0] ?? "";
      await postNow({ content, platforms: unposted, status: "posting" });
      setPostedIds(new Set(selectedPlatforms));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setPosting(null);
    }
  };

  const canGenerate = brief.trim().length > 0 && selectedPlatforms.length > 0 && !loading;
  const hasResults = Object.keys(generatedPosts).length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: isWeb ? insets.top + 67 : 16,
            paddingBottom: isWeb ? insets.bottom + 34 + 84 : insets.bottom + 84 + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.heading, { color: colors.foreground }]}>AI Manager</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Generate tailored posts for every platform
            </Text>
          </View>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + "20" }]}>
            <MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />
          </View>
        </View>

        {/* Platform selector */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>PLATFORMS</Text>
          {connectedAccounts.length === 0 ? (
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              Connect accounts in the Accounts tab first
            </Text>
          ) : (
            <View style={styles.pillRow}>
              {connectedAccounts.map((acc) => (
                <PlatformPill
                  key={acc.id}
                  platformId={acc.id}
                  color={acc.color}
                  label={acc.name}
                  selected={selectedPlatforms.includes(acc.id)}
                  onPress={() => togglePlatform(acc.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Brief input */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>CONTENT BRIEF</Text>
          <TextInput
            style={[styles.briefInput, { color: colors.foreground }]}
            placeholder={`e.g. "We're launching our summer sale — 30% off all items this weekend only"`}
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={brief}
            onChangeText={setBrief}
          />
        </View>

        {/* Tone selector */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>TONE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.toneRow}>
              {TONES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => { setTone(t.id); Haptics.selectionAsync(); }}
                  style={[
                    styles.toneBtn,
                    {
                      backgroundColor: tone === t.id ? colors.primary : colors.secondary,
                      borderColor: tone === t.id ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toneBtnText, { color: tone === t.id ? "#fff" : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateBtn,
            { backgroundColor: canGenerate ? colors.primary : colors.secondary },
          ]}
          onPress={handleGenerate}
          activeOpacity={0.8}
          disabled={!canGenerate}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateBtnText}>Generating…</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="auto-fix"
                size={20}
                color={canGenerate ? "#fff" : colors.mutedForeground}
              />
              <Text style={[styles.generateBtnText, { color: canGenerate ? "#fff" : colors.mutedForeground }]}>
                Generate Posts
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated posts */}
        {hasResults && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.foreground }]}>
                Generated Posts
              </Text>
              <TouchableOpacity
                onPress={handlePostAll}
                style={[styles.postAllBtn, { backgroundColor: colors.accent }]}
                disabled={posting !== null}
                activeOpacity={0.8}
              >
                <Feather name="send" size={13} color="#fff" />
                <Text style={styles.postAllText}>Post All</Text>
              </TouchableOpacity>
            </View>

            {selectedPlatforms.map((platformId, i) => {
              const account = accounts.find((a) => a.id === platformId);
              if (!account || !generatedPosts[platformId]) return null;
              const isPosted = postedIds.has(platformId);
              const isThisPosting = posting === platformId;

              return (
                <Animated.View
                  key={platformId}
                  entering={FadeInDown.delay(i * 80).springify()}
                  style={[
                    styles.postCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isPosted ? colors.success + "66" : colors.border,
                    },
                  ]}
                >
                  <View style={styles.postCardHeader}>
                    <View style={[styles.platformDot, { backgroundColor: account.color + "22" }]}>
                      <MaterialCommunityIcons
                        name={
                          platformId === "twitter" ? "twitter" :
                          platformId === "instagram" ? "instagram" :
                          platformId === "facebook" ? "facebook" :
                          platformId === "linkedin" ? "linkedin" : "music-note"
                        }
                        size={16}
                        color={account.color}
                      />
                    </View>
                    <Text style={[styles.postCardPlatform, { color: colors.foreground }]}>
                      {account.name}
                    </Text>
                    {isPosted ? (
                      <View style={[styles.postedBadge, { backgroundColor: colors.success + "22" }]}>
                        <Feather name="check" size={12} color={colors.success} />
                        <Text style={[styles.postedText, { color: colors.success }]}>Posted</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handlePost(platformId)}
                        style={[styles.postOneBtn, { backgroundColor: account.color }]}
                        disabled={posting !== null}
                        activeOpacity={0.8}
                      >
                        {isThisPosting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Feather name="send" size={13} color="#fff" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={[styles.postEditInput, { color: colors.foreground }]}
                    value={editedPosts[platformId] ?? ""}
                    onChangeText={(v) =>
                      setEditedPosts((prev) => ({ ...prev, [platformId]: v }))
                    }
                    multiline
                    editable={!isPosted}
                  />
                  <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                    {(editedPosts[platformId] ?? "").length} chars
                  </Text>
                </Animated.View>
              );
            })}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 2,
  },
  aiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  briefInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: "top",
  },
  toneRow: {
    flexDirection: "row",
    gap: 8,
  },
  toneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  toneBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  generateBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  postAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postAllText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  postCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  platformDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  postCardPlatform: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  postedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  postedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  postOneBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  postEditInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
    minHeight: 60,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "right",
  },
});
