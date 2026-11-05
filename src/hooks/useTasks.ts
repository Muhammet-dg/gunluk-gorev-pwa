import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Task, TaskFormData } from '../types';
import { encodeNoteWithCategory, saveLocalCategory } from '../types';
import type { Database } from '../lib/supabase';
import { supabase, rowToTask } from '../lib/supabase';
import { scheduleTaskReminder, cancelTaskReminder } from '../lib/qstash';

type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// ─── Durum Tipleri ───────────────────────────────────────────
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type TaskStats = {
  total: number;
  completed: number;
  active: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completionRate: number;
};

type UseTasksReturn = {
  tasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
  archivedTasks: Task[];
  stats: TaskStats;
  loading: LoadingState;
  isSubmitting: boolean;
  error: string | null;
  addTask: (data: TaskFormData) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, mode?: '1h' | 'tomorrow') => Promise<void>;
  clearCompleted: () => Promise<void>;
  restoreCompleted: () => Promise<void>;
  archiveCompleted: () => Promise<void>;
  restoreFromArchive: (id: string) => Promise<void>;
  clearArchive: () => void;
  refetch: () => Promise<void>;
};

type UseTasksOptions = {
  /** Supabase auth user id. Görevler yalnızca bu kullanıcıya filtrelenir. */
  userId: string;
};

const ARCHIVE_STORAGE_PREFIX = 'flowday_archived_tasks_';

function loadArchivedTasks(userId: string): Task[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${ARCHIVE_STORAGE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function saveArchivedTasks(userId: string, list: Task[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${ARCHIVE_STORAGE_PREFIX}${userId}`, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

// ─── Hook ────────────────────────────────────────────────────
export function useTasks({ userId }: UseTasksOptions): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>(() => loadArchivedTasks(userId));
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Çift gönderimi önlemek için ref — render'dan bağımsız, anlık flag
  const isAddingRef = useRef(false);
  // QStash messageId haritası: taskId → messageId
  // Görev silinince / tamamlanınca zamanlanmış mesajı iptal etmek için
  const qstashMessageIds = useRef<Map<string, string>>(new Map());

  // Kullanıcı değiştiğinde arşivi yükle
  useEffect(() => {
    setArchivedTasks(loadArchivedTasks(userId));
  }, [userId]);

  // ── Görevleri yükle ────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!userId || userId.trim() === '') {
      console.warn('[useTasks] fetchTasks: userId henüz hazır değil, istek atlanıyor.');
      return;
    }

    setLoading('loading');
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks((data ?? []).map(rowToTask));
      setLoading('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Görevler yüklenemedi';
      setError(msg);
      setLoading('error');
      console.error('[useTasks] fetchTasks:', err);
    }
  }, [userId]);

  // ── İlk yüklemede + realtime için ──────────────────────────
  useEffect(() => {
    if (!userId || userId.trim() === '') {
      setTasks([]);
      setLoading('idle');
      return;
    }

    setTasks([]);
    void fetchTasks();

    const channel = supabase
      .channel(`tasks-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => {
              const incoming = rowToTask(payload.new as Parameters<typeof rowToTask>[0]);
              const alreadyExists = prev.some((t) => t.id === incoming.id);
              if (alreadyExists) return prev;
              return [incoming, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new.id
                  ? rowToTask(payload.new as Parameters<typeof rowToTask>[0])
                  : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchTasks, userId]);

  // ── Görev ekle ──────────────────────────────────────────────
  const addTask = useCallback(async (data: TaskFormData) => {
    if (!userId || userId.trim() === '') {
      console.error('[useTasks] addTask: Geçerli bir kullanıcı oturumu bulunamadı, görev eklenemiyor.');
      setError('Görev eklemek için lütfen tekrar giriş yapın.');
      return;
    }

    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setIsSubmitting(true);

    const resolvedCategory = data.category ?? (data.priority === 'high' ? 'urgent' : 'personal');
    const cleanNote = data.note.trim() || undefined;

    const optimisticTask: Task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      note: cleanNote,
      priority: data.priority,
      category: resolvedCategory,
      completed: false,
      created_at: new Date().toISOString(),
      reminder_time: data.reminder_time,
    };

    saveLocalCategory(optimisticTask.id, resolvedCategory);

    // Optimistic update — anında UI'ya yansıt
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const encodedNote = encodeNoteWithCategory(cleanNote, resolvedCategory);

      const insertPayload: Record<string, unknown> = {
        title:        optimisticTask.title,
        note:         encodedNote,
        priority:     optimisticTask.priority,
        completed:    false,
        completed_at: null,
        user_id:      userId,
      };

      if (data.reminder_time !== undefined) {
        insertPayload['reminder_time'] = data.reminder_time;
      }

      insertPayload['is_notified'] = false;

      const { data: inserted, error: insertError } = await supabase
        .from('tasks')
        .insert(insertPayload as any)
        .select()
        .single();

      if (insertError) throw insertError;

      if (inserted) {
        saveLocalCategory(inserted.id, resolvedCategory);
        const savedTask = rowToTask(inserted);
        setTasks((prev) =>
          prev.map((t) => (t.id === optimisticTask.id ? savedTask : t))
        );

        // ── QStash: Hatırlatıcı zamanlaması ────────────────────────────────
        if (savedTask.reminder_time) {
          scheduleTaskReminder({
            taskId:       savedTask.id,
            title:        savedTask.title,
            reminderTime: savedTask.reminder_time,
            priority:     savedTask.priority,
          }).then((result) => {
            if (result.ok && result.messageId) {
              qstashMessageIds.current.set(savedTask.id, result.messageId);
            } else if (!result.ok) {
              console.error('[useTasks] ❌ QStash zamanlama başarısız:', result.error);
              setError(`Hatırlatıcı zamanlanamadı: ${result.error}`);
            }
          }).catch((err) => {
            console.error('[useTasks] ❌ QStash zamanlama hatası (beklenmeyen):', err);
            setError(`Hatırlatıcı zamanlanamadı: ${err instanceof Error ? err.message : String(err)}`);
          });
        }
      }
    } catch (err: any) {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticTask.id));
      const msg = err?.message ?? 'Görev eklenemedi';
      setError(msg);
    } finally {
      isAddingRef.current = false;
      setIsSubmitting(false);
    }
  }, [userId]);

  // ── Görev tamamla / geri al ────────────────────────────────
  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    const newCompletedAt = newCompleted ? new Date().toISOString() : null;

    // Haptic feedback (destekleyen mobil cihazlarda)
    if (newCompleted && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: newCompleted, completed_at: newCompletedAt ?? undefined }
          : t
      )
    );

    if (newCompleted) {
      const msgId = qstashMessageIds.current.get(id);
      if (msgId) {
        void cancelTaskReminder(msgId);
        qstashMessageIds.current.delete(id);
      }
    }

    try {
      const updatePayload: TaskUpdate = {
        completed: newCompleted,
        completed_at: newCompletedAt,
      };
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload as any)
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, completed: task.completed, completed_at: task.completed_at }
            : t
        )
      );
      const msg = err instanceof Error ? err.message : 'Görev güncellenemedi';
      setError(msg);
    }
  }, [tasks]);

  // ── Görev ertele (Snooze) ───────────────────────────────────
  const snoozeTask = useCallback(async (id: string, mode: '1h' | 'tomorrow' = '1h') => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const now = new Date();
    const targetDate = new Date(now);
    if (mode === '1h') {
      targetDate.setHours(targetDate.getHours() + 1);
    } else {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0);
    }
    const newReminderIso = targetDate.toISOString();

    // Eski QStash mesajını iptal et
    const oldMsgId = qstashMessageIds.current.get(id);
    if (oldMsgId) {
      void cancelTaskReminder(oldMsgId);
      qstashMessageIds.current.delete(id);
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, reminder_time: newReminderIso } : t))
    );

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ reminder_time: newReminderIso, is_notified: false } as any)
        .eq('id', id);

      if (updateError) throw updateError;

      void scheduleTaskReminder({
        taskId:       task.id,
        title:        task.title,
        reminderTime: newReminderIso,
        priority:     task.priority,
      }).then((res) => {
        if (res.ok && res.messageId) {
          qstashMessageIds.current.set(task.id, res.messageId);
        }
      });
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, reminder_time: task.reminder_time } : t))
      );
      const msg = err instanceof Error ? err.message : 'Görev ertelenemedi';
      setError(msg);
    }
  }, [tasks]);

  // ── Görev sil ───────────────────────────────────────────────
  const deleteTask = useCallback(async (id: string) => {
    const deleted = tasks.find((t) => t.id === id);

    const msgId = qstashMessageIds.current.get(id);
    if (msgId) {
      void cancelTaskReminder(msgId);
      qstashMessageIds.current.delete(id);
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      if (deleted) setTasks((prev) => [deleted, ...prev]);
      const msg = err instanceof Error ? err.message : 'Görev silinemedi';
      setError(msg);
    }
  }, [tasks]);

  // ── Tümünü temizle ──────────────────────────────────────────
  const clearCompleted = useCallback(async () => {
    const toDelete = tasks.filter((t) => t.completed);
    if (toDelete.length === 0) return;

    setTasks((prev) => prev.filter((t) => !t.completed));

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true);

      if (deleteError) throw deleteError;
    } catch (err) {
      setTasks((prev) => [...toDelete, ...prev]);
      const msg = err instanceof Error ? err.message : 'Tamamlananlar temizlenemedi';
      setError(msg);
    }
  }, [tasks, userId]);

  // ── Tamamlananları Geri Yükle (Toplu) ──────────────────────
  const restoreCompleted = useCallback(async () => {
    const toRestore = tasks.filter((t) => t.completed);
    if (toRestore.length === 0) return;

    setTasks((prev) =>
      prev.map((t) => (t.completed ? { ...t, completed: false, completed_at: undefined } : t))
    );

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ completed: false, completed_at: null } as any)
        .eq('user_id', userId)
        .eq('completed', true);

      if (updateError) throw updateError;
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => {
          const orig = toRestore.find((r) => r.id === t.id);
          return orig ? orig : t;
        })
      );
      const msg = err instanceof Error ? err.message : 'Görevler geri yüklenemedi';
      setError(msg);
    }
  }, [tasks, userId]);

  // ── Tamamlananları Arşive Taşı ──────────────────────────────
  const archiveCompleted = useCallback(async () => {
    const toArchive = tasks.filter((t) => t.completed);
    if (toArchive.length === 0) return;

    const updatedArchive = [...toArchive, ...archivedTasks].slice(0, 100);
    setArchivedTasks(updatedArchive);
    saveArchivedTasks(userId, updatedArchive);

    setTasks((prev) => prev.filter((t) => !t.completed));

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true);

      if (deleteError) throw deleteError;
    } catch (err) {
      setTasks((prev) => [...toArchive, ...prev]);
      const msg = err instanceof Error ? err.message : 'Arşivleme başarısız oldu';
      setError(msg);
    }
  }, [tasks, archivedTasks, userId]);

  // ── Arşivden Geri Yükle ─────────────────────────────────────
  const restoreFromArchive = useCallback(async (id: string) => {
    const target = archivedTasks.find((t) => t.id === id);
    if (!target) return;

    const nextArchive = archivedTasks.filter((t) => t.id !== id);
    setArchivedTasks(nextArchive);
    saveArchivedTasks(userId, nextArchive);

    await addTask({
      title: target.title,
      note: target.note ?? '',
      priority: target.priority,
      category: target.category,
      reminder_time: null,
    });
  }, [archivedTasks, userId, addTask]);

  const clearArchive = useCallback(() => {
    setArchivedTasks([]);
    saveArchivedTasks(userId, []);
  }, [userId]);

  // ── Derived state ──────────────────────────────────────────
  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = completedTasks.length;
    const active = activeTasks.length;
    const highPriority = tasks.filter((t) => t.priority === 'high').length;
    const mediumPriority = tasks.filter((t) => t.priority === 'medium').length;
    const lowPriority = tasks.filter((t) => t.priority === 'low').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      active,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate,
    };
  }, [tasks, activeTasks, completedTasks]);

  return {
    tasks,
    activeTasks,
    completedTasks,
    archivedTasks,
    stats,
    loading,
    isSubmitting,
    error,
    addTask,
    toggleTask,
    deleteTask,
    snoozeTask,
    clearCompleted,
    restoreCompleted,
    archiveCompleted,
    restoreFromArchive,
    clearArchive,
    refetch: fetchTasks,
  };
}
