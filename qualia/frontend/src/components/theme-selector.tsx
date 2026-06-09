import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

/**
 * ThemeSelector component
 * 
 * Allows users to switch between light, dark, and system theme preferences.
 * Uses shadcn/ui dropdown menu and next-themes for theme management.
 * 
 * @example
 * ```tsx
 * <ThemeSelector />
 * ```
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <span className="relative inline-flex size-5">
            <SunIcon className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute inset-0 size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </span>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="gap-2"
        >
          <SunIcon className="size-4" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="gap-2"
        >
          <MoonIcon className="size-4" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="gap-2"
        >
          <MonitorIcon className="size-4" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
