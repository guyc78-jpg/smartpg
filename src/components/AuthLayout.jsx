import React from "react";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { dark, toggle } = useTheme();
  return (
    <main
      id="route-main-content"
      className="relative min-h-screen flex items-center justify-center bg-background px-4"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
        className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top,0px))] h-10 w-10 rounded-full liquid-chip flex items-center justify-center text-muted-foreground"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </main>
  );
}
