import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSubscription } from "@/context/SubscriptionContext";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  {
    icon: "auto-fix" as const,
    label: "AI Content Generation",
    desc: "Write platform-perfect posts in seconds",
  },
  {
    icon: "robot-outline" as const,
    label: "AI Chat Advisor",
    desc: "Your always-on social strategy partner",
  },
  {
    icon: "lightbulb-outline" as const,
    label: "Growth Strategy",
    desc: "Tailored roadmaps for every platform",
  },
  {
    icon: "calendar-clock" as const,
    label: "Smart Scheduling",
    desc: "Post at peak engagement times automatically",
  },
];

interface Props {
  visible: boolean;
  onClose?: () => void;
}

export default function ProPaywall({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscribe, restore } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribe();
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restore();
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient
        colors={["#0D0A1F", "#1A1040", "#0B0C10"]}
        style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      >
        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}

        <Animated.View entering={FadeInUp.springify()} style={styles.heroSection}>
          <LinearGradient
            colors={["#7C6FF7", "#9D4FE8"]}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="crown" size={36} color="#fff" />
          </LinearGradient>

          <Text style={styles.headline}>Pocket PR Pro</Text>
          <Text style={styles.subline}>
            Let the AI handle your entire social presence — content, strategy, and timing.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: "#7C6FF720" }]}>
                <MaterialCommunityIcons name={f.icon} size={20} color="#9D97F9" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Feather name="check-circle" size={18} color="#22C55E" />
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.pricingSection}>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.price}>$9.99</Text>
              <Text style={styles.pricePer}> / month</Text>
            </View>
            <Text style={styles.pricingNote}>Cancel anytime · 7-day free trial</Text>
          </View>

          <TouchableOpacity
            style={[styles.subscribeBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubscribe}
            disabled={loading || restoring}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7C6FF7", "#9D4FE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="crown" size={18} color="#fff" />
                  <Text style={styles.subscribeBtnText}>Start Free Trial</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={loading || restoring}
          >
            {restoring ? (
              <ActivityIndicator color="#8A8D9F" size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchase</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            Subscription auto-renews monthly. Cancel in your device's subscription settings.
          </Text>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 8,
  },
  heroSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headline: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: "#fff",
    letterSpacing: -0.5,
  },
  subline: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  featureList: {
    gap: 16,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  featureDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },
  pricingSection: {
    gap: 12,
  },
  pricingCard: {
    backgroundColor: "rgba(124,111,247,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124,111,247,0.3)",
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: "#fff",
  },
  pricePer: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
  },
  pricingNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  subscribeBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  subscribeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  subscribeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#8A8D9F",
  },
  legal: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 16,
  },
});
