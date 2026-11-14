import type { ReactNode } from 'react';

interface TooltipProps {
  title: string;
  children: ReactNode;
}

export function Tooltip({ title, children }: TooltipProps) {
  return (
    <span className="tooltip-wrap" title={title}>
      {children}
    </span>
  );
}
