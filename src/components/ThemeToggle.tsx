"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    
    // Apply theme to document
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Prevent flash of incorrect icon
  if (!mounted) {
    return (
      <button
        className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 dark:from-cyan-600/20 dark:to-teal-600/20 border-2 border-cyan-400 dark:border-cyan-600"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 dark:from-cyan-600/20 dark:to-teal-600/20 border-2 border-cyan-400 dark:border-cyan-600 hover:scale-110 transition-all overflow-hidden"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-400 dark:from-cyan-600 dark:to-teal-600 opacity-0 group-hover:opacity-30 transition-opacity"></div>
      
      {/* Icon container with rotation animation */}
      <div className="relative w-full h-full flex items-center justify-center">
        {theme === "light" ? (
          // Moon icon for switching to dark mode
          <div className="transform transition-transform group-hover:rotate-12">
            <span className="text-2xl">🌙</span>
          </div>
        ) : (
          // Sun icon for switching to light mode
          <div className="transform transition-transform group-hover:rotate-45">
            <span className="text-2xl">☀️</span>
          </div>
        )}
      </div>
      
      {/* Pulse effect on hover */}
      <div className="absolute inset-0 rounded-xl group-hover:animate-ping bg-cyan-400 dark:bg-cyan-600 opacity-0 group-hover:opacity-20"></div>
    </button>
  );
}