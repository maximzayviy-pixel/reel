'use client';
import React from 'react';

export const Card: React.FC<React.PropsWithChildren> = ({children}) => (
  <div className="card">{children}</div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({className='', children, ...props}) => (
  <button className={`btn-reel ${className}`} {...props}>{children}</button>
);
