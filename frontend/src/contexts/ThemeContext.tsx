import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialDarkMode(): boolean {
  const savedPreference = localStorage.getItem('darkMode');
  if (savedPreference !== null) {
    return JSON.parse(savedPreference) as boolean;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('theme-transition');

    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const timer = setTimeout(() => {
      root.classList.add('theme-transition');
    }, 100);

    return () => clearTimeout(timer);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((previousValue) => !previousValue);
  };

  const setTheme = (theme: Theme) => {
    setIsDarkMode(theme === 'dark');
  };

  const value = useMemo(
    () => ({ isDarkMode, toggleDarkMode, setTheme }),
    [isDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
