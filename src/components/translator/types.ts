export type Tab = "translate" | "history" | "favorites";

export interface TranslationEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  isFavorite: boolean;
}

export interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

export const LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

const DEMO_TRANSLATIONS: Record<string, Record<string, Record<string, string>>> = {
  "ru": {
    "en": {
      "привет": "hello",
      "мир": "world",
      "спасибо": "thank you",
      "пожалуйста": "please / you're welcome",
      "да": "yes",
      "нет": "no",
      "хорошо": "okay / good",
      "как дела": "how are you",
      "доброе утро": "good morning",
      "добрый вечер": "good evening",
      "до свидания": "goodbye",
    },
    "de": {
      "привет": "hallo",
      "мир": "Welt",
      "спасибо": "danke",
    },
    "fr": {
      "привет": "bonjour",
      "мир": "monde",
      "спасибо": "merci",
    },
  },
  "en": {
    "ru": {
      "hello": "привет",
      "world": "мир",
      "thank you": "спасибо",
      "please": "пожалуйста",
      "yes": "да",
      "no": "нет",
      "good": "хорошо",
      "how are you": "как дела",
      "good morning": "доброе утро",
      "goodbye": "до свидания",
    },
    "de": {
      "hello": "hallo",
      "world": "Welt",
      "thank you": "danke schön",
    },
  },
};

const TRANSLATE_URL = "https://functions.poehali.dev/103a1735-0feb-4927-b1a1-4570af68e07b";

function getOfflineTranslation(text: string, from: string, to: string): string | null {
  const t = text.toLowerCase().trim();
  return DEMO_TRANSLATIONS[from]?.[to]?.[t] ?? null;
}

export async function translateText(text: string, from: string, to: string): Promise<string> {
  const offline = getOfflineTranslation(text, from, to);
  if (offline) return offline;

  try {
    const res = await fetch(TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source: from, target: to }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Translation failed");
    return data.translatedText as string;
  } catch {
    return `[Ошибка перевода] ${text}`;
  }
}

export function getLangLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? { code, label: code, flag: "🌐" };
}

export function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "только что";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export const STORAGE_KEY = "lingua_history";

export function loadHistory(): TranslationEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(entries: TranslationEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
}
