import { GlobalStyles } from '@mui/material'

/**
 * ThemeTransitionStyles Component
 * 
 * Provides global styles for smooth theme transitions using MUI's GlobalStyles.
 * This includes View Transitions API support and accessibility features.
 */
const ThemeTransitionStyles = () => {
  return (
    <GlobalStyles
      styles={(theme) => ({
        // View Transitions API - Smooth cross-fade with scale
        '::view-transition-old(root), ::view-transition-new(root)': {
          animationDuration: '500ms',
          animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          mixBlendMode: 'normal',
        },

        // Old view fades out with slight scale down
        '::view-transition-old(root)': {
          animationName: 'theme-fade-out',
        },

        // New view fades in with slight scale up
        '::view-transition-new(root)': {
          animationName: 'theme-fade-in',
        },

        // Smooth image transition during theme change
        '::view-transition-image-pair(root)': {
          isolation: 'isolate',
        },

        // Keyframe animations
        '@keyframes theme-fade-out': {
          from: {
            opacity: 1,
            transform: 'scale(1)',
          },
          to: {
            opacity: 0,
            transform: 'scale(0.98)',
          },
        },

        '@keyframes theme-fade-in': {
          from: {
            opacity: 0,
            transform: 'scale(1.02)',
          },
          to: {
            opacity: 1,
            transform: 'scale(1)',
          },
        },

        // Smooth color transitions for all elements during theme change
        'body, div, section, article, aside, header, footer, nav, main': {
          transition: theme.transitions.create(
            ['background-color', 'color', 'border-color', 'box-shadow'],
            {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }
          ),
        },

        // Buttons and links (not when active/focused)
        'button:not(:active):not(:focus), a:not(:active):not(:focus)': {
          transition: theme.transitions.create(
            ['background-color', 'color', 'border-color', 'box-shadow'],
            {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }
          ),
        },

        // Disable transitions for interactive elements to maintain responsiveness
        'input, textarea, select, *:focus, *:active': {
          transition: 'none !important',
        },

        // Respect user's motion preferences for accessibility
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
          '::view-transition-old(root), ::view-transition-new(root)': {
            animation: 'none !important',
          },
        },
      })}
    />
  )
}

export default ThemeTransitionStyles

