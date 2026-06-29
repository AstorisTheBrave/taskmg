import { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  const storedTheme = window.localStorage.getItem("theme");
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    if (theme === "dark") root.classList.add("dark");
    root.style.colorScheme = theme === "light" ? "light" : "dark";
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  function toggle() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
