import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import ProPaywall from "@/components/ProPaywall";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  ActivityIndicator,
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
import { getStrategy, type StrategyTip } from "@/lib/api";

const PLATFORM_NAMES: Record<string, string> = {
  twitter: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  all: "All Platforms",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2",
  instagram: "#E1306C",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  tiktok: "#FF0050",
  all: "#7C6FF7",
};

function TipCard({ tip, index }: { tip: StrategyTip; index: number }) {
  const colors = useColors();
  const platformColor = PLATFORM_COLORS[tip.platform] ?? colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify()}
      style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.tipHeader}>
        <View style={[styles.tipDot, { backgroundColor: platformColor + "22" }]}>
          <View style={[styles.tipDotInner, { backgroundColor: platformColor }]} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
          <Text style={[styles.tipPlatform, { color: platformColor }]}>
            {PLATFORM_NAMES[tip.platform] ?? tip.platform}
          </Text>
        </View>
      </View>
      <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>{tip.description}</Text>
    </Animated.View>
  );
}

export default function StrategyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useBusiness();
  const { accounts } = useApp();
  const { isPro } = useSubscription();
  const isWeb = Platform.OS === "web";

  if (!isPro) {
    return <ProPaywall visible={true} />;
  }

  const connectedPlatforms = accounts.filter((a) => a.connected).map((a) => a.id);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<StrategyTip[]>([]);
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [hasResult, setHasResult] = useState(false);

  const canGenerate = profile.name.trim().length > 0 && connectedPlatforms.length > 0 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setHasResult(false);
    try {
      const result = await getStrategy({
        businessName: profile.name,
        businessDescription: profile.description || undefined,
        platforms: connectedPlatforms,
        goals: profile.goals || undefined,
      });
      setTips(result.tips ?? []);
      setSchedule(result.postingSchedule ?? {});
      setHasResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? insets.top + 67 : 16,
          paddingBottom: isWeb ? insets.bottom + 34 + 84 : insets.bottom + 84 + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>Strategy</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        AI-powered content strategy for your business
      </Text>

      {/* Business profile */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>BUSINESS PROFILE</Text>

        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="briefcase-outline" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Business name"
            placeholderTextColor={colors.mutedForeground}
            value={profile.name}
            onChangeText={(v) => updateProfile({ name: v })}
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="text-box-outline" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="What does your business do?"
            placeholderTextColor={colors.mutedForeground}
            value={profile.description}
            onChangeText={(v) => updateProfile({ description: v })}
            multiline
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <Feather name="target" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Marketing goals (e.g. increase brand awareness)"
            placeholderTextColor={colors.mutedForeground}
            value={profile.goals}
            onChangeText={(v) => updateProfile({ goals: v })}
          />
        </View>
      </View>

      {/* Connected platforms */}
      {connectedPlatforms.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>ACTIVE PLATFORMS</Text>
          <View style={styles.pillRow}>
            {accounts.filter((a) => a.connected).map((acc) => (
              <PlatformPill
                key={acc.id}
                platformId={acc.id}
                color={acc.color}
                label={acc.name}
                selected
              />
            ))}
          </View>
        </View>
      )}

      {connectedPlatforms.length === 0 && (
        <View style={[styles.emptyPlatforms, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="alert-circle" size={16} color={colors.mutedForeground} />
          <Text style={[styles.emptyPlatformsText, { color: colors.mutedForeground }]}>
            Connect social accounts in the Accounts tab to get platform-specific strategy tips
          </Text>
        </View>
      )}

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
            <Text style={styles.generateBtnText}>Building strategy…</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={20}
              color={canGenerate ? "#fff" : colors.mutedForeground}
            />
            <Text style={[styles.generateBtnText, { color: canGenerate ? "#fff" : colors.mutedForeground }]}>
              Generate Strategy
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Results */}
      {hasResult && (
        <>
          {/* Posting schedule */}
          {Object.keys(schedule).length > 0 && (
            <Animated.View
              entering={FadeInDown.springify()}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>POSTING SCHEDULE</Text>
              {Object.entries(schedule).map(([platformId, freq]) => {
                const acc = accounts.find((a) => a.id === platformId);
                if (!acc) return null;
                return (
                  <View key={platformId} style={styles.scheduleRow}>
                    <View style={[styles.scheduleIcon, { backgroundColor: acc.color + "20" }]}>
                      <MaterialCommunityIcons
                        name={
                          platformId === "twitter" ? "twitter" :
                          platformId === "instagram" ? "instagram" :
                          platformId === "facebook" ? "facebook" :
                          platformId === "linkedin" ? "linkedin" : "music-note"
                        }
                        size={14}
                        color={acc.color}
                      />
                    </View>
                    <Text style={[styles.schedulePlatform, { color: colors.foreground }]}>{acc.name}</Text>
                    <Text style={[styles.scheduleFreq, { color: colors.primary }]}>{freq}</Text>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Strategy Tips
              </Text>
              {tips.map((tip, i) => (
                <TipCard key={i} tip={tip} index={i} />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  flex: { flex: 1 },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: -8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyPlatforms: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  emptyPlatformsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
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
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  tipDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  tipDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  tipPlatform: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  tipDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduleIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  schedulePlatform: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  scheduleFreq: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
