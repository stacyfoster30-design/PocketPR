import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface BusinessProfile {
  name: string;
  description: string;
  tone: "professional" | "casual" | "humorous" | "inspirational" | "promotional";
  goals: string;
}

interface BusinessContextValue {
  profile: BusinessProfile;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  isSetup: boolean;
}

const DEFAULT_PROFILE: BusinessProfile = {
  name: "",
  description: "",
  tone: "professional",
  goals: "",
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@postly_business").then((v) => {
      if (v) setProfile(JSON.parse(v));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem("@postly_business", JSON.stringify(profile));
  }, [profile, loaded]);

  const updateProfile = useCallback((updates: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const isSetup = Boolean(profile.name.trim());

  return (
    <BusinessContext.Provider value={{ profile, updateProfile, isSetup }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
