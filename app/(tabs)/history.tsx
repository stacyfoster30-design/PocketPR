import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
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

type FilterType = "all" | "posted" | "failed";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts, accounts, removePost } = useApp();
  const [filter, setFilter] = React.useState<FilterType>("all");

  const isWeb = Platform.OS === "web";

  const displayedPosts = useMemo(() => {
    const notScheduled = posts.filter((p) => p.status !== "scheduled");
    if (filter === "all") return notScheduled;
    return notScheduled.filter((p) => p.status === filter);
  }, [posts, filter]);

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
        <Text style={[styles.heading, { color: colors.foreground }]}>Activity</Text>

        <View style={[styles.filterRow]}>
          {(["all", "posted", "failed"] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor:
                    filter === f ? colors.primary : colors.secondary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? "#fff" : colors.mutedForeground },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={displayedPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: isWeb ? insets.bottom + 34 + 84 : insets.bottom + 84 + 16,
          },
        ]}
        scrollEnabled={!!displayedPosts.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Posts you publish will appear here
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            accounts={accounts}
            onDelete={() => removePost(item.id)}
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
    gap: 14,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
  },
});
