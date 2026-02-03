import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'oled' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | 'oled';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'oled'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = () => {
      let effectiveTheme: 'light' | 'dark' | 'oled';
      
      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = theme;
      }

      // Remove all theme classes
      root.classList.remove('light', 'dark', 'oled');
      
      // Add appropriate classes
      if (effectiveTheme === 'oled') {
        root.classList.add('dark', 'oled');
      } else {
        root.classList.add(effectiveTheme);
      }
      
      setResolvedTheme(effectiveTheme);
    };

    updateTheme();
    localStorage.setItem('theme', theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') updateTheme();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}