import type { ReactNode } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { Toaster } from '@/components/ui/sonner'

const { mockUseTheme, sonnerPropsSpy } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
  sonnerPropsSpy: vi.fn(),
}))

vi.mock('next-themes', () => ({
  useTheme: mockUseTheme,
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('sonner', () => ({
  Toaster: (props: any) => {
    sonnerPropsSpy(props)

    return (
      <div
        data-testid="sonner"
        data-theme={props.theme}
        data-class-name={props.className}
        data-position={props.position}
        data-toast-class={props.toastOptions?.classNames?.toast}
      >
        <div data-testid="success-icon">{props.icons?.success}</div>
        <div data-testid="info-icon">{props.icons?.info}</div>
        <div data-testid="warning-icon">{props.icons?.warning}</div>
        <div data-testid="error-icon">{props.icons?.error}</div>
        <div data-testid="loading-icon">{props.icons?.loading}</div>
      </div>
    )
  },
}))

describe('Toaster', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({ theme: 'dark' })
    sonnerPropsSpy.mockClear()
  })

  const expectIconToHaveClass = (testId: string, ...classNames: string[]) => {
    const svg = screen.getByTestId(testId).querySelector('svg')

    expect(svg).not.toBeNull()
    if (!svg) {
      return
    }

    expect(svg).toHaveClass(...classNames)
  }

  it('uses the active theme and forwards props to sonner', () => {
    render(<Toaster position="bottom-right" closeButton />)

    const sonner = screen.getByTestId('sonner')

    expect(sonner).toHaveAttribute('data-theme', 'dark')
    expect(sonner).toHaveAttribute('data-class-name', 'toaster group')
    expect(sonner).toHaveAttribute('data-position', 'bottom-right')
    expect(sonner).toHaveAttribute('data-toast-class', 'cn-toast')
    expect(sonnerPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        closeButton: true,
        style: expect.objectContaining({
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        }),
      })
    )
  })

  it('falls back to the system theme when next-themes has no active theme', () => {
    mockUseTheme.mockReturnValue({ theme: undefined })

    render(<Toaster />)

    expect(screen.getByTestId('sonner')).toHaveAttribute('data-theme', 'system')
  })

  it('provides icons for each supported toast variant', () => {
    render(<Toaster />)

    expectIconToHaveClass('success-icon', 'size-4')
    expectIconToHaveClass('info-icon', 'size-4')
    expectIconToHaveClass('warning-icon', 'size-4')
    expectIconToHaveClass('error-icon', 'size-4')
    expectIconToHaveClass('loading-icon', 'size-4', 'animate-spin')
  })
})