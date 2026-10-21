import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface RoyalHoverCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/**
 * Accessible, reusable card button for Royal Pay dashboards.
 * Keeps native button semantics so keyboard, screen-reader, and touch users
 * retain the same interaction as pointer users.
 */
export function RoyalHoverCard({
  children,
  className = '',
  type = 'button',
  ...buttonProps
}: RoyalHoverCardProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={`rh-hover-card ${className}`.trim()}
    >
      {children}
    </button>
  );
}
