import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Bell,
  BellOff,
  ChevronDown,
  StickyNote,
  ChevronUp,
  Loader2,
  Tag,
} from 'lucide-react';
import type { TaskFormData, Priority, Category } from '../types';
import { PRIORITY_CONFIG, CATEGORY_CONFIG } from '../types';

type TaskFormProps = {
  onAdd: (data: TaskFormData) => void;
  onClose: () => void;
  isSubmitting?: boolean;
};

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const CATEGORIES: Category[] = ['work', 'personal', 'urgent'];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

type DrumProps = {
  items: string[];
  selected: string;
  onChange: (val: string) => void;
  label: string;
};

function DrumScroller({ items, selected, onChange, label }: DrumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 40;

  const scrollTo = useCallback(
    (val: string, animated = true) => {
      const idx = items.indexOf(val);
      if (idx === -1 || !containerRef.current) return;
      containerRef.current.scrollTo({
        top: idx * ITEM_H,
        behavior: animated ? 'smooth' : 'instant',
      });
    },
    [items]
  );

  useEffect(() => {
    scrollTo(selected, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const idx = Math.round(scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onChange(items[clamped]);
  }, [items, onChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-app-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <div className="relative w-14">
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 rounded-xl pointer-events-none z-10 border"
          style={{
            borderColor: 'rgba(99, 102, 241, 0.45)',
            background: 'var(--primary-dim)',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-10 pointer-events-none z-10 rounded-t-xl"
          style={{ background: 'linear-gradient(to bottom, var(--sheet-bg) 0%, transparent 100%)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-10 rounded-b-xl"
          style={{ background: 'linear-gradient(to top, var(--sheet-bg) 0%, transparent 100%)' }}
        />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-y-scroll scrollbar-none"
          style={{
            height: ITEM_H * 3,
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ height: ITEM_H }} />
          {items.map((item) => (
            <div
              key={item}
              onClick={() => {
                onChange(item);
                scrollTo(item);
              }}
              className="flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'center',
                color: item === selected ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: item === selected ? 700 : 400,
                fontSize: item === selected ? 19 : 14,
              }}
            >
              {item}
            </div>
          ))}
          <div style={{ height: ITEM_H }} />
        </div>
      </div>
    </div>
  );
}

export function TaskForm({ onAdd, onClose, isSubmitting = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('personal');
  const [showNote, setShowNote] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultHour = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return String(d.getHours()).padStart(2, '0');
  };
  const [selHour, setSelHour] = useState(defaultHour);
  const [selMinute, setSelMinute] = useState('00');

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    if (cat === 'urgent') {
      setPriority('high');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    let reminder_time: string | null = null;
    if (showReminder) {
      const now = new Date();
      const chosen = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        Number(selHour),
        Number(selMinute),
        0,
        0
      );
      if (chosen <= now) chosen.setDate(chosen.getDate() + 1);
      reminder_time = chosen.toISOString();
    }

    onAdd({ title, note, priority, category, reminder_time });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'var(--overlay)' }}
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md border-t sm:border rounded-t-3xl pt-5 px-5 animate-slide-up shadow-2xl transition-colors duration-300 select-none"
        style={{
          background: 'var(--sheet-bg)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.55)',
          paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle bar */}
        <div
          className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
          style={{ background: 'var(--border-strong)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-1.5 mb-4">
          <div>
            <p className="text-app-muted text-[10px] font-bold uppercase tracking-widest">
              Planlayıcı
            </p>
            <h2 className="text-app-primary text-lg font-bold tracking-tight">Yeni Görev</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ne yapılması gerekiyor?"
            maxLength={120}
            className="select-text input-base"
          />

          {/* Kategori Seçici */}
          <div>
            <p className="text-app-muted text-[11px] font-semibold mb-2 px-0.5 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={11} />
              <span>Kategori</span>
            </p>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97]
                      flex items-center justify-center gap-1.5
                      ${active ? `${cfg.badgeBg} ${cfg.badgeText}` : 'text-app-muted'}
                    `}
                    style={
                      active
                        ? { border: `1px solid ${cfg.borderColor}` }
                        : { background: 'var(--surface)', border: '1px solid var(--border)' }
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: active ? cfg.dotColor : 'var(--text-faint)' }}
                    />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Öncelik Seçici */}
          <div>
            <p className="text-app-muted text-[11px] font-semibold mb-2 px-0.5 uppercase tracking-wider">
              Öncelik Seviyesi
            </p>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97]
                      flex items-center justify-center gap-1.5
                      ${active ? `${cfg.badgeBg} ${cfg.badgeText}` : 'text-app-muted'}
                    `}
                    style={
                      active
                        ? { border: `1px solid ${getPriorityBorderColor(p)}` }
                        : { background: 'var(--surface)', border: '1px solid var(--border)' }
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dotColor : ''}`}
                      style={!active ? { background: 'var(--text-faint)' } : {}}
                    />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hatırlatıcı Toggle */}
          <button
            type="button"
            id="reminder-toggle-btn"
            onClick={() => setShowReminder(!showReminder)}
            className="w-full flex items-center gap-2.5 text-app-secondary text-xs py-2.5 px-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {showReminder ? (
              <Bell size={13} className="text-indigo-400 flex-shrink-0" />
            ) : (
              <BellOff size={13} className="flex-shrink-0" />
            )}
            <span className={showReminder ? 'text-indigo-400 font-semibold' : ''}>
              {showReminder ? `Hatırlatıcı: ${selHour}:${selMinute}` : 'Hatırlatıcı saati ekle'}
            </span>
            <ChevronDown
              size={13}
              className={`ml-auto transition-transform duration-200 ${
                showReminder ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Drum Picker */}
          {showReminder && (
            <div
              className="rounded-2xl p-4 border transition-colors duration-300 animate-fade-in"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-center gap-3">
                <DrumScroller items={HOURS} selected={selHour} onChange={setSelHour} label="Saat" />
                <div className="flex flex-col items-center gap-2.5 pt-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                <DrumScroller
                  items={MINUTES}
                  selected={selMinute}
                  onChange={setSelMinute}
                  label="Dakika"
                />
              </div>
            </div>
          )}

          {/* Not Toggle */}
          <button
            type="button"
            onClick={() => setShowNote(!showNote)}
            className="w-full flex items-center gap-2.5 text-app-secondary text-xs py-2.5 px-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <StickyNote size={13} className="flex-shrink-0" />
            <span>{showNote ? 'Notu gizle' : 'Not ekle (isteğe bağlı)'}</span>
            <ChevronUp
              size={13}
              className={`ml-auto transition-transform duration-200 ${
                showNote ? '' : 'rotate-180'
              }`}
            />
          </button>

          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detaylar veya alt adımlar..."
              rows={3}
              maxLength={500}
              className="select-text input-base resize-none animate-fade-in"
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="btn-primary w-full py-3.5"
          >
            {isSubmitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Plus size={17} strokeWidth={2.5} />
            )}
            <span>{isSubmitting ? 'Ekleniyor...' : 'Görevi Kaydet'}</span>
            {!isSubmitting && showReminder && (
              <span className="text-indigo-200 font-normal text-xs ml-1">
                · {selHour}:{selMinute}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function getPriorityBorderColor(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'rgba(239, 68, 68, 0.40)';
    case 'medium':
      return 'rgba(245, 158, 11, 0.40)';
    default:
      return 'rgba(100, 116, 139, 0.40)';
  }
}
