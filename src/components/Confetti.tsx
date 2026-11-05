import { useEffect, useRef } from 'react';
import { Flame, Sparkles, X } from 'lucide-react';

type ConfettiProps = {
  streak: number;
  onDismiss: () => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
};

const COLORS = ['#10B981', '#34D399', '#6366F1', '#818CF8', '#F59E0B', '#FBBF24'];

export function Confetti({ streak, onDismiss }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: 65 }, () => ({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * 0.25,
      vx: (Math.random() - 0.5) * 9,
      vy: -(Math.random() * 8 + 4),
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24; // gravity
        p.vx *= 0.99;
        p.rotation += p.vRot;
        p.opacity -= 0.008;

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          active = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          ctx.restore();
        }
      }

      if (active) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      {/* Kutlama Bildirim Kartı */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-scale-in select-none">
        <div
          className="rounded-2xl p-4 border shadow-2xl flex items-center gap-3.5"
          style={{
            background: 'var(--sheet-bg)',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), 0 0 24px rgba(16, 185, 129, 0.15)',
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.30)',
            }}
          >
            <Flame size={20} className="fill-amber-400 text-amber-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" />
              <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                Gün Tamamlandı!
              </p>
            </div>
            <p className="text-app-primary text-sm font-bold mt-0.5">
              🔥 {streak} Günlük Seri Korundu
            </p>
            <p className="text-app-secondary text-xs mt-0.5">
              Bugünün tüm görevlerini başarıyla bitirdin.
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-app-primary transition-colors"
            aria-label="Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

