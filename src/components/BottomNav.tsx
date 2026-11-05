import { ListTodo, CheckCircle2, BarChart3 } from 'lucide-react';
import type { Tab } from '../types';

type BottomNavProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  activeCount: number;
  completedCount: number;
};

type TabItem = {
  id: Tab;
  label: string;
  Icon: React.ElementType;
};

const TABS: TabItem[] = [
  { id: 'tasks', label: 'Görevler', Icon: ListTodo },
  { id: 'completed', label: 'Tamamlanan', Icon: CheckCircle2 },
  { id: 'stats', label: 'İstatistik', Icon: BarChart3 },
];

export function BottomNav({ activeTab, onTabChange, activeCount, completedCount }: BottomNavProps) {
  const getCount = (tab: Tab): number | null => {
    if (tab === 'tasks') return activeCount;
    if (tab === 'completed') return completedCount;
    return null;
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-4 pointer-events-none select-none z-20"
      style={{
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <nav
        aria-label="Alt navigasyon"
        className="pointer-events-auto mx-auto max-w-sm rounded-2xl glass-nav px-2 py-1.5 shadow-2xl transition-all duration-300"
        style={{
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.42)',
        }}
      >
        <div className="flex items-center justify-around">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            const count = getCount(id);

            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 active:scale-95 relative"
              >
                {/* Aktif Sekme Yüzey Vurgusu */}
                {isActive && (
                  <div
                    className="absolute inset-x-2 inset-y-0.5 rounded-xl transition-all duration-300"
                    style={{
                      background: 'var(--primary-dim)',
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.75}
                    className={`transition-all duration-200 ${
                      isActive ? 'text-indigo-400 -translate-y-0.5' : 'text-app-muted'
                    }`}
                  />

                  {count !== null && count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] rounded-full text-[9px] font-bold flex items-center justify-center leading-none px-1"
                      style={{
                        background: isActive ? 'var(--primary)' : 'var(--surface-2)',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-semibold tracking-tight transition-all duration-200 z-10 ${
                    isActive ? 'text-app-primary' : 'text-app-muted'
                  }`}
                >
                  {label}
                </span>

                {/* Minimalist Işık / Nokta Göstergesi */}
                {isActive && (
                  <span
                    className="w-1 h-1 rounded-full animate-scale-in"
                    style={{
                      background: '#818CF8',
                      boxShadow: '0 0 8px #6366F1',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
