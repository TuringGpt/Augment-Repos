import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProp } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
