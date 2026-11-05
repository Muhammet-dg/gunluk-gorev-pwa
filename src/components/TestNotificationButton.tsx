import { useState } from 'react';
import { Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getFCMToken } from '../lib/firebase';

type ToastState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; message: string }
  | { type: 'error';   message: string };

export function TestNotificationButton() {
  const [toast, setToast] = useState<ToastState>({ type: 'idle' });

  const handleTest = async () => {
    setToast({ type: 'loading' });

    try {
      const DEFAULT_SUPABASE_URL = 'https://ooeowjpmoxjzxtwqwvtk.supabase.co';
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_SUPABASE_URL;

      let accessToken: string;
      let userId: string | null = null;

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          const msg = `Oturum bilgisi alınamadı: ${sessionError?.message ?? 'Session null'}`;
          setToast({ type: 'error', message: msg });
          return;
        }

        accessToken = sessionData.session.access_token;
        userId = sessionData.session.user.id;
      } catch (sessionErr) {
        const msg = `Oturum alma hatası: ${sessionErr instanceof Error ? sessionErr.message : JSON.stringify(sessionErr)}`;
        setToast({ type: 'error', message: msg });
        return;
      }

      if (userId) {
        await getFCMToken(userId);
      }

      const fnUrl = `${supabaseUrl}/functions/v1/send-test-notification`;
      let res: Response;
      try {
        res = await fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (fetchErr) {
        const msg = `Ağ/CORS hatası: ${fetchErr instanceof Error ? fetchErr.message : JSON.stringify(fetchErr)}`;
        setToast({ type: 'error', message: msg });
        return;
      }

      let data: {
        success?: boolean;
        sent?: number;
        failed?: number;
        total?: number;
        results?: Array<{ device: string; ok: boolean; status: number; body: string }>;
        error?: string;
        hint?: string;
      };

      try {
        data = await res.json();
      } catch {
        const rawText = await res.text().catch(() => '(gövde okunamadı)');
        setToast({ type: 'error', message: `JSON parse hatası (HTTP ${res.status}): ${rawText.slice(0, 200)}` });
        return;
      }

      if (!res.ok || data.error) {
        const errDetail = data.hint
          ? `${data.error} (İpucu: ${data.hint})`
          : (data.error ?? `HTTP ${res.status}`);
        setToast({ type: 'error', message: errDetail });
        return;
      }

      if (data.sent === 0 && (data.total ?? 0) > 0) {
        const failDetails = data.results
          ?.filter(r => !r.ok)
          .map(r => `${r.device}: HTTP ${r.status} — ${r.body}`)
          .join('\n') ?? '';
        setToast({ type: 'error', message: `${data.total} token var ama gönderilemedi.\n${failDetails}` });
        return;
      }

      const deviceNames = data.results
        ?.filter(r => r.ok)
        .map(r => r.device.slice(0, 30))
        .join(', ') ?? '';

      const successMsg = `Test bildirimi ${data.sent}/${data.total} cihaza gönderildi!${deviceNames ? `\nCihazlar: ${deviceNames}` : ''}`;
      setToast({ type: 'success', message: successMsg });

      setTimeout(() => setToast({ type: 'idle' }), 6000);
    } catch (err) {
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err);
      setToast({ type: 'error', message: `Beklenmeyen hata: ${msg}` });
    }
  };

  const isLoading = toast.type === 'loading';

  return (
    <div className="select-none">
      <button
        id="test-notification-btn"
        onClick={() => void handleTest()}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'var(--primary-dim)',
          border: '1px dashed rgba(99, 102, 241, 0.35)',
          color: 'var(--primary-light)',
        }}
        aria-label="Test bildirimi gönder"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Gönderiliyor...</span>
          </>
        ) : (
          <>
            <Send size={13} />
            <span>Test Bildirimi Gönder</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(99, 102, 241, 0.20)', color: '#A5B4FC' }}
            >
              DEBUG
            </span>
          </>
        )}
      </button>

      {toast.type === 'success' && (
        <div
          className="mt-2.5 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 animate-fade-in"
          style={{
            background: 'rgba(16, 185, 129, 0.10)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
          }}
        >
          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-300 text-xs leading-snug font-medium whitespace-pre-line">
            {toast.message}
          </p>
        </div>
      )}

      {toast.type === 'error' && (
        <div
          className="mt-2.5 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 animate-fade-in"
          style={{
            background: 'rgba(239, 68, 68, 0.10)',
            border: '1px solid rgba(239, 68, 68, 0.22)',
          }}
        >
          <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-red-300 text-xs font-bold mb-0.5">Bildirim Gönderilemedi</p>
            <p className="text-red-400/80 text-[11px] leading-snug break-words whitespace-pre-line">
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
