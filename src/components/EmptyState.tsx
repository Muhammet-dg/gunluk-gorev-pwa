type EmptyStateProps = {
  type: 'active' | 'completed';
  filteredCategoryName?: string;
};

export function EmptyState({ type, filteredCategoryName }: EmptyStateProps) {
  if (type === 'active') {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-8 text-center select-none animate-fade-in">
        {/* Estetik Minimal Çizim (Editorial SVG) */}
        <div className="relative mb-6 animate-float">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center border"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Minimalist Editorial Sun / Horizon & Checkmark */}
              <circle
                cx="24"
                cy="24"
                r="16"
                stroke="#6366F1"
                strokeWidth="1.75"
                strokeDasharray="3 3"
                opacity="0.55"
              />
              <circle
                cx="24"
                cy="24"
                r="11"
                fill="rgba(16, 185, 129, 0.12)"
                stroke="#10B981"
                strokeWidth="1.75"
              />
              <path
                d="M19.5 24.2L22.6 27.3L28.8 21"
                stroke="#34D399"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="36" cy="12" r="2" fill="#818CF8" />
              <circle cx="11" cy="34" r="1.5" fill="#F59E0B" opacity="0.8" />
            </svg>
          </div>
        </div>

        <h3 className="text-app-primary font-bold text-base mb-1.5 tracking-tight">
          {filteredCategoryName
            ? `${filteredCategoryName} kategorisinde görev yok`
            : 'Bugünlük her şey tamam!'}
        </h3>
        <p className="text-app-secondary text-xs leading-relaxed max-w-[235px]">
          Yeni bir hedef belirlemek için üstteki hızlı giriş alanını veya{' '}
          <span className="font-bold text-indigo-400">+</span> butonunu kullanabilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center select-none animate-fade-in">
      <div className="relative mb-6 animate-float">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <svg
            width="46"
            height="46"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="12"
              y="10"
              width="24"
              height="28"
              rx="6"
              stroke="#64748B"
              strokeWidth="1.75"
              opacity="0.6"
            />
            <path
              d="M18 19H30M18 25H26"
              stroke="#818CF8"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <circle cx="32" cy="33" r="6" fill="rgba(16, 185, 129, 0.16)" stroke="#10B981" strokeWidth="1.75" />
            <path
              d="M29.8 33L31.3 34.5L34.5 31.3"
              stroke="#34D399"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-app-primary font-bold text-base mb-1.5 tracking-tight">
        Henüz tamamlanan görev yok
      </h3>
      <p className="text-app-secondary text-xs leading-relaxed max-w-[220px]">
        Görevleri tamamladığında veya sağa kaydırdığında burada listelenecek.
      </p>
    </div>
  );
}
