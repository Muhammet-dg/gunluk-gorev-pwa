import { useState } from 'react';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import {
  Trash2,
  Archive,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MoveHorizontal,
} from 'lucide-react';

type TaskListProps = {
  tasks: Task[];
  archivedTasks?: Task[];
  type: 'active' | 'completed';
  filteredCategoryName?: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string, mode: '1h' | 'tomorrow') => void;
  onFocus?: (task: Task) => void;
  onClearCompleted?: () => void;
  onRestoreCompleted?: () => void;
  onArchiveCompleted?: () => void;
  onRestoreFromArchive?: (id: string) => void;
  onClearArchive?: () => void;
};

export function TaskList({
  tasks,
  archivedTasks = [],
  type,
  filteredCategoryName,
  onToggle,
  onDelete,
  onSnooze,
  onFocus,
  onClearCompleted,
  onRestoreCompleted,
  onArchiveCompleted,
  onRestoreFromArchive,
  onClearArchive,
}: TaskListProps) {
  const [showArchive, setShowArchive] = useState(false);

  if (tasks.length === 0 && (type === 'active' || archivedTasks.length === 0)) {
    return <EmptyState type={type} filteredCategoryName={filteredCategoryName} />;
  }

  return (
    <div className="px-5 pb-6">
      {/* Bölüm Başlığı & Toplu Aksiyonlar */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.12em]">
              {type === 'active'
                ? `${tasks.length} Bekleyen Görev`
                : `${tasks.length} Tamamlanan`}
            </p>
            {type === 'active' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-app-faint font-medium">
                <MoveHorizontal size={10} />
                Kaydır: Tamamla / Ertele
              </span>
            )}
          </div>

          {type === 'completed' && tasks.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Geri Yükle */}
              {onRestoreCompleted && (
                <button
                  onClick={onRestoreCompleted}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all duration-150 active:scale-95 text-app-secondary hover:text-app-primary"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                  title="Tamamlananları aktif listeye geri yükle"
                >
                  <RotateCcw size={11} />
                  <span>Geri Yükle</span>
                </button>
              )}

              {/* Arşive Taşı */}
              {onArchiveCompleted && (
                <button
                  onClick={onArchiveCompleted}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
                  style={{
                    color: '#818CF8',
                    background: 'var(--primary-dim)',
                    border: '1px solid rgba(99, 102, 241, 0.22)',
                  }}
                  title="Tamamlananları arşive kaldır"
                >
                  <Archive size={11} />
                  <span>Arşive Taşı</span>
                </button>
              )}

              {/* Tümünü Sil */}
              {onClearCompleted && (
                <button
                  onClick={onClearCompleted}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
                  style={{
                    color: '#F87171',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.16)',
                  }}
                  title="Kalıcı olarak temizle"
                >
                  <Trash2 size={11} />
                  <span>Temizle</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Görev Kartları Listesi */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onSnooze={onSnooze}
              onFocus={onFocus}
            />
          ))}
        </div>
      ) : (
        <EmptyState type={type} filteredCategoryName={filteredCategoryName} />
      )}

      {/* Arşivlenen Görevler Çekmecesi (Tamamlanan Sekmesinde) */}
      {type === 'completed' && archivedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowArchive((v) => !v)}
              className="flex items-center gap-2 text-app-secondary hover:text-app-primary text-xs font-semibold transition-colors"
            >
              <Archive size={13} className="text-indigo-400" />
              <span>Arşivlenen Görevler ({archivedTasks.length})</span>
              {showArchive ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showArchive && onClearArchive && (
              <button
                type="button"
                onClick={onClearArchive}
                className="text-[11px] text-app-muted hover:text-red-400 font-medium transition-colors"
              >
                Arşivi Boşalt
              </button>
            )}
          </div>

          {showArchive && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {archivedTasks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-3 border flex items-center justify-between gap-3"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-app-secondary text-xs font-medium line-through truncate">
                      {item.title}
                    </p>
                  </div>
                  {onRestoreFromArchive && (
                    <button
                      type="button"
                      onClick={() => onRestoreFromArchive(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-300 transition-transform active:scale-95 flex-shrink-0"
                      style={{
                        background: 'var(--primary-dim)',
                      }}
                    >
                      <RotateCcw size={11} />
                      <span>Geri Yükle</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
