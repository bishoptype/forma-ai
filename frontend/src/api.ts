export type Message = {
  role: string;
  text: string;
  time?: string;
  sources?: string[];
  lead_id?: string;
};
export type Conversation = {
  id: string;
  name: string;
  handle: string;
  status: string;
  topic: string;
  messages: Message[];
  created_at: string;
  response_seconds: number;
};
export type Doc = {
  id: string;
  title: string;
  kind: string;
  status: string;
  source: string;
  chunks: number;
  characters: number;
  created_at: string;
};
export type Company = {
  company: string;
  tone: string;
  language: string;
  greeting: string;
  handoff: boolean;
  demo: boolean;
  telegram_connected: boolean;
  llm_connected: boolean;
};
export type Dashboard = {
  total: number;
  resolved: number;
  rate: number;
  response: number;
  growth: number | null;
  saved_hours: number;
  documents: number;
  series: { date: string; total: number; resolved: number }[];
  topics: { name: string; count: number }[];
  recent: Conversation[];
};
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const key = sessionStorage.getItem("forma-api-key");
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(key ? { "X-API-Key": key } : {}),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Не удалось выполнить запрос. Проверьте данные и повторите.",
    );
  }
  return response.json();
}
export function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
}
export function formatTime(value: string) {
  return new Date(
    value.endsWith("Z") || value.includes("+") ? value : value + "Z",
  ).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
