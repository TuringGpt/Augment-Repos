import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import { theme } from '@config/theme'
import AppRoutes from '@routes/AppRoutes'

function App() {
  return (
    <MantineProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </MantineProvider>
  )
}

export default App
