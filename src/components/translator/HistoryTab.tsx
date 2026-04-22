import Icon from "@/components/ui/icon";
import { TranslationEntry, getLangLabel, formatTime } from "./types";

interface HistoryCardProps {
  entry: TranslationEntry;
  animDelay: number;
  heartAnim: boolean;
  onFavorite: () => void;
  onDelete: () => void;
  onSpeak: (text: string, lang: string) => void;
  onRestore: () => void;
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
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

function HistoryCard({
  entry,
  animDelay,
  heartAnim,
  onFavorite,
  onDelete,
  onSpeak,
  onRestore,
}: HistoryCardProps) {
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

interface HistoryTabProps {
  history: TranslationEntry[];
  heartAnimId: string | null;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onClearHistory: () => void;
  onSpeak: (text: string, lang: string) => void;
  onRestore: (entry: TranslationEntry) => void;
}

interface FavoritesTabProps {
  favorites: TranslationEntry[];
  heartAnimId: string | null;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onSpeak: (text: string, lang: string) => void;
  onRestore: (entry: TranslationEntry) => void;
}

export function HistoryTabContent({
  history,
  heartAnimId,
  onToggleFavorite,
  onDelete,
  onClearHistory,
  onSpeak,
  onRestore,
}: HistoryTabProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white/90">История</h2>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
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
            onFavorite={() => onToggleFavorite(entry.id)}
            onDelete={() => onDelete(entry.id)}
            onSpeak={onSpeak}
            onRestore={() => onRestore(entry)}
          />
        ))
      )}
    </div>
  );
}

export function FavoritesTabContent({
  favorites,
  heartAnimId,
  onToggleFavorite,
  onDelete,
  onSpeak,
  onRestore,
}: FavoritesTabProps) {
  return (
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
            onFavorite={() => onToggleFavorite(entry.id)}
            onDelete={() => onDelete(entry.id)}
            onSpeak={onSpeak}
            onRestore={() => onRestore(entry)}
          />
        ))
      )}
    </div>
  );
}
