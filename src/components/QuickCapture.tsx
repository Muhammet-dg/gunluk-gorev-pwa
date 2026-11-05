import { useState, useMemo } from 'react';
import { Plus, Clock, Sparkles, X, CornerDownLeft, Tag } from 'lucide-react';
import type { Category, Priority, TaskFormData } from '../types';
import { CATEGORY_CONFIG } from '../types';

type QuickCaptureProps = {
  onAdd: (data: TaskFormData) => void;
  defaultCategory?: Category;
};

type ParsedTimeResult = {
  cleanTitle: string;
  hour: number;
  minute: number;
  isTomorrow: boolean;
  label: string;
  matchedText: string;
} | null;

/**
 * Doğal dilde saat algılama:
 * Örn: "Sunum hazırla 18:00", "Yarın 09:30 ekip toplantısı", "Su iç 14.30"
 */
function parseNaturalTime(input: string): ParsedTimeResult {
  const regex = /(?:(yarın|yarin)\s+)?\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/i;
  const match = input.match(regex);
  if (!match) return null;

  const isTomorrow = Boolean(match[1]);
  const hour = parseInt(match[2], 10);
  const minute = parseInt(match[3], 10);
  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const label = isTomorrow ? `Yarın ${formattedTime}` : formattedTime;

  const cleanTitle = input.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();

  return {
    cleanTitle: cleanTitle || input.trim(),
    hour,
    minute,
    isTomorrow,
    label,
    matchedText: match[0],
  };
}

const CATEGORIES: Category[] = ['personal', 'work', 'urgent'];

export function QuickCapture({ onAdd, defaultCategory = 'personal' }: QuickCaptureProps) {
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(defaultCategory);
  const [showTimePresets, setShowTimePresets] = useState(false);
  const [manualTime, setManualTime] = useState<{ label: string; iso: string } | null>(null);
  const [ignoreAutoTime, setIgnoreAutoTime] = useState(false);

  const detectedTime = useMemo(() => {
    if (ignoreAutoTime || manualTime) return null;
    return parseNaturalTime(text);
  }, [text, ignoreAutoTime, manualTime]);

  const cycleCategory = () => {
    const idx = CATEGORIES.indexOf(selectedCategory);
    const next = CATEGORIES[(idx + 1) % CATEGORIES.length];
    setSelectedCategory(next);
  };

  const applyPreset = (type: '1h' | '18:00' | '21:00' | 'tomorrow9') => {
    const now = new Date();
    const target = new Date(now);
    let label = '';

    if (type === '1h') {
      target.setHours(target.getHours() + 1);
      label = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
    } else if (type === '18:00') {
      target.setHours(18, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      label = '18:00';
    } else if (type === '21:00') {
      target.setHours(21, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      label = '21:00';
    } else if (type === 'tomorrow9') {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      label = 'Yarın 09:00';
    }

    setManualTime({ label, iso: target.toISOString() });
    setShowTimePresets(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    let finalTitle = text.trim();
    let reminderIso: string | null = null;

    if (manualTime) {
      reminderIso = manualTime.iso;
    } else if (detectedTime) {
      finalTitle = detectedTime.cleanTitle;
      const now = new Date();
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        detectedTime.hour,
        detectedTime.minute,
        0,
        0
      );
      if (detectedTime.isTomorrow || target <= now) {
        target.setDate(target.getDate() + 1);
      }
      reminderIso = target.toISOString();
    }

    const priority: Priority = selectedCategory === 'urgent' ? 'high' : 'medium';

    onAdd({
      title: finalTitle,
      note: '',
      priority,
      category: selectedCategory,
      reminder_time: reminderIso,
    });

    setText('');
    setManualTime(null);
    setIgnoreAutoTime(false);
    setShowTimePresets(false);
  };

  const catConfig = CATEGORY_CONFIG[selectedCategory];
  const activeTimeLabel = manualTime?.label ?? detectedTime?.label ?? null;

  return (
    <div className="px-5 mb-3.5 select-none">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border transition-all duration-200 overflow-hidden"
        style={{
          background: 'var(--surface)',
          borderColor: text.trim() ? 'var(--border-focus)' : 'var(--border)',
          boxShadow: text.trim() ? '0 4px 20px rgba(99, 102, 241, 0.08)' : 'none',
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: text.trim() ? 'var(--primary)' : 'var(--surface-2)',
              color: text.trim() ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (ignoreAutoTime) setIgnoreAutoTime(false);
            }}
            placeholder='Hızlı görev ekle... (örn. "Raporu tamamla 18:00")'
            maxLength={120}
            className="select-text flex-1 bg-transparent text-app-primary text-xs sm:text-sm placeholder-app-muted outline-none min-w-0 font-medium"
          />

          {/* Algılanan veya Seçilen Saat Rozeti */}
          {activeTimeLabel && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 animate-scale-in"
              style={{
                background: 'var(--primary-dim)',
                color: 'var(--primary-light)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <Sparkles size={10} />
              <span>{activeTimeLabel}</span>
              <button
                type="button"
                onClick={() => {
                  if (manualTime) setManualTime(null);
                  else setIgnoreAutoTime(true);
                }}
                className="ml-0.5 hover:opacity-80"
                aria-label="Saati kaldır"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Tek Tıkla Kategori Değiştirme */}
          <button
            type="button"
            onClick={cycleCategory}
            title="Kategori değiştirmek için dokun"
            className="hidden xs:inline-flex sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 flex-shrink-0"
            style={{
              background: 'var(--surface-2)',
              border: `1px solid ${catConfig.borderColor}`,
              color: catConfig.dotColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: catConfig.dotColor }}
            />
            <span>{catConfig.shortLabel}</span>
          </button>

          {/* Saat Seçici Butonu */}
          <button
            type="button"
            onClick={() => setShowTimePresets((v) => !v)}
            aria-label="Hızlı hatırlatıcı saati seç"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            style={{
              background: showTimePresets || activeTimeLabel ? 'var(--primary-dim)' : 'var(--surface-2)',
              color: showTimePresets || activeTimeLabel ? 'var(--primary-light)' : 'var(--text-secondary)',
            }}
          >
            <Clock size={14} />
          </button>

          {/* Gönder Butonu (Metin varsa) */}
          {text.trim() && (
            <button
              type="submit"
              aria-label="Görevi ekle"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all active:scale-90 flex-shrink-0 animate-scale-in"
              style={{ background: 'var(--primary)' }}
            >
              <CornerDownLeft size={13} />
            </button>
          )}
        </div>

        {/* Tek Tıkla Saat & Kategori Alt Barı */}
        {showTimePresets && (
          <div
            className="px-3.5 py-2.5 border-t flex items-center justify-between gap-2 flex-wrap animate-fade-in"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)' }}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-app-muted text-[10px] font-semibold uppercase tracking-wider mr-1">
                Saat:
              </span>
              {[
                { id: '1h', label: '+1 Saat' },
                { id: '18:00', label: 'Bugün 18:00' },
                { id: '21:00', label: 'Akşam 21:00' },
                { id: 'tomorrow9', label: 'Yarın 09:00' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id as '1h' | '18:00' | '21:00' | 'tomorrow9')}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-app-secondary hover:text-app-primary transition-all active:scale-95"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={cycleCategory}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${catConfig.borderColor}`,
                color: catConfig.dotColor,
              }}
            >
              <Tag size={10} />
              <span>{catConfig.label}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

