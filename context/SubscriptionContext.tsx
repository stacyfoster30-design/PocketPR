import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@pocketpr_subscription";

export type SubscriptionTier = "free" | "pro";

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  isPro: boolean;
  isLoaded: boolean;
  subscribe: () => Promise<void>;
  restore: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "pro") setTier("pro");
      setIsLoaded(true);
    });
  }, []);

  // Wire this to RevenueCat / Stripe / IAP when ready
  const subscribe = useCallback(async () => {
    // TODO: launch purchase flow (RevenueCat Purchases.purchasePackage)
    // For now, optimistically grant pro after purchase UI completes
    setTier("pro");
    await AsyncStorage.setItem(STORAGE_KEY, "pro");
  }, []);

  const restore = useCallback(async () => {
    // TODO: RevenueCat Purchases.restorePurchases()
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "pro") setTier("pro");
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ tier, isPro: tier === "pro", isLoaded, subscribe, restore }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
