import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlatformPill } from "@/components/PlatformPill";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
};

export default function ComposeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accounts, postNow } = useApp();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [posting, setPosting] = useState(false);

  const connectedAccounts = accounts.filter((a) => a.connected);
  const hasContent = content.trim().length > 0;
  const hasPlatforms = selectedPlatforms.length > 0;
  const canPost = hasContent && hasPlatforms && !posting;

  const minLimit = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map((p) => CHAR_LIMITS[p] ?? 2200))
    : 2200;
  const charCount = content.length;
  const isNearLimit = charCount > minLimit * 0.85;
  const isOverLimit = charCount > minLimit;

  const togglePlatform = (id: string) => {
    Haptics.selectionAsync();
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!canPost) return;
    if (connectedAccounts.length === 0) {
      Alert.alert("No accounts connected", "Connect a social media account in the Accounts tab first.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(true);
    try {
      await postNow({
        content,
        platforms: selectedPlatforms,
        imageUri,
        status: "posting",
      });
      setContent("");
      setSelectedPlatforms([]);
      setImageUri(undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setPosting(false);
    }
  };

  const isWeb = Platform.OS === "web";

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
        <Text style={[styles.heading, { color: colors.foreground }]}>New Post</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Publish to your connected platforms
        </Text>

        {/* Platform Selector */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PLATFORMS
          </Text>
          {connectedAccounts.length === 0 ? (
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              No accounts connected yet. Go to Accounts to connect.
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

        {/* Text Compose */}
        <View
          style={[
            styles.composeBox,
            { backgroundColor: colors.card, borderColor: isOverLimit ? colors.destructive : colors.border },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.foreground }]}
            placeholder="What do you want to share?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={65000}
          />
          {imageUri && (
            <View style={styles.imagePreviewRow}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={[styles.removeImage, { backgroundColor: colors.destructive }]}
                onPress={() => setImageUri(undefined)}
              >
                <Feather name="x" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.composeFooter}>
            <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
              <Feather name="image" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text
              style={[
                styles.charCount,
                {
                  color: isOverLimit
                    ? colors.destructive
                    : isNearLimit
                    ? "#F59E0B"
                    : colors.mutedForeground,
                },
              ]}
            >
              {charCount}/{minLimit}
            </Text>
          </View>
        </View>

        {/* Post Button */}
        <TouchableOpacity
          style={[
            styles.postBtn,
            {
              backgroundColor: canPost ? colors.primary : colors.secondary,
              opacity: posting ? 0.7 : 1,
            },
          ]}
          onPress={handlePost}
          activeOpacity={0.8}
          disabled={!canPost}
        >
          {posting ? (
            <Text style={[styles.postBtnText, { color: canPost ? "#fff" : colors.mutedForeground }]}>
              Posting…
            </Text>
          ) : (
            <>
              <Feather
                name="send"
                size={18}
                color={canPost ? "#fff" : colors.mutedForeground}
              />
              <Text style={[styles.postBtnText, { color: canPost ? "#fff" : colors.mutedForeground }]}>
                Post Now
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
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
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
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
    lineHeight: 18,
  },
  composeBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  textInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
  },
  composeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attachBtn: {
    padding: 4,
  },
  charCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  imagePreviewRow: {
    position: "relative",
    alignSelf: "flex-start",
  },
  imagePreview: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  removeImage: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  postBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
