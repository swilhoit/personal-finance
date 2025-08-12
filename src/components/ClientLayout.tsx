"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}