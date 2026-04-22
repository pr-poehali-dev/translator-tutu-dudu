import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import TranslateTab from "@/components/translator/TranslateTab";
import { HistoryTabContent, FavoritesTabContent } from "@/components/translator/HistoryTab";
import {
  Tab,
  TranslationEntry,
  SpeechRecognitionInstance,
  translateText,
  loadHistory,
  saveHistory,
} from "@/components/translator/types";

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
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
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
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
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

  const handleRestore = (entry: TranslationEntry) => {
    setSourceText(entry.sourceText);
    setSourceLang(entry.sourceLang);
    setTargetLang(entry.targetLang);
    setTranslatedText(entry.translatedText);
    setTab("translate");
  };

  const handleSourceTextChange = (text: string) => {
    setSourceText(text);
    setCharCount(text.length);
  };

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setCharCount(0);
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
              <div className="flex items-center gap-2">
                {installPrompt && !isInstalled && (
                  <button
                    onClick={() => {
                      const prompt = installPrompt as { prompt: () => void };
                      prompt.prompt();
                    }}
                    className="btn-translate text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 animate-fade-in"
                  >
                    <Icon name="Download" size={14} />
                    Установить
                  </button>
                )}
                <div className="glass rounded-2xl p-2.5">
                  <Icon name="Globe" size={20} className="text-neon-purple" />
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
            {tab === "translate" && (
              <TranslateTab
                sourceText={sourceText}
                translatedText={translatedText}
                sourceLang={sourceLang}
                targetLang={targetLang}
                isLoading={isLoading}
                isListening={isListening}
                isSpeaking={isSpeaking}
                charCount={charCount}
                showSourceLangPicker={showSourceLangPicker}
                showTargetLangPicker={showTargetLangPicker}
                swapAnim={swapAnim}
                onSourceTextChange={handleSourceTextChange}
                onTranslate={handleTranslate}
                onSwapLangs={handleSwapLangs}
                onVoiceInput={handleVoiceInput}
                onSpeak={handleSpeak}
                onClear={handleClear}
                onToggleSourceLangPicker={() => {
                  setShowSourceLangPicker(!showSourceLangPicker);
                  setShowTargetLangPicker(false);
                }}
                onToggleTargetLangPicker={() => {
                  setShowTargetLangPicker(!showTargetLangPicker);
                  setShowSourceLangPicker(false);
                }}
                onSelectSourceLang={(code) => {
                  setSourceLang(code);
                  setShowSourceLangPicker(false);
                  setShowTargetLangPicker(false);
                }}
                onSelectTargetLang={(code) => {
                  setTargetLang(code);
                  setShowSourceLangPicker(false);
                  setShowTargetLangPicker(false);
                }}
              />
            )}

            {tab === "history" && (
              <HistoryTabContent
                history={history}
                heartAnimId={heartAnimId}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteEntry}
                onClearHistory={clearHistory}
                onSpeak={handleSpeak}
                onRestore={handleRestore}
              />
            )}

            {tab === "favorites" && (
              <FavoritesTabContent
                favorites={favorites}
                heartAnimId={heartAnimId}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteEntry}
                onSpeak={handleSpeak}
                onRestore={handleRestore}
              />
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
