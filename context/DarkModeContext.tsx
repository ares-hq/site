import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

type DarkModeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  /** true while we resolve the persisted / system preference on first paint */
  isLoading: boolean;
  /** whether the current value comes from an explicit user choice (vs. system) */
  isExplicit: boolean;
  /** clear the saved choice and fall back to the system setting */
  resetToSystem: () => void;
};

const STORAGE_KEY = 'ares:color-scheme';

const DarkModeContext = createContext<DarkModeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
  isLoading: true,
  isExplicit: false,
  resetToSystem: () => {},
});

function readStored(): 'dark' | 'light' | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

function writeStored(value: 'dark' | 'light' | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export const DarkModeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();

  // Resolve the stored choice synchronously so there is no post-mount flash on web.
  const initialStored = readStored();
  const [isExplicit, setIsExplicit] = useState(initialStored !== null);
  const [isDarkMode, setDark] = useState(initialStored ? initialStored === 'dark' : false);
  const [isLoading, setIsLoading] = useState(initialStored === null);

  // Follow the system setting until the user makes an explicit choice.
  useEffect(() => {
    if (isExplicit) return;
    if (systemScheme != null) {
      setDark(systemScheme === 'dark');
      setIsLoading(false);
    }
  }, [systemScheme, isExplicit]);

  const setIsDarkMode = useCallback((value: boolean) => {
    setDark(value);
    setIsExplicit(true);
    setIsLoading(false);
    writeStored(value ? 'dark' : 'light');
  }, []);

  const resetToSystem = useCallback(() => {
    setIsExplicit(false);
    writeStored(null);
    setDark((systemScheme ?? 'light') === 'dark');
  }, [systemScheme]);

  return (
    <DarkModeContext.Provider
      value={{ isDarkMode, setIsDarkMode, isLoading, isExplicit, resetToSystem }}
    >
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);
