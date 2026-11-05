import { useState, useRef } from 'react';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Bell,
  Clock,
  Timer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Task } from '../types';
import { PRIORITY_CONFIG, CATEGORY_CONFIG } from '../types';

type TaskCardProps = {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string, mode: '1h' | 'tomorrow') => void;
  onFocus?: (task: Task) => void;
};

// Mikro-parçacık yön ve renkleri (Checkbox patlama efekti)
const SPARKLE_BURSTS = [
  { tx: '14px', ty: '-14px', color: '#10B981', size: 4 },
  { tx: '-14px', ty: '-14px', color: '#34D399', size: 3.5 },
  { tx: '18px', ty: '2px', color: '#FBBF24', size: 3 },
  { tx: '-18px', ty: '2px', color: '#6EE7B7', size: 4 },
  { tx: '12px', ty: '14px', color: '#34D399', size: 3.5 },
  { tx: '-12px', ty: '14px', color: '#10B981', size: 3 },
  { tx: '0px', ty: '-18px', color: '#A7F3D0', size: 3 },
  { tx: '0px', ty: '18px', color: '#059669', size: 3 },
];

export function TaskCard({ task, onToggle, onDelete, onSnooze, onFocus }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snoozedFeedback, setSnoozedFeedback] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  // ── Swipe Gesture State ────────────────────────────────────────────────────
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const categoryKey = task.category ?? (task.priority === 'high' ? 'urgent' : 'personal');
  const categoryCfg = CATEGORY_CONFIG[categoryKey];

  const handleToggleAction = () => {
    if (!task.completed) {
      // Tamamlama animasyonlarını tetikle
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 800);

      // Çift kademeli tatmin edici haptic geri bildirim
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([16, 32]);
        } catch {
          // ignore
        }
      }
    }
    onToggle(task.id);
  };

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => onDelete(task.id), 240);
  };

  const handleSnooze = (mode: '1h' | 'tomorrow') => {
    setOffsetX(0);
    if (onSnooze) {
      onSnooze(task.id, mode);
      setSnoozedFeedback(mode === '1h' ? '1 saat ertelendi' : 'Yarına ertelendi');
      setTimeout(() => setSnoozedFeedback(null), 2000);
    }
  };

  // ── Touch / Pointer Handlers (Swipe) ───────────────────────────────────────
  const handlePointerStart = (clientX: number, clientY: number) => {
    startXRef.current = clientX - offsetX;
    startYRef.current = clientY;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || startXRef.current === null || startYRef.current === null) return;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      const clamped = Math.max(-148, Math.min(115, deltaX));
      setOffsetX(clamped);
    }
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Sağa kaydırma -> Tamamla / Geri Al
    if (offsetX > 68) {
      setOffsetX(0);
      handleToggleAction();
    }
    // Sola kaydırma -> Aksiyon çekmecesini aç (-120px) veya kapat
    else if (offsetX < -50) {
      setOffsetX(-124);
    } else {
      setOffsetX(0);
    }

    startXRef.current = null;
    startYRef.current = null;
    isHorizontalSwipeRef.current = null;
  };

  const formattedTime = new Date(task.created_at).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const reminderLabel = task.reminder_time
    ? new Date(task.reminder_time).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className={`
        relative rounded-2xl select-none transition-all duration-300 ease-out animate-task-in group
        ${deleting ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100'}
      `}
    >
      {/* ─── Arka Plan Kaydırma Katmanı (Swipe Backgrounds) ─── */}
      <div className="absolute inset-0 flex items-center justify-between rounded-2xl overflow-hidden pointer-events-none">
        {/* Sağa Kaydırınca Beliren Tamamlama Şeridi */}
        <div
          className="h-full flex items-center pl-4 pr-6 transition-opacity duration-150"
          style={{
            background: 'linear-gradient(90deg, #10B981, #059669)',
            opacity: offsetX > 8 ? Math.min(1, offsetX / 60) : 0,
            width: '55%',
          }}
        >
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              {task.completed ? <RotateCcw size={14} /> : <Sparkles size={14} className="fill-current" />}
            </div>
            <span>{task.completed ? 'Geri Al' : 'Tamamla'}</span>
          </div>
        </div>

        {/* Sola Kaydırınca Beliren Ertele / Sil Butonları */}
        <div
          className="pointer-events-auto h-full flex items-center justify-end gap-1.5 pr-3 pl-3 ml-auto transition-opacity duration-150"
          style={{
            opacity: offsetX < -8 ? Math.min(1, Math.abs(offsetX) / 50) : 0,
          }}
        >
          {!task.completed && onSnooze && (
            <button
              type="button"
              onClick={() => handleSnooze('tomorrow')}
              className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 text-amber-300 text-xs font-semibold transition-all active:scale-95"
              style={{
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.30)',
              }}
              title="Yarın 09:00'a ertele"
            >
              <Clock size={13} />
              <span>Ertele</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="h-10 px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-red-300 text-xs font-semibold transition-all active:scale-95"
            style={{
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.32)',
            }}
            title="Görevi sil"
          >
            <Trash2 size={13} />
            <span>Sil</span>
          </button>
        </div>
      </div>

      {/* ─── Ön Plan Görev Kartı (Glassmorphic & Editorial Tasarım) ─── */}
      <div
        onTouchStart={(e) => handlePointerStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerEnd}
        onMouseDown={(e) => handlePointerStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerEnd}
        onMouseLeave={() => {
          if (isDragging) handlePointerEnd();
        }}
        className={`
          relative rounded-2xl border transition-all overflow-hidden
          ${isDragging ? '' : 'duration-300 ease-out'}
          ${task.completed ? 'opacity-60 bg-surface/70' : 'bg-surface/90 hover:bg-surface-hover/90'}
          shadow-sm hover:shadow-md
        `}
        style={{
          borderColor: task.completed ? 'var(--border)' : 'var(--border-strong)',
          transform: `translateX(${offsetX}px)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Görev tamamlandığında kart üzerinden geçen zümrüt ışığı (Sheen wave) */}
        {justCompleted && (
          <div
            className="absolute inset-0 pointer-events-none z-20 animate-complete-sheen"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.22) 50%, transparent 100%)',
            }}
          />
        )}

        {/* Sol Öncelik Çizgisi (Minimalist Glow Strip) */}
        <div
          className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full transition-colors duration-300"
          style={{
            background: task.completed
              ? '#10B981'
              : priorityCfg.hex,
            boxShadow: task.completed
              ? '0 0 8px rgba(16, 185, 129, 0.4)'
              : `0 0 8px ${priorityCfg.hex}40`,
          }}
        />

        <div className="p-3.5 pl-4 sm:p-4 sm:pl-4.5">
          <div className="flex items-start gap-3.5">
            {/* ─── Gelişmiş Mikro-Etkileşimli Checkbox ─── */}
            <div className="relative mt-0.5 flex-shrink-0">
              {/* Mikro-parçacık patlaması (Sparkle burst) */}
              {justCompleted && (
                <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                  {SPARKLE_BURSTS.map((sb, idx) => (
                    <span
                      key={idx}
                      className="absolute rounded-full animate-sparkle-burst"
                      style={
                        {
                          '--tx': sb.tx,
                          '--ty': sb.ty,
                          width: `${sb.size}px`,
                          height: `${sb.size}px`,
                          backgroundColor: sb.color,
                          boxShadow: `0 0 6px ${sb.color}`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}

              {/* Dışarı genişleyen başarı halkası (Ripple) */}
              {justCompleted && (
                <div
                  className="absolute inset-0 rounded-full animate-ripple-ring pointer-events-none z-10"
                />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAction();
                }}
                className={`
                  w-6 h-6 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer
                  active:scale-90
                  ${justCompleted ? 'animate-check-elastic' : ''}
                `}
                style={
                  task.completed
                    ? {
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        border: '1.5px solid #10B981',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.40)',
                      }
                    : {
                        background: 'var(--surface-2)',
                        border: `1.5px solid ${priorityCfg.hex}80`,
                      }
                }
                aria-label={task.completed ? 'Görevi geri al' : 'Görevi tamamla'}
              >
                {task.completed && (
                  <svg
                    className="w-3.5 h-3.5 text-white animate-checkmark-draw"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </div>

            {/* ─── Görev İçeriği & Başlık ─── */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => {
                if (offsetX !== 0) {
                  setOffsetX(0);
                  return;
                }
                if (!task.completed && onFocus) {
                  onFocus(task);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="relative min-w-0 pr-1">
                  <p
                    className={`text-[14px] sm:text-[15px] font-semibold leading-snug tracking-tight transition-colors duration-200 ${
                      task.completed ? 'text-app-muted' : 'text-app-primary'
                    }`}
                  >
                    {task.title}
                  </p>

                  {/* Dinamik Strikethrough Çizgi Animasyonu */}
                  {task.completed && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.75px] bg-emerald-500/80 rounded-full animate-strike-draw"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>

                {/* Sağ Aksiyon İkonları (Masaüstü & Mobil İçin Rafine) */}
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!task.completed && onFocus && (
                    <button
                      type="button"
                      onClick={() => onFocus(task)}
                      title="Odaklanma Modunu Başlat (25 dk)"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors active:scale-90"
                      aria-label="Göreve odaklan"
                    >
                      <Timer size={14} />
                    </button>
                  )}

                  {task.note && (
                    <button
                      type="button"
                      onClick={() => setExpanded(!expanded)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-app-primary hover:bg-surface-2 transition-colors active:scale-90"
                      aria-label={expanded ? 'Notu gizle' : 'Notu göster'}
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-colors active:scale-90"
                    aria-label="Görevi sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* ─── Rafine Çip Etiketler ─── */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {/* Kategori Etiketi */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${categoryCfg.badgeBg} ${categoryCfg.badgeText}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: categoryCfg.dotColor }}
                  />
                  <span>{categoryCfg.shortLabel}</span>
                </span>

                {/* Öncelik Etiketi */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dotColor}`} />
                  <span>{priorityCfg.label}</span>
                </span>

                {/* Saat */}
                <span className="text-app-muted text-[10px] font-medium px-0.5">
                  {formattedTime}
                </span>

                {/* Hatırlatıcı */}
                {reminderLabel && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: 'var(--primary-dim)',
                      color: 'var(--primary-light)',
                      border: '1px solid rgba(99, 102, 241, 0.20)',
                    }}
                  >
                    <Bell size={9} strokeWidth={2.5} />
                    <span>{reminderLabel}</span>
                  </span>
                )}

                {/* Erteleme Geri Bildirimi */}
                {snoozedFeedback && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 animate-fade-in">
                    <Clock size={9} />
                    <span>{snoozedFeedback}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Açılır Not Bölümü */}
          {task.note && expanded && (
            <div
              className="mt-3 ml-9 pt-2.5 border-t border-app animate-fade-in"
            >
              <div className="flex items-start gap-2">
                <FileText size={12} className="text-app-muted mt-0.5 flex-shrink-0" />
                <p className="text-app-secondary text-xs leading-relaxed whitespace-pre-wrap">
                  {task.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
