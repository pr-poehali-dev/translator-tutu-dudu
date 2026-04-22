import Icon from "@/components/ui/icon";
import { LANGUAGES, getLangLabel } from "./types";

interface TranslateTabProps {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  charCount: number;
  showSourceLangPicker: boolean;
  showTargetLangPicker: boolean;
  swapAnim: boolean;
  onSourceTextChange: (text: string) => void;
  onTranslate: () => void;
  onSwapLangs: () => void;
  onVoiceInput: () => void;
  onSpeak: (text: string, lang: string) => void;
  onClear: () => void;
  onToggleSourceLangPicker: () => void;
  onToggleTargetLangPicker: () => void;
  onSelectSourceLang: (code: string) => void;
  onSelectTargetLang: (code: string) => void;
}

export default function TranslateTab({
  sourceText,
  translatedText,
  sourceLang,
  targetLang,
  isLoading,
  isListening,
  isSpeaking,
  charCount,
  showSourceLangPicker,
  showTargetLangPicker,
  swapAnim,
  onSourceTextChange,
  onTranslate,
  onSwapLangs,
  onVoiceInput,
  onSpeak,
  onClear,
  onToggleSourceLangPicker,
  onToggleTargetLangPicker,
  onSelectSourceLang,
  onSelectTargetLang,
}: TranslateTabProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Language switcher */}
      <div className="glass rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSourceLangPicker}
            className="flex-1 glass rounded-2xl px-3 py-2.5 flex items-center gap-2 ripple transition-all active:scale-95"
          >
            <span className="text-xl">{getLangLabel(sourceLang).flag}</span>
            <span className="text-sm font-semibold text-white/90 truncate">
              {getLangLabel(sourceLang).label}
            </span>
            <Icon name="ChevronDown" size={14} className="text-white/40 ml-auto" />
          </button>

          <button
            onClick={onSwapLangs}
            className="w-10 h-10 rounded-full flex items-center justify-center btn-translate glow-purple flex-shrink-0"
          >
            <Icon
              name="ArrowLeftRight"
              size={16}
              className={`text-white ${swapAnim ? "swap-animate" : ""}`}
            />
          </button>

          <button
            onClick={onToggleTargetLangPicker}
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
                    if (showSourceLangPicker) onSelectSourceLang(lang.code);
                    else onSelectTargetLang(lang.code);
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs transition-all active:scale-95 ${
                    isActive
                      ? "bg-neon-purple/30 border border-neon-purple/60 text-white"
                      : "glass text-white/70 border border-transparent"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium truncate w-full text-center">{lang.label}</span>
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
          onChange={(e) => onSourceTextChange(e.target.value)}
          maxLength={500}
          placeholder="Введите или скажите текст..."
          className="w-full bg-transparent text-white/90 placeholder:text-white/20 text-base resize-none outline-none font-golos leading-relaxed"
          rows={3}
        />

        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <button
            onClick={onVoiceInput}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isListening ? "bg-neon-pink/20 border-2 border-neon-pink" : "glass"
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
            onClick={() => onSpeak(sourceText, sourceLang)}
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
              onClick={onClear}
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
            onClick={onTranslate}
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
                onClick={() => onSpeak(translatedText, targetLang)}
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
            <p className="text-white text-lg font-medium leading-relaxed">{translatedText}</p>
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
            {["Привет", "Спасибо", "Как дела", "До свидания", "Пожалуйста"].map((phrase) => (
              <button
                key={phrase}
                onClick={() => onSourceTextChange(phrase)}
                className="glass rounded-full px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
