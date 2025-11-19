# Theme Transition Animation

## Overview

This document describes the modern, smooth theme transition animation implemented for switching between light and dark modes in the Augment Store application.

## Features

### 🎨 Circular Reveal Animation

- **Modern Effect**: Uses a circular reveal animation that emanates from the toggle button click position
- **Animation**: Expands outward from click point (0 → full screen) for both light and dark modes
- **Smooth Transition**: 500ms duration with cubic-bezier easing for a polished feel
- **Browser Support**: Leverages the View Transitions API for modern browsers with graceful fallback

### 🔄 Animation Details

1. **Primary Animation**: Circular reveal effect that expands from the click point
2. **Secondary Effects**:
   - Subtle scale transformation (98% → 102%) for depth
   - Cross-fade between old and new theme states
   - Smooth color transitions for all UI elements

3. **Button Interaction**:
   - Hover: 180° rotation
   - Active: Scale down to 90% with rotation
   - Smooth transitions on all states

## Implementation

### Files Modified/Created

1. **`src/components/ThemeToggle.tsx`** (Modified)
   - Added click position tracking
   - Implemented View Transitions API integration
   - Added circular reveal calculation
   - Enhanced button with hover/active animations
   - Added reduced motion detection

2. **`src/components/ThemeTransitionStyles.tsx`** (New)
   - MUI GlobalStyles component for theme transitions
   - View Transitions API CSS rules using MUI sx props
   - Configured animation keyframes
   - Set up smooth color transitions using MUI theme
   - Optimized performance by limiting transitions to specific elements
   - Accessibility support with reduced motion media query

3. **`src/App.tsx`** (Modified)
   - Added ThemeTransitionStyles component to app root
   - Ensures global styles are applied throughout the app

4. **`src/vite-env.d.ts`** (Modified)
   - Added TypeScript declarations for View Transitions API
   - Ensures type safety for modern browser APIs

### Browser Compatibility

| Feature              | Support                | Fallback                 |
| -------------------- | ---------------------- | ------------------------ |
| View Transitions API | Chrome 111+, Edge 111+ | Instant theme switch     |
| Circular Reveal      | Modern browsers        | Standard fade transition |
| CSS Transitions      | All modern browsers    | ✅ Full support          |

### How It Works

```typescript
// 1. Capture click position
const x = event.clientX
const y = event.clientY

// 2. Calculate reveal radius
const endRadius = Math.hypot(
  Math.max(x, window.innerWidth - x),
  Math.max(y, window.innerHeight - y)
)

// 3. Start view transition
const transition = document.startViewTransition(() => {
  toggleMode() // Update theme state
})

// 4. Apply circular reveal animation
await transition.ready
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
```

## Performance Considerations

### Optimizations Applied

1. **Selective Transitions**: Only specific elements have color transitions to avoid performance issues
2. **Disabled on Interactive Elements**: Input fields and active elements skip transitions
3. **Hardware Acceleration**: Uses transform and opacity for GPU-accelerated animations
4. **Efficient Easing**: cubic-bezier(0.4, 0, 0.2, 1) provides smooth motion with minimal computation

### MUI-Based Styling

All styles are implemented using MUI's `GlobalStyles` component and theme system:

```typescript
// Using MUI theme transitions
'body, div, section, article, aside, header, footer, nav, main': {
  transition: theme.transitions.create(
    ['background-color', 'color', 'border-color', 'box-shadow'],
    {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }
  ),
}

// Disable for interactive elements
'input, textarea, select, *:focus, *:active': {
  transition: 'none !important',
}
```

**Benefits of MUI approach:**

- ✅ Consistent with MUI theme system
- ✅ Uses theme tokens for duration and easing
- ✅ Type-safe with TypeScript
- ✅ No separate CSS files needed
- ✅ Easy to customize via theme

## Inspiration

This implementation is inspired by modern e-commerce platforms and design systems:

- **Shopify**: Smooth theme transitions
- **Vercel**: Circular reveal animations
- **GitHub**: Polished dark mode switching
- **Material Design 3**: View transitions and motion principles

## Testing

### Manual Testing Checklist

- [ ] Click theme toggle on desktop
- [ ] Click theme toggle on mobile
- [ ] Verify animation smoothness
- [ ] Test in Chrome/Edge (View Transitions API)
- [ ] Test in Firefox/Safari (fallback)
- [ ] Verify no performance issues
- [ ] Check accessibility (screen readers)

### Browser Testing

Test the animation in:

- ✅ Chrome 111+ (Full animation support)
- ✅ Edge 111+ (Full animation support)
- ✅ Firefox (Fallback mode)
- ✅ Safari (Fallback mode)

## Future Enhancements

Potential improvements for future iterations:

1. **Customizable Animation Speed**: Allow users to adjust animation duration
2. **Multiple Animation Styles**: Offer different transition effects (slide, fade, etc.)
3. **Sound Effects**: Optional subtle sound on theme switch
4. **Particle Effects**: Add sparkle or particle effects during transition

## Accessibility

The implementation maintains full accessibility:

- ✅ ARIA attributes (`role="switch"`, `aria-checked`)
- ✅ Keyboard navigation support
- ✅ Screen reader announcements
- ✅ Tooltip for visual feedback
- ✅ **Reduced Motion Support**: Respects `prefers-reduced-motion` media query
  - Animations are disabled for users who prefer reduced motion
  - Instant theme switch with no animation
  - Ensures comfortable experience for users with motion sensitivity

## Resources

- [View Transitions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
