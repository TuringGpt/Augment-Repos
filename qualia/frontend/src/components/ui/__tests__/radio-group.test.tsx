import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

describe('RadioGroup', () => {
  describe('Basic Rendering', () => {
    it('renders the group and items with slot attributes', () => {
      render(
        <RadioGroup data-testid="group" defaultValue="starter" aria-label="Plan">
          <RadioGroupItem value="starter" aria-label="Starter" data-testid="starter" />
          <RadioGroupItem value="pro" aria-label="Pro" data-testid="pro" />
        </RadioGroup>
      )

      expect(screen.getByTestId('group')).toHaveAttribute('data-slot', 'radio-group')
      expect(screen.getByTestId('starter')).toHaveAttribute('data-slot', 'radio-group-item')
      expect(screen.getByTestId('pro')).toHaveAttribute('data-slot', 'radio-group-item')
    })

    it('applies default classes and merges custom className values', () => {
      render(
        <RadioGroup data-testid="group" className="custom-group" aria-label="Plan">
          <RadioGroupItem value="starter" aria-label="Starter" className="custom-item" data-testid="starter" />
        </RadioGroup>
      )

      expect(screen.getByTestId('group')).toHaveClass('grid', 'w-full', 'gap-3', 'custom-group')
      expect(screen.getByTestId('starter')).toHaveClass('size-4', 'rounded-full', 'custom-item')
    })
  })

  describe('User Interactions', () => {
    it('respects the default value and updates the checked radio when a new option is clicked', async () => {
      const user = userEvent.setup()

      render(
        <RadioGroup defaultValue="starter" aria-label="Plan">
          <RadioGroupItem value="starter" aria-label="Starter" />
          <RadioGroupItem value="pro" aria-label="Pro" />
        </RadioGroup>
      )

      const starter = screen.getByRole('radio', { name: /starter/i })
      const pro = screen.getByRole('radio', { name: /pro/i })

      expect(starter).toBeChecked()
      expect(pro).not.toBeChecked()

      await user.click(pro)

      expect(starter).not.toBeChecked()
      expect(pro).toBeChecked()
    })

    it('calls onValueChange when the selected option changes', async () => {
      const user = userEvent.setup()
      const handleValueChange = vi.fn()

      render(
        <RadioGroup defaultValue="starter" onValueChange={handleValueChange} aria-label="Plan">
          <RadioGroupItem value="starter" aria-label="Starter" />
          <RadioGroupItem value="pro" aria-label="Pro" />
        </RadioGroup>
      )

      await user.click(screen.getByRole('radio', { name: /pro/i }))

      expect(handleValueChange).toHaveBeenCalledTimes(1)
      expect(handleValueChange).toHaveBeenCalledWith('pro')
    })

    it('does not select disabled items', async () => {
      const user = userEvent.setup()
      const handleValueChange = vi.fn()

      render(
        <RadioGroup defaultValue="starter" onValueChange={handleValueChange} aria-label="Plan">
          <RadioGroupItem value="starter" aria-label="Starter" />
          <RadioGroupItem value="enterprise" aria-label="Enterprise" disabled />
        </RadioGroup>
      )

      const starter = screen.getByRole('radio', { name: /starter/i })
      const enterprise = screen.getByRole('radio', { name: /enterprise/i })

      await user.click(enterprise)

      expect(starter).toBeChecked()
      expect(enterprise).not.toBeChecked()
      expect(handleValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('supports an accessible name via aria-labelledby', () => {
      render(
        <>
          <span id="plan-label">Subscription plan</span>
          <RadioGroup aria-labelledby="plan-label" defaultValue="starter">
            <RadioGroupItem value="starter" aria-label="Starter" />
          </RadioGroup>
        </>
      )

      expect(screen.getByRole('radiogroup', { name: /subscription plan/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /starter/i })).toBeInTheDocument()
    })
  })
})
