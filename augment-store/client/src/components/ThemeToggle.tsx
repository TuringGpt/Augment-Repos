import { IconButton, Tooltip } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { useThemeStore } from '@store/themeStore'

const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeStore()

  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check if View Transitions API is supported
    if (!document.startViewTransition || prefersReducedMotion) {
      toggleMode()
      return
    }

    // Get click position for circular reveal animation
    const x = event.clientX
    const y = event.clientY

    // Calculate the maximum radius needed to cover the entire screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Start the view transition with circular reveal
    const transition = document.startViewTransition(() => {
      toggleMode()
    })

    // Apply circular reveal animation
    try {
      await transition.ready

      // Animate with clip-path for circular reveal effect
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    } catch (error) {
      // Fallback if animation fails
      console.debug('View transition animation failed:', error)
    }
  }

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        color="inherit"
        onClick={handleToggle}
        role="switch"
        aria-checked={mode === 'dark'}
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        sx={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'rotate(180deg)',
          },
          '&:active': {
            transform: 'scale(0.9) rotate(180deg)',
          },
        }}
      >
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
