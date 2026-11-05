import { Sparkles } from 'lucide-react';

type ProgressWidgetProps = {
  activeCount: number;
  completedCount: number;
};

export function ProgressWidget({ activeCount, completedCount }: ProgressWidgetProps) {
  const total = activeCount + completedCount;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const getMotivationalQuote = () => {
    if (total === 0) return 'Zihnini boşaltmak için ilk hedefini belirle.';
    if (percentage === 100) return 'Muazzam! Bugünün tüm hedeflerini tamamladın.';
    if (percentage >= 75) return 'Son düzlük, harika bir ritim yakaladın.';
    if (percentage >= 40) return 'İstikrarlı ilerliyorsun, odağını koru.';
    if (completedCount > 0) return 'İlk adım atıldı, devamı kendiliğinden gelecek.';
    return 'Küçük bir görevle başla, ivme kazan.';
  };

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="rounded-2xl p-4 border transition-all duration-300"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Dairesel İlerleme Halkası */}
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 54 54">
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth="4.5"
            />
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={percentage === 100 ? '#10B981' : '#6366F1'}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute text-xs font-bold text-app-primary tracking-tight">
            %{percentage}
          </span>
        </div>

        {/* Metin ve İnce Yatay İlerleme Çubuğu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-app-primary text-sm font-semibold tracking-tight truncate">
              {completedCount} görev tamamlandı,{' '}
              <span className="text-app-secondary font-medium">{activeCount} bekliyor</span>
            </p>
          </div>

          {/* Yatay İnce İlerleme Çubuğu */}
          <div
            className="w-full h-1.5 rounded-full overflow-hidden mt-2 mb-2"
            style={{ background: 'var(--surface-2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background:
                  percentage === 100
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : 'linear-gradient(90deg, #6366F1, #818CF8)',
              }}
            />
          </div>

          {/* Motive Edici Editorial Söz */}
          <p className="text-app-muted text-[11px] font-medium flex items-center gap-1.5 truncate">
            <Sparkles
              size={11}
              className="flex-shrink-0"
              style={{ color: percentage === 100 ? '#34D399' : '#818CF8' }}
            />
            <span className="truncate">{getMotivationalQuote()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

