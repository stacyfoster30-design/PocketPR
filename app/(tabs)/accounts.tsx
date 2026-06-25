import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PlatformAccount } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const PLATFORM_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  twitter: "twitter",
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
  tiktok: "music-note",
};

const SIGNUP_URLS: Record<string, { personal: string; business: string }> = {
  twitter: {
    personal: "https://twitter.com/i/flow/signup",
    business: "https://business.twitter.com/en/start.html",
  },
  instagram: {
    personal: "https://www.instagram.com/accounts/emailsignup/",
    business: "https://business.instagram.com/",
  },
  facebook: {
    personal: "https://www.facebook.com/r.php",
    business: "https://www.facebook.com/pages/create",
  },
  linkedin: {
    personal: "https://www.linkedin.com/signup",
    business: "https://www.linkedin.com/company/setup/new/",
  },
  tiktok: {
    personal: "https://www.tiktok.com/signup",
    business: "https://ads.tiktok.com/i18n/signup",
  },
};

const API_HELP: Record<string, { label: string; url: string }> = {
  twitter: { label: "Get API keys at developer.twitter.com", url: "https://developer.twitter.com/en/portal/dashboard" },
  instagram: { label: "Get token via Meta Developer App", url: "https://developers.facebook.com/apps/" },
  facebook: { label: "Get Page Access Token via Meta", url: "https://developers.facebook.com/apps/" },
  linkedin: { label: "Get token at developer.linkedin.com", url: "https://www.linkedin.com/developers/apps" },
  tiktok: { label: "Get credentials at developers.tiktok.com", url: "https://developers.tiktok.com/" },
};

type PanelMode = "none" | "create" | "connect";

function AccountRow({ account }: { account: PlatformAccount }) {
  const colors = useColors();
  const { connectAccount, disconnectAccount } = useApp();
  const [mode, setMode] = useState<PanelMode>("none");
  const [handle, setHandle] = useState(account.handle ?? "");
  const [token, setToken] = useState(account.accessToken ?? "");
  const [secret, setSecret] = useState(account.accessSecret ?? "");
  const iconName = PLATFORM_ICONS[account.id] ?? "earth";
  const signupUrls = SIGNUP_URLS[account.id];
  const apiHelp = API_HELP[account.id];

  const openUrl = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  const handleConnect = () => {
    if (!handle.trim() || !token.trim()) {
      Alert.alert("Missing fields", "Please enter your username and access token.");
      return;
    }
    connectAccount(account.id, handle.trim(), token.trim(), secret.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode("none");
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect account",
      `Remove @${account.handle} from ${account.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            disconnectAccount(account.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setHandle("");
            setToken("");
            setSecret("");
            setMode("none");
          },
        },
      ]
    );
  };

  const toggle = (next: PanelMode) => {
    Haptics.selectionAsync();
    setMode((prev) => (prev === next ? "none" : next));
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20)}
      style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Header row */}
      <View style={styles.accountRow}>
        <View style={[styles.platformIcon, { backgroundColor: account.color + "22" }]}>
          <MaterialCommunityIcons name={iconName} size={24} color={account.color} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.platformName, { color: colors.foreground }]}>
            {account.name}
          </Text>
          {account.connected && account.handle ? (
            <Text style={[styles.handle, { color: colors.mutedForeground }]}>
              @{account.handle}
            </Text>
          ) : (
            <Text style={[styles.handle, { color: colors.mutedForeground }]}>
              Not connected
            </Text>
          )}
        </View>
        {account.connected ? (
          <TouchableOpacity
            onPress={handleDisconnect}
            style={[styles.connectedBadge, { backgroundColor: colors.success + "22" }]}
          >
            <Feather name="check" size={12} color={colors.success} />
            <Text style={[styles.connectedText, { color: colors.success }]}>Connected</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionBtns}>
            <TouchableOpacity
              onPress={() => toggle("create")}
              style={[
                styles.smallBtn,
                {
                  backgroundColor: mode === "create" ? account.color : account.color + "18",
                  borderColor: account.color + "55",
                },
              ]}
            >
              <Text style={[styles.smallBtnText, { color: mode === "create" ? "#fff" : account.color }]}>
                Create
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggle("connect")}
              style={[
                styles.smallBtn,
                {
                  backgroundColor: mode === "connect" ? colors.primary : colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.smallBtnText, { color: mode === "connect" ? "#fff" : colors.mutedForeground }]}>
                Connect
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CREATE ACCOUNT panel */}
      {mode === "create" && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={[styles.panel, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            Create a {account.name} account
          </Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
            Choose the account type for your business. After signing up, come back and tap Connect to link it here.
          </Text>

          <TouchableOpacity
            style={[styles.signupBtn, { backgroundColor: account.color }]}
            onPress={() => openUrl(signupUrls.business)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="briefcase-outline" size={18} color="#fff" />
            <View style={styles.signupBtnText}>
              <Text style={styles.signupBtnLabel}>Business / Brand Account</Text>
              <Text style={styles.signupBtnSub}>Recommended for advertising</Text>
            </View>
            <Feather name="external-link" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signupBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => openUrl(signupUrls.personal)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="account-outline" size={18} color={colors.foreground} />
            <View style={styles.signupBtnText}>
              <Text style={[styles.signupBtnLabel, { color: colors.foreground }]}>Personal Account</Text>
              <Text style={[styles.signupBtnSub, { color: colors.mutedForeground }]}>Standard account</Text>
            </View>
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggle("connect")}
            style={[styles.afterSignupBtn, { borderColor: colors.border }]}
          >
            <Feather name="link" size={14} color={colors.primary} />
            <Text style={[styles.afterSignupText, { color: colors.primary }]}>
              Already signed up? Connect your account
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* CONNECT EXISTING panel */}
      {mode === "connect" && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={[styles.panel, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            Connect {account.name}
          </Text>

          <TouchableOpacity
            onPress={() => openUrl(apiHelp.url)}
            style={[styles.helpLink, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.helpLinkText, { color: colors.primary }]} numberOfLines={1}>
              {apiHelp.label}
            </Text>
            <Feather name="external-link" size={12} color={colors.primary} />
          </TouchableOpacity>

          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Feather name="at-sign" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Username / handle"
              placeholderTextColor={colors.mutedForeground}
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Feather name="key" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Access token"
              placeholderTextColor={colors.mutedForeground}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>
          {account.id === "twitter" && (
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Access token secret"
                placeholderTextColor={colors.mutedForeground}
                value={secret}
                onChangeText={setSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          )}
          <View style={styles.formBtns}>
            <TouchableOpacity
              onPress={() => setMode("none")}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConnect}
              style={[styles.saveBtn, { backgroundColor: account.color }]}
            >
              <Feather name="link" size={14} color="#fff" />
              <Text style={styles.saveBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function AccountsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accounts } = useApp();
  const connectedCount = accounts.filter((a) => a.connected).length;
  const isWeb = Platform.OS === "web";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? insets.top + 67 : 20,
          paddingBottom: isWeb ? insets.bottom + 34 + 84 : insets.bottom + 84 + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>Accounts</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        {connectedCount === 0
          ? "Create or connect your social accounts"
          : `${connectedCount} account${connectedCount > 1 ? "s" : ""} connected`}
      </Text>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.foreground }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Create</Text>
            {"  "}—{"  "}Sign up for a new account on that platform
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.foreground }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Connect</Text>
            {"  "}—{"  "}Link an existing account with API credentials
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {accounts.map((account) => (
          <AccountRow key={account.id} account={account} />
        ))}
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Your credentials are stored securely on this device only and never sent to external servers.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
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
  legend: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  legendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  accountCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  platformName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  handle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  actionBtns: {
    flexDirection: "row",
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  smallBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  connectedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  panel: {
    borderTopWidth: 1,
    padding: 16,
    gap: 10,
  },
  panelTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  panelSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  signupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  signupBtnText: {
    flex: 1,
    gap: 2,
  },
  signupBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  signupBtnSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  afterSignupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
  },
  afterSignupText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  helpLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  helpLinkText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  formBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
