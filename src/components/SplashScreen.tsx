import React, { useEffect, useState } from 'react';
import brandEmblem from '../../brand-assets/royal-hires-emblem-white.png';

type SplashScreenProps = {
  onFinish: () => void;
};

/** Branded first-launch overlay using the emblem on a solid brand background. */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIsLeaving(true), 2200);
    const finishTimer = window.setTimeout(onFinish, 2530);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      role="status"
      aria-label="Loading Royal Hires manpower payroll management system"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        overflow: 'hidden',
        padding: 24,
        background: 'linear-gradient(145deg, #043a2b 0%, #064b37 62%, #087a51 100%)',
        opacity: isLeaving ? 0 : 1,
        transition: 'opacity 330ms ease-out',
        pointerEvents: isLeaving ? 'none' : 'auto',
      }}
    >
      <img
        src={brandEmblem}
        alt=""
        draggable={false}
        style={{
          display: 'block',
          width: 'min(30vw, 132px)',
          height: 'auto',
          maxHeight: '22vh',
          objectFit: 'contain',
          userSelect: 'none',
        }}
      />
      <div style={{ textAlign: 'center', color: '#ffffff', lineHeight: 1.2 }}>
        <div style={{ fontSize: 'clamp(20px, 5vw, 29px)', fontWeight: 800, letterSpacing: '.09em' }}>
          ROYAL HIRES
        </div>
        <div style={{ marginTop: 7, fontSize: 11, fontWeight: 600, letterSpacing: '.28em', color: '#c7e6d5' }}>
          PRIVATE LIMITED
        </div>
        <div style={{ marginTop: 16, fontSize: 12, letterSpacing: '.04em', color: '#e4f3eb' }}>
          PAYROLL MANAGEMENT
        </div>
      </div>
    </div>
  );
};
