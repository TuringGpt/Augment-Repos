import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
  describe('Basic Rendering', () => {
    it('renders checkbox element', () => {
      render(<Checkbox aria-label="Accept terms" />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('renders with data-slot attribute', () => {
      render(<Checkbox aria-label="Accept terms" data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveAttribute('data-slot', 'checkbox')
    })

    it('applies custom className', () => {
      render(<Checkbox className="custom-class" aria-label="Custom checkbox" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('custom-class')
    })
  })

  describe('States', () => {
    it('starts unchecked by default', () => {
      render(<Checkbox aria-label="Default checkbox" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('can be checked via defaultChecked prop', () => {
      render(<Checkbox defaultChecked aria-label="Default checked" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('can be controlled with checked prop', () => {
      const { rerender } = render(<Checkbox checked={false} aria-label="Controlled" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      rerender(<Checkbox checked={true} aria-label="Controlled" />)
      expect(checkbox).toBeChecked()
    })

    it('can be disabled', () => {
      render(<Checkbox disabled aria-label="Disabled checkbox" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })

    it('applies aria-invalid attribute', () => {
      render(<Checkbox aria-label="Invalid checkbox" aria-invalid />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('User Interactions', () => {
    it('toggles checked state when clicked', async () => {
      const user = userEvent.setup()
      render(<Checkbox aria-label="Toggle checkbox" />)
      const checkbox = screen.getByRole('checkbox')

      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('calls onCheckedChange when state changes', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Checkbox onCheckedChange={handleChange} aria-label="Change handler" />)
      const checkbox = screen.getByRole('checkbox')

      await user.click(checkbox)
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(true)

      await user.click(checkbox)
      expect(handleChange).toHaveBeenCalledTimes(2)
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Checkbox disabled onCheckedChange={handleChange} aria-label="Disabled" />)
      const checkbox = screen.getByRole('checkbox')

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('can be toggled with keyboard (Space)', async () => {
      const user = userEvent.setup()
      render(<Checkbox aria-label="Keyboard checkbox" />)
      const checkbox = screen.getByRole('checkbox')

      checkbox.focus()
      expect(checkbox).toHaveFocus()

      await user.keyboard(' ')
      expect(checkbox).toBeChecked()

      await user.keyboard(' ')
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(<Checkbox aria-label="ARIA checkbox" />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('supports aria-label', () => {
      render(<Checkbox aria-label="Accept terms and conditions" />)
      const checkbox = screen.getByRole('checkbox', { name: /accept terms and conditions/i })
      expect(checkbox).toBeInTheDocument()
    })

    it('supports aria-labelledby', () => {
      render(
        <>
          <span id="checkbox-label">Newsletter subscription</span>
          <Checkbox aria-labelledby="checkbox-label" />
        </>
      )
      const checkbox = screen.getByRole('checkbox', { name: /newsletter subscription/i })
      expect(checkbox).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      render(
        <>
          <Checkbox aria-label="Subscribe" aria-describedby="checkbox-description" />
          <span id="checkbox-description">Receive weekly updates</span>
        </>
      )
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-describedby', 'checkbox-description')
    })
  })
})
