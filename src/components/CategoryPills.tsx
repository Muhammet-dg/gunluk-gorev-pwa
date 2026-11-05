import type { FilterCategory, Task } from '../types';
import { Briefcase, User, Flame, Layers } from 'lucide-react';

type CategoryPillsProps = {
  selected: FilterCategory;
  onSelect: (category: FilterCategory) => void;
  tasks: Task[];
};

const PILLS: Array<{
  id: FilterCategory;
  label: string;
  Icon: React.ElementType;
  dotColor?: string;
}> = [
  { id: 'all', label: 'Tümü', Icon: Layers },
  { id: 'work', label: 'İş / Proje', Icon: Briefcase, dotColor: '#818CF8' },
  { id: 'personal', label: 'Kişisel', Icon: User, dotColor: '#34D399' },
  { id: 'urgent', label: 'Acil', Icon: Flame, dotColor: '#F87171' },
];

export function CategoryPills({ selected, onSelect, tasks }: CategoryPillsProps) {
  const getCount = (cat: FilterCategory): number => {
    if (cat === 'all') return tasks.length;
    if (cat === 'urgent') {
      return tasks.filter((t) => t.category === 'urgent' || t.priority === 'high').length;
    }
    return tasks.filter((t) => (t.category ?? 'personal') === cat).length;
  };

  return (
    <div className="px-5 mb-3 overflow-x-auto scrollbar-none select-none">
      <div className="flex items-center gap-2 min-w-max">
        {PILLS.map(({ id, label, Icon, dotColor }) => {
          const isActive = selected === id;
          const count = getCount(id);

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                transition-all duration-200 active:scale-95
                ${isActive ? 'text-white shadow-sm' : 'text-app-secondary hover:text-app-primary'}
              `}
              style={
                isActive
                  ? {
                      background: 'var(--primary)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      boxShadow: '0 4px 14px var(--primary-glow)',
                    }
                  : {
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }
              }
            >
              {dotColor && !isActive ? (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: dotColor }}
                />
              ) : (
                <Icon size={12} strokeWidth={2.2} />
              )}

              <span>{label}</span>

              <span
                className="ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md leading-tight"
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.20)' : 'var(--surface-2)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

