import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove transition class initially
    root.classList.remove('theme-transition');
    
    // Update theme
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Add transition class after a brief delay to allow initial render
    const timer = setTimeout(() => {
      root.classList.add('theme-transition');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setIsDarkMode(theme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setTheme }}>
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
