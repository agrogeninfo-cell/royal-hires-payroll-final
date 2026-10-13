import React, { useEffect, useState } from 'react';

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
        backgroundColor: '#F7FAF8',
        opacity: isLeaving ? 0 : 1,
        transition: 'opacity 330ms ease-out',
        pointerEvents: isLeaving ? 'none' : 'auto',
      }}
    >
      <img
        src="/royal-hires-splash.png"
        alt="Royal Hires Private Limited — Manpower Payroll Management System"
        draggable={false}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          userSelect: 'none',
        }}
      />
    </div>
  );
};
