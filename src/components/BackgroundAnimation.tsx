import React from 'react';

/**
 * BackgroundAnimation
 * ─────────────────────────────────────────────────────────────────────────────
 * Kullanıcının sağladığı animasyon.css / animasyon.html tabanlı
 * siber yağmur / renk değiştiren dijital damlacık arka plan efekti.
 *
 * Doğrudan sitenin en arkasına (tam ekrana) oturur ve kesintisiz akar.
 */
export const BackgroundAnimation: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div className="rain-bg-container" />
    </div>
  );
};
