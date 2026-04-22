import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Tab = "translate" | "history" | "favorites";

interface SpeechRecognitionInstance {
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

interface TranslationEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  isFavorite: boolean;
}

const LANGUAGES = [
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

async function translateText(text: string, from: string, to: string): Promise<string> {
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

function getLangLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? { code, label: code, flag: "🌐" };
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "только что";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const STORAGE_KEY = "lingua_history";

function loadHistory(): TranslationEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: TranslationEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("translate");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("ru");
  const [targetLang, setTargetLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<TranslationEntry[]>(loadHistory);
  const [showSourceLangPicker, setShowSourceLangPicker] = useState(false);
  const [showTargetLangPicker, setShowTargetLangPicker] = useState(false);
  const [swapAnim, setSwapAnim] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setTranslatedText("");
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result);
      const entry: TranslationEntry = {
        id: Date.now().toString(),
        sourceText,
        translatedText: result,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
        isFavorite: false,
      };
      setHistory((prev) => [entry, ...prev]);
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, sourceLang, targetLang]);

  const handleSwapLangs = () => {
    setSwapAnim(true);
    setTimeout(() => setSwapAnim(false), 400);
    const prevTarget = targetLang;
    const prevSource = sourceLang;
    const prevText = translatedText;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    setSourceText(prevText);
    setTranslatedText("");
  };

  const handleVoiceInput = () => {
    const w = window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance };
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert("Ваш браузер не поддерживает распознавание речи");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = sourceLang === "ru" ? "ru-RU" : sourceLang === "en" ? "en-US" : sourceLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setSourceText(transcript);
      setCharCount(transcript.length);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : lang;
    utter.rate = 0.9;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const toggleFavorite = (id: string) => {
    setHeartAnimId(id);
    setTimeout(() => setHeartAnimId(null), 300);
    setHistory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))
    );
  };

  const deleteEntry = (id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  const clearHistory = () => {
    setHistory((prev) => prev.filter((e) => e.isFavorite));
  };

  const favorites = history.filter((e) => e.isFavorite);

  const currentTime = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-animated font-golos overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-neon-purple top-[-100px] left-[-100px]" />
      <div className="orb w-80 h-80 bg-neon-cyan bottom-20 right-[-80px]" />
      <div className="orb w-64 h-64 bg-neon-pink top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Android phone frame */}
      <div className="relative z-10 flex justify-center items-start min-h-screen py-4">
        <div className="relative w-full max-w-[390px] min-h-screen flex flex-col">
          {/* Status bar */}
          <div className="android-statusbar flex-shrink-0">
            <span className="font-rubik font-semibold">{currentTime}</span>
            <div className="flex items-center gap-1.5">
              {isOffline && (
                <span className="offline-badge text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  ОФЛАЙН
                </span>
              )}
              <Icon name="Wifi" size={12} />
              <Icon name="Battery" size={14} />
            </div>
          </div>

          {/* App header */}
          <div className="flex-shrink-0 px-5 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold gradient-text font-golos">LinguaAI</h1>
                <p className="text-xs text-white/40 font-rubik">Умный переводчик</p>
              </div>
              <div className="glass rounded-2xl p-2.5">
                <Icon name="Globe" size={20} className="text-neon-purple" />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
            {/* TRANSLATE TAB */}
            {tab === "translate" && (
              <div className="space-y-3 animate-fade-in">
                {/* Language switcher */}
                <div className="glass rounded-3xl p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowSourceLangPicker(!showSourceLangPicker);
                        setShowTargetLangPicker(false);
                      }}
                      className="flex-1 glass rounded-2xl px-3 py-2.5 flex items-center gap-2 ripple transition-all active:scale-95"
                    >
                      <span className="text-xl">{getLangLabel(sourceLang).flag}</span>
                      <span className="text-sm font-semibold text-white/90 truncate">
                        {getLangLabel(sourceLang).label}
                      </span>
                      <Icon name="ChevronDown" size={14} className="text-white/40 ml-auto" />
                    </button>

                    <button
                      onClick={handleSwapLangs}
                      className="w-10 h-10 rounded-full flex items-center justify-center btn-translate glow-purple flex-shrink-0"
                    >
                      <Icon
                        name="ArrowLeftRight"
                        size={16}
                        className={`text-white ${swapAnim ? "swap-animate" : ""}`}
                      />
                    </button>

                    <button
                      onClick={() => {
                        setShowTargetLangPicker(!showTargetLangPicker);
                        setShowSourceLangPicker(false);
                      }}
                      className="flex-1 glass rounded-2xl px-3 py-2.5 flex items-center gap-2 ripple transition-all active:scale-95"
                    >
                      <span className="text-xl">{getLangLabel(targetLang).flag}</span>
                      <span className="text-sm font-semibold text-white/90 truncate">
                        {getLangLabel(targetLang).label}
                      </span>
                      <Icon name="ChevronDown" size={14} className="text-white/40 ml-auto" />
                    </button>
                  </div>

                  {(showSourceLangPicker || showTargetLangPicker) && (
                    <div className="mt-3 grid grid-cols-3 gap-2 animate-scale-in">
                      {LANGUAGES.map((lang) => {
                        const isActive = showSourceLangPicker
                          ? lang.code === sourceLang
                          : lang.code === targetLang;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => {
                              if (showSourceLangPicker) setSourceLang(lang.code);
                              else setTargetLang(lang.code);
                              setShowSourceLangPicker(false);
                              setShowTargetLangPicker(false);
                            }}
                            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs transition-all active:scale-95 ${
                              isActive
                                ? "bg-neon-purple/30 border border-neon-purple/60 text-white"
                                : "glass text-white/70 border border-transparent"
                            }`}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="font-medium truncate w-full text-center">
                              {lang.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="glass rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      {getLangLabel(sourceLang).flag} Введите текст
                    </span>
                    <span className="text-xs text-white/30">{charCount}/500</span>
                  </div>

                  <textarea
                    value={sourceText}
                    onChange={(e) => {
                      setSourceText(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    maxLength={500}
                    placeholder="Введите или скажите текст..."
                    className="w-full bg-transparent text-white/90 placeholder:text-white/20 text-base resize-none outline-none font-golos leading-relaxed"
                    rows={3}
                  />

                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={handleVoiceInput}
                      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                        isListening
                          ? "bg-neon-pink/20 border-2 border-neon-pink"
                          : "glass"
                      }`}
                    >
                      {isListening && (
                        <>
                          <div className="voice-ring absolute inset-0 rounded-full border-2 border-neon-pink" />
                          <div
                            className="voice-ring absolute inset-0 rounded-full border-2 border-neon-pink"
                            style={{ animationDelay: "0.3s" }}
                          />
                        </>
                      )}
                      <Icon
                        name={isListening ? "MicOff" : "Mic"}
                        size={18}
                        className={isListening ? "text-neon-pink" : "text-white/60"}
                      />
                    </button>

                    <button
                      onClick={() => handleSpeak(sourceText, sourceLang)}
                      disabled={!sourceText}
                      className="w-11 h-11 rounded-full glass flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                    >
                      <Icon
                        name={isSpeaking ? "VolumeX" : "Volume2"}
                        size={18}
                        className="text-neon-cyan"
                      />
                    </button>

                    {sourceText && (
                      <button
                        onClick={() => {
                          setSourceText("");
                          setTranslatedText("");
                          setCharCount(0);
                        }}
                        className="w-11 h-11 rounded-full glass flex items-center justify-center transition-all active:scale-90"
                      >
                        <Icon name="X" size={18} className="text-white/50" />
                      </button>
                    )}

                    {isListening && (
                      <div className="flex items-center gap-1 ml-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="wave-bar w-1 bg-neon-pink rounded-full"
                            style={{ animationDelay: `${(i - 1) * 0.1}s` }}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleTranslate}
                      disabled={!sourceText.trim() || isLoading}
                      className="btn-translate ml-auto text-white font-bold text-sm px-5 py-2.5 rounded-2xl disabled:opacity-40 disabled:transform-none flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Перевод...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="Zap" size={16} />
                          <span>Перевести</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Translation result */}
                {(translatedText || isLoading) && (
                  <div
                    className="glass-strong rounded-3xl p-4 space-y-3 animate-fade-in"
                    style={{ border: "1px solid rgba(124, 92, 255, 0.2)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neon-cyan/70 uppercase tracking-wider">
                        {getLangLabel(targetLang).flag} Перевод
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(translatedText)}
                          className="w-8 h-8 rounded-full glass flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Icon name="Copy" size={14} className="text-white/50" />
                        </button>
                        <button
                          onClick={() => handleSpeak(translatedText, targetLang)}
                          className="w-8 h-8 rounded-full glass flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Icon name="Volume2" size={14} className="text-neon-cyan" />
                        </button>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-neon-purple animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-white/30 text-sm">Переводим...</span>
                      </div>
                    ) : (
                      <p className="text-white text-lg font-medium leading-relaxed">
                        {translatedText}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick phrases */}
                {!sourceText && (
                  <div className="animate-fade-in">
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-2 px-1">
                      Быстрые фразы
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Привет", "Спасибо", "Как дела", "До свидания", "Пожалуйста"].map(
                        (phrase) => (
                          <button
                            key={phrase}
                            onClick={() => {
                              setSourceText(phrase);
                              setCharCount(phrase.length);
                            }}
                            className="glass rounded-full px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                          >
                            {phrase}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === "history" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white/90">История</h2>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-white/40 flex items-center gap-1 glass px-3 py-1.5 rounded-full active:scale-95 transition-all"
                    >
                      <Icon name="Trash2" size={12} />
                      Очистить
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <EmptyState
                    icon="Clock"
                    title="История пуста"
                    subtitle="Переведите что-нибудь — появится здесь"
                  />
                ) : (
                  history.map((entry, i) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      animDelay={i * 50}
                      heartAnim={heartAnimId === entry.id}
                      onFavorite={() => toggleFavorite(entry.id)}
                      onDelete={() => deleteEntry(entry.id)}
                      onSpeak={handleSpeak}
                      onRestore={() => {
                        setSourceText(entry.sourceText);
                        setSourceLang(entry.sourceLang);
                        setTargetLang(entry.targetLang);
                        setTranslatedText(entry.translatedText);
                        setTab("translate");
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* FAVORITES TAB */}
            {tab === "favorites" && (
              <div className="space-y-3 animate-fade-in">
                <h2 className="text-lg font-bold text-white/90">Избранное</h2>
                {favorites.length === 0 ? (
                  <EmptyState
                    icon="Heart"
                    title="Нет избранного"
                    subtitle="Добавляйте переводы в избранное — они сохранятся офлайн"
                  />
                ) : (
                  favorites.map((entry, i) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      animDelay={i * 50}
                      heartAnim={heartAnimId === entry.id}
                      onFavorite={() => toggleFavorite(entry.id)}
                      onDelete={() => deleteEntry(entry.id)}
                      onSpeak={handleSpeak}
                      onRestore={() => {
                        setSourceText(entry.sourceText);
                        setSourceLang(entry.sourceLang);
                        setTargetLang(entry.targetLang);
                        setTranslatedText(entry.translatedText);
                        setTab("translate");
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bottom tab bar */}
          <div className="flex-shrink-0 tab-bar">
            <div className="flex items-center justify-around px-4 pt-2 pb-1">
              {(
                [
                  { id: "translate", icon: "Languages", label: "Перевод" },
                  { id: "history", icon: "Clock", label: "История", badge: history.length },
                  { id: "favorites", icon: "Heart", label: "Избранное", badge: favorites.length },
                ] as const
              ).map(({ id, icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all active:scale-90 relative ${
                    tab === id ? "text-white" : "text-white/30"
                  }`}
                >
                  {tab === id && (
                    <div className="absolute inset-0 bg-neon-purple/15 rounded-2xl" />
                  )}
                  <div className="relative">
                    <Icon
                      name={icon}
                      size={22}
                      className={
                        tab === id
                          ? id === "favorites"
                            ? "text-neon-pink"
                            : "text-neon-purple"
                          : ""
                      }
                    />
                    {badge !== undefined && badge > 0 && tab !== id && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-neon-purple rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                        {badge > 99 ? "99" : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold relative">{label}</span>
                </button>
              ))}
            </div>
            <div className="nav-indicator" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({
  entry,
  animDelay,
  heartAnim,
  onFavorite,
  onDelete,
  onSpeak,
  onRestore,
}: {
  entry: TranslationEntry;
  animDelay: number;
  heartAnim: boolean;
  onFavorite: () => void;
  onDelete: () => void;
  onSpeak: (text: string, lang: string) => void;
  onRestore: () => void;
}) {
  const src = getLangLabel(entry.sourceLang);
  const tgt = getLangLabel(entry.targetLang);

  return (
    <div
      className="glass rounded-3xl p-4 space-y-2.5 animate-fade-in active:scale-[0.98] transition-transform"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{src.flag}</span>
          <Icon name="ArrowRight" size={12} className="text-white/30" />
          <span className="text-sm">{tgt.flag}</span>
          <span className="text-xs text-white/30 ml-1">{formatTime(entry.timestamp)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onFavorite}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-75 ${
              heartAnim ? "heart-pop" : ""
            }`}
          >
            <Icon
              name="Heart"
              size={15}
              className={entry.isFavorite ? "text-neon-pink fill-current" : "text-white/30"}
            />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-75 transition-all"
          >
            <Icon name="Trash2" size={13} className="text-white/20 hover:text-red-400" />
          </button>
        </div>
      </div>

      <button onClick={onRestore} className="w-full text-left space-y-1">
        <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{entry.sourceText}</p>
        <p className="text-white font-medium text-sm leading-relaxed line-clamp-2">
          {entry.translatedText}
        </p>
      </button>

      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onSpeak(entry.sourceText, entry.sourceLang)}
          className="text-xs text-white/30 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Icon name="Volume2" size={12} />
          {src.label}
        </button>
        <button
          onClick={() => onSpeak(entry.translatedText, entry.targetLang)}
          className="text-xs text-neon-cyan/50 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Icon name="Volume2" size={12} />
          {tgt.label}
        </button>
        <button
          onClick={onRestore}
          className="ml-auto text-xs text-neon-purple/60 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Icon name="RotateCcw" size={12} />
          Открыть
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3 animate-fade-in">
      <div className="w-16 h-16 glass rounded-full flex items-center justify-center">
        <Icon name={icon} fallback="CircleAlert" size={28} className="text-white/20" />
      </div>
      <p className="text-white/50 font-semibold text-base">{title}</p>
      <p className="text-white/25 text-sm text-center max-w-[200px]">{subtitle}</p>
    </div>
  );
}