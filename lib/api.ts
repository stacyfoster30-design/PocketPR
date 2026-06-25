const BASE = "/api";

export interface GeneratePostRequest {
  brief: string;
  platforms: string[];
  tone?: string;
  businessName?: string;
  businessDescription?: string;
}

export interface StrategyRequest {
  businessName: string;
  businessDescription?: string;
  platforms: string[];
  goals?: string;
}

export interface StrategyTip {
  title: string;
  description: string;
  platform: string;
}

export interface StrategyResponse {
  tips: StrategyTip[];
  postingSchedule: Record<string, string>;
}

export async function generatePosts(req: GeneratePostRequest): Promise<Record<string, string>> {
  const res = await fetch(`${BASE}/ai/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to generate posts");
  const data = await res.json() as { posts: Record<string, string> };
  return data.posts;
}

export async function getStrategy(req: StrategyRequest): Promise<StrategyResponse> {
  const res = await fetch(`${BASE}/ai/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to get strategy");
  return res.json() as Promise<StrategyResponse>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  businessName?: string,
  businessDescription?: string,
  onChunk?: (text: string) => void,
): Promise<string> {
  const res = await fetch(`${BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, businessName, businessDescription }),
  });

  if (!res.ok || !res.body) throw new Error("Chat request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
        if (parsed.content) {
          full += parsed.content;
          onChunk?.(full);
        }
      } catch {}
    }
  }

  return full;
}
