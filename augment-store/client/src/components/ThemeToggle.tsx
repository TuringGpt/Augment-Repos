import { IconButton, Tooltip } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { useThemeStore } from '@store/themeStore'

const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeStore()

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        color="inherit"
        onClick={toggleMode}
        role="switch"
        aria-checked={mode === 'dark'}
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      >
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
