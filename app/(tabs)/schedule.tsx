import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function QueueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts, accounts, removePost } = useApp();
  const isWeb = Platform.OS === "web";

  const scheduledPosts = posts.filter((p) => p.status === "scheduled");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? insets.top + 67 : 20,
            paddingHorizontal: 20,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>Queue</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {scheduledPosts.length > 0
            ? `${scheduledPosts.length} post${scheduledPosts.length > 1 ? "s" : ""} scheduled`
            : "No posts scheduled"}
        </Text>
      </View>

      <FlatList
        data={scheduledPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: isWeb ? insets.bottom + 34 + 84 : insets.bottom + 84 + 16,
          },
        ]}
        scrollEnabled={!!scheduledPosts.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clock" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Queue is empty
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Compose a post and select a future date to schedule it
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            accounts={accounts}
            onDelete={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removePost(item.id);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 12,
    gap: 4,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
