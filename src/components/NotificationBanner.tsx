import { Bell, BellOff, Loader2, X } from 'lucide-react';
import type { SubscriptionStatus } from '../hooks/useNotifications';

type NotificationBannerProps = {
  status: SubscriptionStatus;
  onSubscribe: () => void;
  onDismiss: () => void;
};

export function NotificationBanner({ status, onSubscribe, onDismiss }: NotificationBannerProps) {
  const isLoading = status === 'subscribing' || status === 'checking';
  const isDenied = status === 'permission-denied';

  if (isDenied) {
    return (
      <div
        className="mx-5 mb-3.5 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in select-none"
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.16)',
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239, 68, 68, 0.14)' }}
        >
          <BellOff size={14} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-300 text-xs font-bold leading-none mb-0.5">İzin Reddedildi</p>
          <p className="text-[11px] leading-snug text-red-400/75">
            Tarayıcı ayarlarından bildirim iznini açabilirsin.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400/60 hover:text-red-300 transition-colors active:scale-90 flex-shrink-0 p-1"
          aria-label="Kapat"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="mx-5 mb-3.5 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in select-none"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'var(--primary-dim)',
        }}
      >
        <Bell size={15} className="text-indigo-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-app-primary text-xs font-bold leading-none mb-0.5">
          Hatırlatıcıları Aktif Et
        </p>
        <p className="text-app-secondary text-[11px] leading-snug">
          Zamanı gelen görevler için anlık bildirim al.
        </p>
      </div>

      <button
        id="notification-enable-btn"
        onClick={onSubscribe}
        disabled={isLoading}
        className="flex-shrink-0 flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 disabled:opacity-50"
        style={{
          background: 'var(--primary)',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            <span>Açılıyor</span>
          </>
        ) : (
          <span>Etkinleştir</span>
        )}
      </button>

      <button
        onClick={onDismiss}
        className="text-app-muted hover:text-app-secondary transition-colors active:scale-90 flex-shrink-0 -ml-1 p-1"
        aria-label="Kapat"
      >
        <X size={13} />
      </button>
    </div>
  );
}
