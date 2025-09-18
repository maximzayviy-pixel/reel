'use client';
import React from 'react';

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };

export function Button({ className = '', children, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`px-4 py-3 rounded-xl bg-blue-600 text-white font-medium active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}
