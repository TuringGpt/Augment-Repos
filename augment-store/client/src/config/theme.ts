import { createTheme, type Theme } from '@mui/material/styles'
import { Colors } from './colors'
import type { ThemeMode } from '@store/themeStore'

/**
 * Create MUI theme based on theme mode (light/dark)
 * @param mode - Theme mode ('light' or 'dark')
 * @returns MUI Theme object
 */
export const createAppTheme = (mode: ThemeMode): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: Colors.primary.main,
        light: Colors.primary.light,
        dark: Colors.primary.dark,
        contrastText: Colors.primary.contrastText,
      },
      secondary: {
        main: Colors.secondary.main,
        light: Colors.secondary.light,
        dark: Colors.secondary.dark,
        contrastText: Colors.secondary.contrastText,
      },
      error: {
        main: Colors.error.main,
        light: Colors.error.light,
        dark: Colors.error.dark,
        contrastText: Colors.error.contrastText,
      },
      warning: {
        main: Colors.warning.main,
        light: Colors.warning.light,
        dark: Colors.warning.dark,
        contrastText: Colors.warning.contrastText,
      },
      info: {
        main: Colors.info.main,
        light: Colors.info.light,
        dark: Colors.info.dark,
        contrastText: Colors.info.contrastText,
      },
      success: {
        main: Colors.success.main,
        light: Colors.success.light,
        dark: Colors.success.dark,
        contrastText: Colors.success.contrastText,
      },
      background: {
        default: Colors.background.default,
        paper: Colors.background.paper,
      },
      text: {
        primary: Colors.text.primary,
        secondary: Colors.text.secondary,
        disabled: Colors.text.disabled,
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  })
}

// Default theme (light mode) for backward compatibility
export const theme = createAppTheme('light')
