import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface PlatformAccount {
  id: string;
  name: string;
  color: string;
  connected: boolean;
  handle?: string;
  accessToken?: string;
  accessSecret?: string;
  pageId?: string;
}

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  imageUri?: string;
  status: "scheduled" | "posted" | "failed" | "posting";
  scheduledAt: number;
  postedAt?: number;
  results?: Record<string, "success" | "failed" | "pending">;
}

const PLATFORMS: PlatformAccount[] = [
  { id: "twitter", name: "X (Twitter)", color: "#1DA1F2", connected: false },
  { id: "instagram", name: "Instagram", color: "#E1306C", connected: false },
  { id: "facebook", name: "Facebook", color: "#1877F2", connected: false },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", connected: false },
  { id: "tiktok", name: "TikTok", color: "#FF0050", connected: false },
];

const STORAGE_KEYS = {
  accounts: "@postly_accounts",
  posts: "@postly_posts",
};

interface AppContextValue {
  accounts: PlatformAccount[];
  posts: ScheduledPost[];
  connectAccount: (id: string, handle: string, token: string, secret?: string) => void;
  disconnectAccount: (id: string) => void;
  addPost: (post: Omit<ScheduledPost, "id">) => Promise<ScheduledPost>;
  removePost: (id: string) => void;
  updatePost: (id: string, updates: Partial<ScheduledPost>) => void;
  postNow: (post: Omit<ScheduledPost, "id" | "scheduledAt">) => Promise<ScheduledPost>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<PlatformAccount[]>(PLATFORMS);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedAccounts, storedPosts] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.accounts),
          AsyncStorage.getItem(STORAGE_KEYS.posts),
        ]);
        if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
        if (storedPosts) setPosts(JSON.parse(storedPosts));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
  }, [accounts, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
  }, [posts, loaded]);

  const connectAccount = useCallback(
    (id: string, handle: string, token: string, secret?: string) => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, connected: true, handle, accessToken: token, accessSecret: secret }
            : a
        )
      );
    },
    []
  );

  const disconnectAccount = useCallback((id: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, connected: false, handle: undefined, accessToken: undefined, accessSecret: undefined }
          : a
      )
    );
  }, []);

  const addPost = useCallback(
    async (post: Omit<ScheduledPost, "id">): Promise<ScheduledPost> => {
      const newPost: ScheduledPost = {
        ...post,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      };
      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    },
    []
  );

  const removePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<ScheduledPost>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const postNow = useCallback(
    async (post: Omit<ScheduledPost, "id" | "scheduledAt">): Promise<ScheduledPost> => {
      const newPost = await addPost({
        ...post,
        status: "posting",
        scheduledAt: Date.now(),
      });

      setTimeout(() => {
        const results: Record<string, "success" | "failed"> = {};
        post.platforms.forEach((p) => {
          results[p] = "success";
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === newPost.id
              ? { ...p, status: "posted", postedAt: Date.now(), results }
              : p
          )
        );
      }, 2000);

      return newPost;
    },
    [addPost]
  );

  return (
    <AppContext.Provider
      value={{ accounts, posts, connectAccount, disconnectAccount, addPost, removePost, updatePost, postNow }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
