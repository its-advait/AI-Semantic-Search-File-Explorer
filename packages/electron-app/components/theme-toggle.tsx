"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative overflow-hidden glass-button rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
      size="sm"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-gray-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <Sun className="relative z-10 h-4 w-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute z-10 h-4 w-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
