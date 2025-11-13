import { useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from '@config/theme'
import { useThemeStore } from '@store/themeStore'
import AppRoutes from '@routes/AppRoutes'

function App() {
  const mode = useThemeStore((state) => state.mode)

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
