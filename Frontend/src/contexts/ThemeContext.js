import React, { createContext, useState, useEffect, useContext } from 'react';
import { lightTheme, darkTheme, getSystemTheme } from '../utils/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSystemTheme, setIsSystemTheme] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedMode = localStorage.getItem('darkMode');
    const savedSystemPref = localStorage.getItem('useSystemTheme');
    
    if (savedSystemPref === 'true') {
      setIsSystemTheme(true);
      setTheme(getSystemTheme());
    } else if (savedMode) {
      setIsDarkMode(savedMode === 'true');
      setTheme(savedMode === 'true' ? darkTheme : lightTheme);
    }

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (isSystemTheme) {
        setTheme(e.matches ? darkTheme : lightTheme);
      }
    };
    mediaQuery.addListener(handleSystemThemeChange);
    
    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }, [isSystemTheme]);

  const toggleTheme = () => {
    if (isSystemTheme) {
      setIsSystemTheme(false);
      localStorage.setItem('useSystemTheme', 'false');
    }
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setTheme(newMode ? darkTheme : lightTheme);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const toggleSystemTheme = () => {
    const newUseSystem = !isSystemTheme;
    setIsSystemTheme(newUseSystem);
    localStorage.setItem('useSystemTheme', newUseSystem.toString());
    if (newUseSystem) {
      setTheme(getSystemTheme());
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDarkMode, 
      isSystemTheme,
      toggleTheme, 
      toggleSystemTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

