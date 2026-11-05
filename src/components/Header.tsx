import { useState } from 'react';
import { Sun, Moon, Flame } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';
import { ProgressWidget } from './ProgressWidget';

type HeaderProps = {
  activeCount: number;
  completedCount: number;
  streak: number;
  theme: Theme;
  onToggleTheme: () => void;
  userEmail: string;
  onOpenSettings: () => void;
};

export function Header({
  activeCount,
  completedCount,
  streak,
  theme,
  onToggleTheme,
  userEmail,
  onOpenSettings,
}: HeaderProps) {
  const [spinning, setSpinning] = useState(false);

  const avatarLetter = userEmail[0]?.toUpperCase() ?? 'K';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6)  return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleToggle = () => {
    setSpinning(true);
    onToggleTheme();
    setTimeout(() => setSpinning(false), 420);
  };

  const isDark = theme === 'dark';

  return (
    <header
      className="px-5 pb-4 transition-colors duration-300 select-none"
      style={{
        paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Üst Satır: Tarih / Karşılama & Kontroller */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
              {today}
            </p>
            {/* Günlük Seri Rozeti */}
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.22)',
                color: '#FBBF24',
              }}
              title="Günlük görev tamamlama serisi"
            >
              <Flame size={11} className="fill-amber-400 text-amber-400" />
              <span>{streak} Günlük Seri</span>
            </div>
          </div>

          <h1 className="text-app-primary text-[26px] font-bold mt-1.5 tracking-tight leading-tight">
            {greeting()}
          </h1>
        </div>

        {/* Sağ Kontroller: Tema & Profil/Ayarlar */}
        <div className="flex items-center gap-2 mt-0.5 flex-shrink-0">
          {/* Tema Değiştirici */}
          <button
            id="theme-toggle-btn"
            onClick={handleToggle}
            aria-label={isDark ? 'Gündüz moduna geç' : 'Gece moduna geç'}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 text-app-secondary hover:text-app-primary"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            {isDark ? (
              <Sun size={17} className={`text-amber-400 ${spinning ? 'animate-theme-toggle' : ''}`} />
            ) : (
              <Moon size={17} className={`text-slate-700 ${spinning ? 'animate-theme-toggle' : ''}`} />
            )}
          </button>

          {/* Kullanıcı Avatar & Ayarlar Modal Tetikleyici */}
          <button
            id="user-menu-btn"
            onClick={onOpenSettings}
            aria-label="Profil ve Ayarlar"
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white transition-all duration-200 active:scale-90 relative"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <span>{avatarLetter}</span>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{
                background: '#10B981',
                borderColor: 'var(--bg)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Tekil Şık İlerleme Özeti Kartı */}
      <ProgressWidget activeCount={activeCount} completedCount={completedCount} />
    </header>
  );
}
