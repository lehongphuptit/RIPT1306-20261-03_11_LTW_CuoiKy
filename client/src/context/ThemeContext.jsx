import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const storageKey = 'wanderly-theme';

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, dark ? 'dark' : 'light');
    } catch {
      // The theme still works for this session if storage is unavailable.
    }
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, changeTheme: setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
