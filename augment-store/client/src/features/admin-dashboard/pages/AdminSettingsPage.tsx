import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
  FormControlLabel,
  Switch,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Brightness4,
  Brightness7,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { useAuthStore } from '@store/authStore'
import { useThemeStore } from '@store/themeStore'
import { useUIStore } from '@store/uiStore'
import { LANGUAGES, LanguageCode, FALLBACK_LANGUAGE } from '@config/i18n'
import {
  TOAST_DURATION_VALUES,
  TOAST_POSITION_OPTIONS,
  NOTIFICATION_SOUND_PRESETS,
  type ToastPosition,
  type NotificationSoundPreset
} from '@constants/index'

/**
 * AdminSettingsPage Component
 * Admin page for managing application settings
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminSettingsPage = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const { mode, toggleMode } = useThemeStore()
  const {
    toastDuration,
    setToastDuration,
    toastPosition,
    setToastPosition,
    notificationSoundsEnabled,
    setNotificationSoundsEnabled,
    notificationSoundPreset,
    setNotificationSoundPreset
  } = useUIStore()

  // Get current language name - normalize to a supported LanguageCode
  const currentLanguage: LanguageCode =
    (i18n.resolvedLanguage && Object.prototype.hasOwnProperty.call(LANGUAGES, i18n.resolvedLanguage))
      ? (i18n.resolvedLanguage as LanguageCode)
      : FALLBACK_LANGUAGE
  const currentLanguageName = LANGUAGES[currentLanguage].nativeName

  // Normalize toast duration to a valid option and persist the normalized value
  // This ensures UI and actual toast behavior cannot diverge
  // IMPORTANT: This useEffect must be placed before any conditional returns
  // to comply with the Rules of Hooks
  useEffect(() => {
    const isValidToastDuration = (TOAST_DURATION_VALUES as readonly number[]).includes(
      toastDuration
    )

    // If the persisted value doesn't match any valid option,
    // write the normalized value back to the store
    if (!isValidToastDuration) {
      const normalizedValue = TOAST_DURATION_VALUES[0]
      setToastDuration(normalizedValue)
    }
  }, [toastDuration, setToastDuration])

  // Wait for persisted state to rehydrate before checking auth state
  // This prevents showing misleading "please login" or "access denied" UI
  // during the brief hydration period on initial page load
  if (!hasHydrated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Check if user is authenticated and is an admin
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('admin.dashboard.pleaseLogin')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          {t('admin.dashboard.goToLogin')}
        </Button>
      </Container>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.dashboard.accessDenied')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('admin.dashboard.goToHome')}
        </Button>
      </Container>
    )
  }

  const handleThemeToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Get toggle position for circular reveal animation
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
      // If the animation fails, just log it - toggleMode() was already called above
      console.debug('View transition animation failed:', error)
    }
  }

  const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
    const value = event.target.value

    // Validate that the value is a supported language code
    if (!Object.prototype.hasOwnProperty.call(LANGUAGES, value)) {
      console.error('Invalid language code:', value)
      toast.error(t('admin.settingsPage.languageChangeFailed'))
      return
    }

    const newLanguage = value as LanguageCode

    try {
      await i18n.changeLanguage(newLanguage)
      // Show success feedback to user
      toast.success(t('admin.settingsPage.languageChanged'))
    } catch (error) {
      console.error('Failed to change language:', error)
      // Show error feedback to user
      toast.error(t('admin.settingsPage.languageChangeFailed'))
    }
  }

  const handleToastDurationChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value)

    // Validate that the value is a valid toast duration option
    const isValid = TOAST_DURATION_VALUES.includes(
      value as (typeof TOAST_DURATION_VALUES)[number]
    )
    if (!isValid) {
      console.error('Invalid toast duration:', value)
      toast.error(t('admin.settingsPage.toastDurationChangeFailed'))
      return
    }

    try {
      setToastDuration(value)
      // Show success feedback to user
      toast.success(t('admin.settingsPage.toastDurationChanged'))
    } catch (error) {
      console.error('Failed to change toast duration:', error)
      // Show error feedback to user
      toast.error(t('admin.settingsPage.toastDurationChangeFailed'))
    }
  }

  const handleToastPositionChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as ToastPosition

    // Validate that the value is a valid toast position option
    const isValid = Object.keys(TOAST_POSITION_OPTIONS).includes(value)
    if (!isValid) {
      console.error('Invalid toast position:', value)
      toast.error(t('admin.settingsPage.toastPositionChangeFailed'))
      return
    }

    try {
      setToastPosition(value)
      // Show success feedback to user
      toast.success(t('admin.settingsPage.toastPositionChanged'))
    } catch (error) {
      console.error('Failed to change toast position:', error)
      // Show error feedback to user
      toast.error(t('admin.settingsPage.toastPositionChangeFailed'))
    }
  }

  const handleNotificationSoundsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newValue = event.target.checked
      setNotificationSoundsEnabled(newValue)
      // Show success feedback to user
      toast.success(
        newValue
          ? t('admin.settingsPage.notificationSoundsEnabledSuccess')
          : t('admin.settingsPage.notificationSoundsDisabledSuccess')
      )
    } catch (error) {
      console.error('Failed to toggle notification sounds:', error)
      // Show error feedback to user
      toast.error(t('admin.settingsPage.notificationSoundsToggleFailed'))
    }
  }

  const handleNotificationSoundPresetChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as NotificationSoundPreset

    // Validate that the value is a valid notification sound preset option
    const isValid = Object.keys(NOTIFICATION_SOUND_PRESETS).includes(value)
    if (!isValid) {
      console.error('Invalid notification sound preset:', value)
      toast.error(t('admin.settingsPage.notificationSoundPresetChangeFailed'))
      return
    }

    try {
      setNotificationSoundPreset(value)
      // Show success feedback to user
      toast.success(t('admin.settingsPage.notificationSoundPresetChanged'))

      // Play a preview of the selected sound
      import('@utils/soundUtils')
        .then(({ playNotificationSound }) => {
          playNotificationSound(value)
        })
        .catch((error) => {
          console.error('Failed to load sound utility:', error)
          // Preview playback failed, but preset was saved successfully
        })
    } catch (error) {
      console.error('Failed to change notification sound preset:', error)
      // Show error feedback to user
      toast.error(t('admin.settingsPage.notificationSoundPresetChangeFailed'))
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.settingsPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.settingsPage.subtitle')}
        </Typography>
      </Box>

      {/* Settings Content */}
      <Paper sx={{ p: 3 }}>
        {/* Appearance Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('admin.settingsPage.appearance')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('admin.settingsPage.appearanceDescription')}
          </Typography>

          {/* Theme Toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {mode === 'light' ? (
                <Brightness7 sx={{ fontSize: 24, color: 'primary.main' }} />
              ) : (
                <Brightness4 sx={{ fontSize: 24, color: 'primary.main' }} />
              )}
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t('admin.settingsPage.themeMode')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode === 'light'
                    ? t('admin.settingsPage.currentlyLight')
                    : t('admin.settingsPage.currentlyDark')}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={handleThemeToggle}
                  color="primary"
                />
              }
              label={mode === 'dark' ? t('common.darkMode') : t('common.lightMode')}
              labelPlacement="start"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Language Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('admin.settingsPage.language')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('admin.settingsPage.languageDescription')}
          </Typography>

          {/* Language Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LanguageIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t('admin.settingsPage.selectLanguage')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.settingsPage.currentLanguage', { language: currentLanguageName })}
                </Typography>
              </Box>
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="language-select-label">
                {t('admin.settingsPage.selectLanguage')}
              </InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                label={t('admin.settingsPage.selectLanguage')}
                value={currentLanguage}
                onChange={handleLanguageChange}
                sx={{
                  '& .MuiSelect-select': {
                    py: 1,
                  },
                }}
              >
                {Object.entries(LANGUAGES).map(([code, { nativeName }]) => (
                  <MenuItem key={code} value={code}>
                    {nativeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Notifications Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('admin.settingsPage.notifications')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('admin.settingsPage.notificationsDescription')}
          </Typography>

          {/* Toast Duration Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NotificationsIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t('admin.settingsPage.toastDuration')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.settingsPage.currentToastDuration', {
                    duration: toastDuration / 1000
                  })}
                </Typography>
              </Box>
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="toast-duration-select-label">
                {t('admin.settingsPage.selectDuration')}
              </InputLabel>
              <Select
                labelId="toast-duration-select-label"
                id="toast-duration-select"
                label={t('admin.settingsPage.selectDuration')}
                value={toastDuration}
                onChange={handleToastDurationChange}
                sx={{
                  '& .MuiSelect-select': {
                    py: 1,
                  },
                }}
              >
                {TOAST_DURATION_VALUES.map((value) => {
                  const seconds = value / 1000
                  // Format duration label with proper localization and pluralization
                  // Use a helper function to safely call i18n.t with count parameter
                  const formatDuration = (count: number): string => {
                    try {
                      return i18n.t('admin.settingsPage.durationSeconds', {
                        count,
                      } as any)
                    } catch {
                      // Fallback if translation fails
                      return `${count} second${count !== 1 ? 's' : ''}`
                    }
                  }
                  return (
                    <MenuItem key={value} value={value}>
                      {formatDuration(seconds)}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Toast Position Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
              mt: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NotificationsIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t('admin.settingsPage.toastPosition')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.settingsPage.currentToastPosition', {
                    position: t(`admin.settingsPage.position.${toastPosition}`)
                  })}
                </Typography>
              </Box>
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="toast-position-select-label">
                {t('admin.settingsPage.selectPosition')}
              </InputLabel>
              <Select
                labelId="toast-position-select-label"
                id="toast-position-select"
                label={t('admin.settingsPage.selectPosition')}
                value={toastPosition}
                onChange={handleToastPositionChange}
                sx={{
                  '& .MuiSelect-select': {
                    py: 1,
                  },
                }}
              >
                {Object.keys(TOAST_POSITION_OPTIONS).map((position) => (
                  <MenuItem key={position} value={position}>
                    {t(`admin.settingsPage.position.${position}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Notification Sounds Toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
              mt: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NotificationsIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t('admin.settingsPage.notificationSounds')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notificationSoundsEnabled
                    ? t('admin.settingsPage.notificationSoundsEnabled')
                    : t('admin.settingsPage.notificationSoundsDisabled')}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSoundsEnabled}
                  onChange={handleNotificationSoundsToggle}
                  color="primary"
                />
              }
              label={notificationSoundsEnabled ? t('admin.settingsPage.notificationSoundsEnabledLabel') : t('admin.settingsPage.notificationSoundsDisabledLabel')}
              labelPlacement="start"
            />
          </Box>

          {/* Notification Sound Preset Selection - Only shown when sounds are enabled */}
          {notificationSoundsEnabled && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {t('admin.settingsPage.soundPreset')}
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="notification-sound-preset-label">
                  {t('admin.settingsPage.selectSound')}
                </InputLabel>
                <Select
                  labelId="notification-sound-preset-label"
                  id="notification-sound-preset-select"
                  value={notificationSoundPreset}
                  label={t('admin.settingsPage.selectSound')}
                  onChange={handleNotificationSoundPresetChange}
                >
                  {Object.keys(NOTIFICATION_SOUND_PRESETS).map((key) => (
                    <MenuItem key={key} value={key}>
                      {t(`admin.settingsPage.soundPresets.${key}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Future Settings Placeholder */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('admin.settingsPage.moreSettings')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.settingsPage.moreSettingsDescription')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default AdminSettingsPage

