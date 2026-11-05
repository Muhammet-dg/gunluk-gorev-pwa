export type Priority = 'low' | 'medium' | 'high';

export type Category = 'work' | 'personal' | 'urgent';

export type FilterCategory = 'all' | Category;

export type Tab = 'tasks' | 'completed' | 'stats';

export type Task = {
  id: string;
  title: string;
  note?: string;
  priority: Priority;
  category?: Category;
  completed: boolean;
  created_at: string;
  completed_at?: string;
  reminder_time?: string | null; // ISO 8601 — bildirim zamanı
  user_id?: string;
};

export type TaskFormData = {
  title: string;
  note: string;
  priority: Priority;
  category?: Category;
  reminder_time: string | null; // ISO 8601 — null ise bildirim yok
};

export const PRIORITY_CONFIG = {
  low: {
    label: 'Düşük',
    color: 'bg-slate-400',
    borderColor: 'border-l-slate-400',
    textColor: 'text-slate-400',
    badgeBg: 'bg-slate-500/15',
    badgeText: 'text-slate-300',
    dotColor: 'bg-slate-400',
    hex: '#64748B',
  },
  medium: {
    label: 'Orta',
    color: 'bg-amber-500',
    borderColor: 'border-l-amber-500',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    dotColor: 'bg-amber-400',
    hex: '#F59E0B',
  },
  high: {
    label: 'Yüksek',
    color: 'bg-red-500',
    borderColor: 'border-l-red-500',
    textColor: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    dotColor: 'bg-red-400',
    hex: '#EF4444',
  },
} as const;

export const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    dotColor: string;
  }
> = {
  work: {
    label: 'İş / Proje',
    shortLabel: 'İş / Proje',
    badgeBg: 'bg-indigo-500/12',
    badgeText: 'text-indigo-300',
    borderColor: 'rgba(99, 102, 241, 0.25)',
    dotColor: '#818CF8',
  },
  personal: {
    label: 'Kişisel',
    shortLabel: 'Kişisel',
    badgeBg: 'bg-emerald-500/12',
    badgeText: 'text-emerald-300',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    dotColor: '#34D399',
  },
  urgent: {
    label: 'Acil',
    shortLabel: 'Acil',
    badgeBg: 'bg-red-500/12',
    badgeText: 'text-red-300',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    dotColor: '#F87171',
  },
};

// ─── Kategori Meta Yardımcıları (Şema bağımsız kalıcılık) ───────────────────

const CATEGORY_PREFIX_REGEX = /^\[cat:(work|personal|urgent)\]\s*/i;
const LOCAL_CATEGORY_KEY = 'flowday_task_categories_v1';

export function saveLocalCategory(taskId: string, category?: Category): void {
  if (!category) return;
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORY_KEY);
    const map: Record<string, Category> = raw ? JSON.parse(raw) : {};
    map[taskId] = category;
    localStorage.setItem(LOCAL_CATEGORY_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function getLocalCategory(taskId: string): Category | undefined {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORY_KEY);
    if (!raw) return undefined;
    const map: Record<string, Category> = JSON.parse(raw);
    return map[taskId];
  } catch {
    return undefined;
  }
}

export function encodeNoteWithCategory(note?: string, category?: Category): string | null {
  const cleanNote = (note ?? '').replace(CATEGORY_PREFIX_REGEX, '').trim();
  if (!category) {
    return cleanNote || null;
  }
  return cleanNote ? `[cat:${category}] ${cleanNote}` : `[cat:${category}]`;
}

export function decodeNoteAndCategory(
  rawNote?: string | null,
  taskId?: string,
  priority?: Priority
): { note?: string; category?: Category } {
  if (!rawNote) {
    const localCat = taskId ? getLocalCategory(taskId) : undefined;
    const inferred = localCat ?? (priority === 'high' ? 'urgent' : 'personal');
    return { note: undefined, category: inferred };
  }

  const match = rawNote.match(CATEGORY_PREFIX_REGEX);
  if (match) {
    const cat = match[1].toLowerCase() as Category;
    const stripped = rawNote.replace(CATEGORY_PREFIX_REGEX, '').trim();
    return {
      note: stripped || undefined,
      category: cat,
    };
  }

  const localCat = taskId ? getLocalCategory(taskId) : undefined;
  const inferred = localCat ?? (priority === 'high' ? 'urgent' : 'personal');
  return {
    note: rawNote,
    category: inferred,
  };
}
