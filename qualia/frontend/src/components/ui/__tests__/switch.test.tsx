import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Switch } from '@/components/ui/switch'

describe('Switch', () => {
  describe('Basic Rendering', () => {
    it('renders switch element', () => {
      render(<Switch aria-label="Toggle feature" />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('renders with data-slot attribute', () => {
      render(<Switch aria-label="Toggle feature" data-testid="switch" />)
      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toHaveAttribute('data-slot', 'switch')
    })

    it('renders thumb with data-slot attribute', () => {
      render(<Switch aria-label="Toggle feature" />)
      const thumb = document.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Switch className="custom-class" aria-label="Custom switch" />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toHaveClass('custom-class')
    })
  })

  describe('Size Variants', () => {
    it('defaults to default size', () => {
      render(<Switch aria-label="Default size switch" data-testid="switch" />)
      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toHaveAttribute('data-size', 'default')
    })

    it('applies sm size', () => {
      render(<Switch size="sm" aria-label="Small switch" data-testid="switch" />)
      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toHaveAttribute('data-size', 'sm')
    })

    it('applies default size explicitly', () => {
      render(<Switch size="default" aria-label="Default switch" data-testid="switch" />)
      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toHaveAttribute('data-size', 'default')
    })
  })

  describe('States', () => {
    it('starts unchecked by default', () => {
      render(<Switch aria-label="Default switch" />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).not.toBeChecked()
    })

    it('can be checked via defaultChecked prop', () => {
      render(<Switch defaultChecked aria-label="Default checked switch" />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toBeChecked()
    })

    it('can be controlled with checked prop', () => {
      const { rerender } = render(<Switch checked={false} aria-label="Controlled switch" onCheckedChange={() => {}} />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).not.toBeChecked()

      rerender(<Switch checked={true} aria-label="Controlled switch" onCheckedChange={() => {}} />)
      expect(switchEl).toBeChecked()
    })

    it('can be disabled', () => {
      render(<Switch disabled aria-label="Disabled switch" />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toBeDisabled()
    })

    it('applies aria-invalid attribute', () => {
      render(<Switch aria-label="Invalid switch" aria-invalid />)
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('User Interactions', () => {
    it('toggles checked state when clicked', async () => {
      const user = userEvent.setup()
      render(<Switch aria-label="Toggle switch" />)
      const switchEl = screen.getByRole('switch')

      expect(switchEl).not.toBeChecked()

      await user.click(switchEl)
      expect(switchEl).toBeChecked()

      await user.click(switchEl)
      expect(switchEl).not.toBeChecked()
    })

    it('calls onCheckedChange when state changes', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Switch onCheckedChange={handleChange} aria-label="Change handler switch" />)
      const switchEl = screen.getByRole('switch')

      await user.click(switchEl)
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(true)

      await user.click(switchEl)
      expect(handleChange).toHaveBeenCalledTimes(2)
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Switch disabled onCheckedChange={handleChange} aria-label="Disabled switch" />)
      const switchEl = screen.getByRole('switch')

      await user.click(switchEl)
      expect(switchEl).not.toBeChecked()
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('can be toggled with keyboard (Space)', async () => {
      const user = userEvent.setup()
      render(<Switch aria-label="Keyboard switch" />)
      const switchEl = screen.getByRole('switch')

      switchEl.focus()
      expect(switchEl).toHaveFocus()

      await user.keyboard(' ')
      expect(switchEl).toBeChecked()

      await user.keyboard(' ')
      expect(switchEl).not.toBeChecked()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(<Switch aria-label="ARIA switch" />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('supports aria-label', () => {
      render(<Switch aria-label="Enable notifications" />)
      const switchEl = screen.getByRole('switch', { name: /enable notifications/i })
      expect(switchEl).toBeInTheDocument()
    })

    it('supports aria-labelledby', () => {
      render(
        <>
          <span id="switch-label">Dark mode</span>
          <Switch aria-labelledby="switch-label" />
        </>
      )
      const switchEl = screen.getByRole('switch', { name: /dark mode/i })
      expect(switchEl).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      render(
        <>
          <Switch aria-label="Notifications" aria-describedby="switch-description" />
          <span id="switch-description">Receive push notifications</span>
        </>
      )
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toHaveAttribute('aria-describedby', 'switch-description')
    })
  })
})
