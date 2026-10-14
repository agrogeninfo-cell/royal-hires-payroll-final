import React, { useEffect, useState } from 'react';
import brandLogo from '../../brand-assets/royal-hires-logo-dark.png';

type SplashScreenProps = {
  onFinish: () => void;
};

/** A branded first-launch overlay while the payroll workspace initializes. */
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
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        opacity: isLeaving ? 0 : 1,
        transition: 'opacity 330ms ease-out',
        pointerEvents: isLeaving ? 'none' : 'auto',
      }}
    >
      <img
        src={brandLogo}
        alt="Royal Hires Private Limited — Manpower Payroll Management System"
        draggable={false}
        style={{
          display: 'block',
          width: 'min(78vw, 440px)',
          height: 'auto',
          maxHeight: '42vh',
          objectFit: 'contain',
          objectPosition: 'center center',
          userSelect: 'none',
        }}
      />
    </div>
  );
};
