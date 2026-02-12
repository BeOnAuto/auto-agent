import React from 'react';
import { cn } from '@/lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={cn('border border-border rounded bg-muted px-1.5 py-0.5 text-xs font-medium', className)}
    >
      {children}
    </kbd>
  );
}
