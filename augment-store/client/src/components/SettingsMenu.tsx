import { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Brightness4,
  Brightness7,
  Language as LanguageIcon,
  HelpOutline,
  Check as CheckIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@store/themeStore'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { LANGUAGES, LanguageCode } from '@config/i18n'

const SettingsMenu = () => {
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()
  const { i18n, t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [languageSubmenuAnchor, setLanguageSubmenuAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const languageSubmenuOpen = Boolean(languageSubmenuAnchor)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setLanguageSubmenuAnchor(null)
  }

  const handleThemeToggle = async (event: React.MouseEvent<HTMLLIElement>) => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check if View Transitions API is supported
    if (!document.startViewTransition || prefersReducedMotion) {
      toggleMode()
      handleClose()
      return
    }

    // Get click position for circular reveal animation
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

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

    handleClose()
  }

  const handleLanguageSubmenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageSubmenuAnchor(event.currentTarget)
  }

  const handleLanguageChange = (languageCode: LanguageCode) => {
    i18n.changeLanguage(languageCode)
    handleClose()
  }

  const handleSupportClick = () => {
    navigate('/support/tickets')
    handleClose()
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label={t('nav.settings')}
        aria-controls={open ? 'settings-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        id="settings-button"
      >
        <SettingsIcon />
      </IconButton>
      <Menu
        id="settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'settings-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Theme Toggle */}
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {mode === 'light' ? <Brightness4 fontSize="small" /> : <Brightness7 fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {mode === 'light' ? t('common.darkMode') : t('common.lightMode')}
          </ListItemText>
        </MenuItem>

        <Divider />

        {/* Language Selector */}
        <MenuItem onClick={handleLanguageSubmenuOpen}>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('nav.language')}</ListItemText>
        </MenuItem>

        {/* Support - Only show for authenticated users */}
        {isAuthenticated && (
          <>
            <Divider />
            <MenuItem onClick={handleSupportClick}>
              <ListItemIcon>
                <HelpOutline fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('nav.support')}</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Language Submenu */}
      <Menu
        id="language-submenu"
        anchorEl={languageSubmenuAnchor}
        open={languageSubmenuOpen}
        onClose={() => setLanguageSubmenuAnchor(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('nav.selectLanguage')}
          </Typography>
        </Box>
        <Divider />
        {Object.entries(LANGUAGES).map(([code, { nativeName }]) => (
          <MenuItem
            key={code}
            onClick={() => handleLanguageChange(code as LanguageCode)}
            selected={i18n.resolvedLanguage === code}
          >
            {i18n.resolvedLanguage === code && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText inset={i18n.resolvedLanguage !== code}>{nativeName}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default SettingsMenu
