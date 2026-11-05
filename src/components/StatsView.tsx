import { TrendingUp, Target, CheckCircle2, Clock, Flame } from 'lucide-react';
import { PRIORITY_CONFIG } from '../types';
import type { TaskStats } from '../hooks/useTasks';

type StatsViewProps = {
  stats: TaskStats;
  streak?: number;
};

export function StatsView({ stats, streak = 1 }: StatsViewProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.completionRate / 100) * circumference;

  const getPriorityCount = (p: 'high' | 'medium' | 'low') => {
    if (p === 'high') return stats.highPriority;
    if (p === 'medium') return stats.mediumPriority;
    return stats.lowPriority;
  };

  return (
    <div className="px-5 pb-6 space-y-4 select-none animate-fade-in">
      {/* Dairesel İlerleme & Seri Özeti */}
      <div
        className="border rounded-3xl p-6 flex flex-col items-center transition-colors duration-300"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="relative w-36 h-36 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={stats.completionRate === 100 ? '#10B981' : '#6366F1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-app-primary text-3xl font-extrabold tracking-tight">
              %{stats.completionRate}
            </p>
            <p className="text-app-muted text-[11px] font-semibold mt-0.5 uppercase tracking-wider">
              Tamamlama
            </p>
          </div>
        </div>

        <p className="text-app-secondary text-sm text-center font-medium">
          {stats.total > 0
            ? `${stats.completed} / ${stats.total} görev tamamlandı`
            : 'Henüz görev eklenmedi'}
        </p>

        {/* Seri Rozeti */}
        <div
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.22)',
            color: '#FBBF24',
          }}
        >
          <Flame size={13} className="fill-amber-400 text-amber-400" />
          <span>{streak} Günlük Aktif Seri</span>
        </div>
      </div>

      {/* İstatistik Kartları — 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        <StatCard
          icon={<Clock size={17} className="text-indigo-400" />}
          iconBg="var(--primary-dim)"
          label="Bekleyen"
          value={stats.active}
          sub="aktif görev"
          accentColor="#818CF8"
        />
        <StatCard
          icon={<CheckCircle2 size={17} className="text-emerald-400" />}
          iconBg="rgba(16, 185, 129, 0.12)"
          label="Tamamlanan"
          value={stats.completed}
          sub="başarılı"
          accentColor="#34D399"
        />
        <StatCard
          icon={<Flame size={17} className="text-red-400" />}
          iconBg="rgba(239, 68, 68, 0.12)"
          label="Yüksek Öncelik"
          value={stats.highPriority}
          sub="kritik görev"
          accentColor="#F87171"
        />
        <StatCard
          icon={<Target size={17} className="text-amber-400" />}
          iconBg="rgba(245, 158, 11, 0.12)"
          label="Toplam"
          value={stats.total}
          sub="tüm görevler"
          accentColor="#FBBF24"
        />
      </div>

      {/* Öncelik Dağılımı */}
      <div
        className="border rounded-3xl p-5 transition-colors duration-300"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-app-primary text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-indigo-400" />
          <span>Öncelik Dağılımı</span>
        </h3>
        <div className="space-y-3.5">
          {(['high', 'medium', 'low'] as const).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const count = getPriorityCount(p);
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

            return (
              <div key={p} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-14 ${cfg.textColor}`}>
                  {cfg.label}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div
                    className={`h-full ${cfg.color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-app-secondary text-xs font-semibold w-8 text-right tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  sub: string;
  accentColor: string;
};

function StatCard({ icon, iconBg, label, value, sub, accentColor }: StatCardProps) {
  return (
    <div
      className="border rounded-2xl p-4 transition-all duration-200"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <p className="text-app-primary text-2xl font-bold tracking-tight leading-none tabular-nums">
        {value}
      </p>
      <p className="text-app-secondary text-xs font-semibold mt-1.5">{label}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: accentColor, opacity: 0.8 }}>
        {sub}
      </p>
    </div>
  );
}
