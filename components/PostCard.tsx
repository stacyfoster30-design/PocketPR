import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { PlatformPill } from "./PlatformPill";
import type { PlatformAccount, ScheduledPost } from "@/context/AppContext";

interface PostCardProps {
  post: ScheduledPost;
  accounts: PlatformAccount[];
  onDelete?: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function timeUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

const STATUS_CONFIG = {
  posted: { label: "Posted", color: "#22C55E" },
  scheduled: { label: "Scheduled", color: "#F59E0B" },
  posting: { label: "Posting…", color: "#7C6FF7" },
  failed: { label: "Failed", color: "#EF4444" },
};

export function PostCard({ post, accounts, onDelete }: PostCardProps) {
  const colors = useColors();
  const statusConf = STATUS_CONFIG[post.status];
  const time =
    post.status === "posted" && post.postedAt
      ? timeAgo(post.postedAt)
      : post.status === "scheduled"
      ? timeUntil(post.scheduledAt)
      : "";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusConf.color + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
          <Text style={[styles.statusText, { color: statusConf.color }]}>
            {statusConf.label}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {time ? (
            <Text style={[styles.time, { color: colors.mutedForeground }]}>{time}</Text>
          ) : null}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} hitSlop={8}>
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text
        style={[styles.content, { color: colors.foreground }]}
        numberOfLines={3}
      >
        {post.content}
      </Text>

      <View style={styles.platforms}>
        {post.platforms.map((pid) => {
          const account = accounts.find((a) => a.id === pid);
          if (!account) return null;
          const status = post.results?.[pid];
          return (
            <PlatformPill
              key={pid}
              platformId={pid}
              color={account.color}
              label={account.name}
              selected
              size="sm"
              status={status}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  content: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  platforms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});
