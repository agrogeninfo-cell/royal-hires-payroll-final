import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface ContainerTextFlipProps {
  words: string[];
  className?: string;
  interval?: number;
}

/**
 * Accessible animated word rotator for short dashboard headlines.
 * Honors reduced-motion preferences and remains a normal inline text element.
 */
export function ContainerTextFlip({
  words,
  className,
  interval = 2400,
}: ContainerTextFlipProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const safeWords = words.filter((word) => word.trim().length > 0);
  const activeWord = safeWords.length > 0 ? safeWords[activeIndex % safeWords.length] : '';

  useEffect(() => {
    setActiveIndex(0);
  }, [safeWords.join('\u0000')]);

  useEffect(() => {
    if (prefersReducedMotion || safeWords.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % safeWords.length);
    }, Math.max(1200, interval));

    return () => window.clearInterval(timer);
  }, [interval, prefersReducedMotion, safeWords.length]);

  if (!activeWord) return null;

  return (
    <span
      className={[
        'relative inline-flex align-baseline whitespace-nowrap rounded-md border border-[#c8ad73]/40 bg-[#f7f1e4] px-2 py-0.5 font-semibold text-[#07583c] shadow-[0_2px_8px_rgba(7,63,45,0.06)] dark:border-[#d5bd86]/40 dark:bg-[#243a2d] dark:text-[#e8d6a8]',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={activeWord}
    >
      <span className="sr-only">{safeWords.join(', ')}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={activeWord}
          layout
          initial={prefersReducedMotion ? false : { opacity: 0, y: 9, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -9, filter: 'blur(4px)' }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
          className="inline-block"
          aria-hidden="true"
        >
          {activeWord}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
