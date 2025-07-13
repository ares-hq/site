import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type DarkModeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  isLoading: boolean;
};

const DarkModeContext = createContext<DarkModeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
  isLoading: true,
});

export const DarkModeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false); // Start with false to avoid flash
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for system scheme to be determined
    if (systemScheme !== null) {
      setIsDarkMode(systemScheme === 'dark');
      setIsLoading(false);
    }
  }, [systemScheme]);

  return (
    <DarkModeContext.Provider value={{ 
      isDarkMode, 
      setIsDarkMode, 
      isLoading 
    }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);