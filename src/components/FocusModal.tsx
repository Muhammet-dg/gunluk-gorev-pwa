import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';
import type { Task } from '../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '../types';

type FocusModalProps = {
  task: Task;
  onComplete: (id: string) => void;
  onClose: () => void;
};

const PRESET_MINUTES = [15, 25, 45] as const;

export function FocusModal({ task, onComplete, onClose }: FocusModalProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([100, 50, 100]);
            } catch {
              // ignore
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSelectPreset = (mins: number) => {
    setIsRunning(false);
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const handleComplete = () => {
    onComplete(task.id);
    onClose();
  };

  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const catKey = task.category ?? (task.priority === 'high' ? 'urgent' : 'personal');
  const catCfg = CATEGORY_CONFIG[catKey];
  const prioCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md transition-opacity"
        style={{ background: 'rgba(11, 13, 19, 0.86)' }}
        onClick={onClose}
      />

      {/* Odak Kartı */}
      <div
        className="relative w-full max-w-sm rounded-3xl border p-6 flex flex-col items-center text-center animate-scale-in shadow-2xl"
        style={{
          background: 'var(--sheet-bg)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Üst Etiket & Kapat */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: 'var(--primary-dim)',
              color: 'var(--primary-light)',
            }}
          >
            <Sparkles size={11} />
            <span>Odaklanma Modu</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-app-secondary hover:text-app-primary transition-colors active:scale-90"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            aria-label="Kapat"
          >
            <X size={15} />
          </button>
        </div>

        {/* Görev Başlığı & Etiketler */}
        <div className="mb-5 px-2">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${catCfg.badgeBg} ${catCfg.badgeText}`}>
              {catCfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${prioCfg.badgeBg} ${prioCfg.badgeText}`}>
              {prioCfg.label}
            </span>
          </div>
          <h3 className="text-app-primary text-lg font-bold tracking-tight leading-snug line-clamp-2">
            {task.title}
          </h3>
          {task.note && (
            <p className="text-app-muted text-xs mt-1 line-clamp-2">{task.note}</p>
          )}
        </div>

        {/* Dairesel Pomodoro Sayacı */}
        <div className="relative w-56 h-56 flex items-center justify-center my-2">
          {/* Nefes alan arka plan ışığı */}
          {isRunning && (
            <div
              className="absolute inset-6 rounded-full animate-breathe pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
              }}
            />
          )}

          <svg className="w-full h-full -rotate-90" viewBox="0 0 210 210">
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth="6"
            />
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="#6366F1"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-app-primary text-4xl font-extrabold tracking-tight tabular-nums">
              {mins}:{secs}
            </span>
            <span className="text-app-muted text-[11px] font-semibold uppercase tracking-widest mt-1.5">
              {isRunning ? 'Odaklanılıyor' : secondsLeft === 0 ? 'Süre Doldu!' : 'Hazır'}
            </span>
          </div>
        </div>

        {/* Süre Seçenekleri (15 / 25 / 45 dk) */}
        <div className="flex items-center gap-2 my-4">
          {PRESET_MINUTES.map((m) => {
            const active = durationMinutes === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectPreset(m)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                style={
                  active
                    ? {
                        background: 'var(--primary-dim)',
                        color: 'var(--primary-light)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                      }
                    : {
                        background: 'var(--surface)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }
                }
              >
                {m} dk
              </button>
            );
          })}
        </div>

        {/* Kontrol Butonları */}
        <div className="w-full flex items-center gap-2.5 mt-1">
          <button
            type="button"
            onClick={handleReset}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-app-secondary hover:text-app-primary transition-all active:scale-90 flex-shrink-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            aria-label="Sayacı sıfırla"
          >
            <RotateCcw size={17} />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning((r) => !r)}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-white text-sm font-bold transition-all active:scale-[0.98]"
            style={{
              background: isRunning ? 'var(--surface-2)' : 'var(--primary)',
              color: isRunning ? 'var(--text-primary)' : '#ffffff',
              border: isRunning ? '1px solid var(--border-strong)' : 'none',
              boxShadow: isRunning ? 'none' : '0 8px 24px var(--primary-glow)',
            }}
          >
            {isRunning ? (
              <>
                <Pause size={16} />
                <span>Duraklat</span>
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                <span>{secondsLeft < totalSeconds ? 'Devam Et' : 'Odaklanmayı Başlat'}</span>
              </>
            )}
          </button>
        </div>

        {/* Görevi Tamamla Butonu */}
        <button
          type="button"
          onClick={handleComplete}
          className="w-full mt-3 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.98]"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34D399',
          }}
        >
          <Check size={15} strokeWidth={2.5} />
          <span>Görevi Tamamlandı Olarak İşaretle</span>
        </button>
      </div>
    </div>
  );
}

