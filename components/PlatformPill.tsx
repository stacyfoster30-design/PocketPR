import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const PLATFORM_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  twitter: "twitter",
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
  tiktok: "music-note",
};

interface PlatformPillProps {
  platformId: string;
  color: string;
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  status?: "success" | "failed" | "pending";
}

export function PlatformPill({
  platformId,
  color,
  label,
  selected,
  onPress,
  size = "md",
  status,
}: PlatformPillProps) {
  const colors = useColors();
  const iconName = PLATFORM_ICONS[platformId] ?? "earth";
  const isSmall = size === "sm";

  const statusColor = status === "success" ? colors.success : status === "failed" ? colors.destructive : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? color + "22" : colors.secondary,
          borderColor: selected ? color : colors.border,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 4 : 8,
          borderRadius: isSmall ? 20 : 24,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={isSmall ? 12 : 16}
        color={selected ? color : colors.mutedForeground}
      />
      {!isSmall && (
        <Text
          style={[
            styles.label,
            { color: selected ? color : colors.mutedForeground, fontSize: 13 },
          ]}
        >
          {label}
        </Text>
      )}
      {status && (
        <View
          style={[styles.statusDot, { backgroundColor: statusColor }]}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Inter_500Medium",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
