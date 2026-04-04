import { useEffect } from 'react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.75rem',
      right: '1.75rem',
      background: 'var(--accent)',
      color: 'var(--accent-fg)',
      padding: '.65rem 1.1rem',
      borderRadius: 'var(--r-sm)',
      fontSize: '.76rem',
      fontWeight: 700,
      letterSpacing: '.04em',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 999,
      animation: 'fadeUp .22s ease',
    }}>
      {message}
    </div>
  );
}
