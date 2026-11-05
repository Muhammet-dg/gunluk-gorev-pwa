import React from 'react';

/**
 * BackgroundAnimation
 * ─────────────────────────────────────────────────────────────────────────────
 * Kullanıcının sağladığı animasyon.css / animasyon.html tabanlı
 * siber yağmur / süzülen ışıltı parçacık efekti.
 *
 * - Sayfanın arka planında derinlik hissi katar.
 * - İçerik okunabilirliğini korumak için uygun opaklık ve maske ile dengelenmiştir.
 */
export const BackgroundAnimation: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700"
      aria-hidden="true"
    >
      {/* Süzülen neon dijital yağmur arka planı */}
      <div className="rain-bg-container" />

      {/* Ekran merkezinde ekstra derinlik ve okunabilirlik için vignette maskesi */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, var(--bg) 95%)',
        }}
      />
    </div>
  );
};

