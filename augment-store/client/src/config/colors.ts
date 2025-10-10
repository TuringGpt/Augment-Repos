/**
 * Centralized Color System
 *
 * This class provides a single source of truth for all colors used in the application.
 * It includes primary, secondary, semantic, neutral, and gradient colors.
 *
 * Usage:
 * import { Colors } from '@config/colors'
 *
 * // In components:
 * sx={{ color: Colors.primary.main }}
 * sx={{ background: Colors.gradient.purpleViolet }}
 */

export class Colors {
  // ============================================
  // PRIMARY COLORS
  // ============================================
  static readonly primary = {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff',
  } as const

  // ============================================
  // SECONDARY COLORS
  // ============================================
  static readonly secondary = {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#fff',
  } as const

  // ============================================
  // SEMANTIC COLORS
  // ============================================
  static readonly error = {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#fff',
  } as const

  static readonly warning = {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#fff',
  } as const

  static readonly info = {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#fff',
  } as const

  static readonly success = {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#fff',
  } as const

  // ============================================
  // NEUTRAL COLORS
  // ============================================
  static readonly neutral = {
    white: '#ffffff',
    black: '#000000',
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#e0e0e0',
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  } as const

  // ============================================
  // BACKGROUND COLORS
  // ============================================
  static readonly background = {
    default: '#ffffff',
    paper: '#ffffff',
    light: '#f5f5f5',
    dark: '#212121',
  } as const

  // ============================================
  // TEXT COLORS
  // ============================================
  static readonly text = {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
    white: '#ffffff',
  } as const

  // ============================================
  // GRADIENT COLORS
  // ============================================
  static readonly gradient = {
    purpleViolet: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blueIndigo: 'linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%)',
    oceanBlue: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    greenTeal: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    orangeRed: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
  } as const

  // ============================================
  // OVERLAY COLORS (with transparency)
  // ============================================
  static readonly overlay = {
    light10: 'rgba(255, 255, 255, 0.1)',
    light15: 'rgba(255, 255, 255, 0.15)',
    light20: 'rgba(255, 255, 255, 0.2)',
    light30: 'rgba(255, 255, 255, 0.3)',
    light50: 'rgba(255, 255, 255, 0.5)',
    dark10: 'rgba(0, 0, 0, 0.1)',
    dark15: 'rgba(0, 0, 0, 0.15)',
    dark20: 'rgba(0, 0, 0, 0.2)',
    dark30: 'rgba(0, 0, 0, 0.3)',
    dark50: 'rgba(0, 0, 0, 0.5)',
    dark87: 'rgba(0, 0, 0, 0.87)',
  } as const

  // ============================================
  // SHADOW COLORS
  // ============================================
  static readonly shadow = {
    light: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
    heavy: '0 10px 40px rgba(0, 0, 0, 0.3)',
    card: '0 2px 8px rgba(0, 0, 0, 0.1)',
  } as const

  // ============================================
  // BORDER COLORS
  // ============================================
  static readonly border = {
    light: 'rgba(0, 0, 0, 0.12)',
    medium: 'rgba(0, 0, 0, 0.23)',
    dark: 'rgba(0, 0, 0, 0.42)',
    white: 'rgba(255, 255, 255, 0.2)',
  } as const

  // ============================================
  // BRAND COLORS (for specific features)
  // ============================================
  static readonly brand = {
    sidebar: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      hover: 'rgba(255, 255, 255, 0.1)',
      subcategoryBg: 'rgba(0, 0, 0, 0.1)',
      subcategoryHover: 'rgba(255, 255, 255, 0.15)',
      divider: 'rgba(255, 255, 255, 0.2)',
    },
    header: {
      background: '#1976d2',
      text: '#ffffff',
    },
    footer: {
      background: '#212121',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
    },
  } as const

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Create a custom rgba color
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @param a - Alpha (0-1)
   */
  static rgba(r: number, g: number, b: number, a: number): string {
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  /**
   * Create a custom hex color with alpha
   * @param hex - Hex color (e.g., '#1976d2' or '1976d2')
   * @param alpha - Alpha (0-1)
   * @throws Error if hex format is invalid
   */
  static hexWithAlpha(hex: string, alpha: number): string {
    // Remove # if present
    const cleanHex = hex.replace('#', '')

    // Validate hex format (must be 6 characters)
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      throw new Error(
        `Invalid hex color format: "${hex}". Expected format: #RRGGBB or RRGGBB (6 hex digits)`
      )
    }

    // Validate alpha range
    if (alpha < 0 || alpha > 1) {
      throw new Error(`Invalid alpha value: ${alpha}. Alpha must be between 0 and 1`)
    }

    // Parse hex to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  /**
   * Create a linear gradient
   * @param angle - Gradient angle in degrees
   * @param color1 - Start color
   * @param color2 - End color
   */
  static linearGradient(angle: number, color1: string, color2: string): string {
    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`
  }

  /**
   * Create a box shadow
   * @param x - Horizontal offset
   * @param y - Vertical offset
   * @param blur - Blur radius
   * @param color - Shadow color (rgba)
   */
  static boxShadow(x: number, y: number, blur: number, color: string): string {
    return `${x}px ${y}px ${blur}px ${color}`
  }
}

// ============================================
// TYPE EXPORTS
// ============================================

export type PrimaryColor = typeof Colors.primary
export type SecondaryColor = typeof Colors.secondary
export type ErrorColor = typeof Colors.error
export type WarningColor = typeof Colors.warning
export type InfoColor = typeof Colors.info
export type SuccessColor = typeof Colors.success
export type NeutralColor = typeof Colors.neutral
export type BackgroundColor = typeof Colors.background
export type TextColor = typeof Colors.text
export type GradientColor = typeof Colors.gradient
export type OverlayColor = typeof Colors.overlay
export type ShadowColor = typeof Colors.shadow
export type BorderColor = typeof Colors.border
export type BrandColor = typeof Colors.brand
