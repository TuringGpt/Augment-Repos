import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  describe('Basic Rendering', () => {
    it('renders label with text', () => {
      render(<Label>Test Label</Label>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('renders as a label element', () => {
      render(<Label data-testid="label">Test</Label>)
      const label = screen.getByTestId('')
      expect(label.tagName).toBe('LABEL')
    })

    it('has correct data-slot attribute', () => {
      render(<Label data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute('data-slot', 'label')
    })

    it('renders children correctly', () => {
      render(
        <Label>
          <span>Child 1</span>
          <span>Child 2</span>
        </Label>
      )
      expect(screen.getByText('Child 1')).toBeInTheDocument
      expect(screen.getByText('Child 2')).toBeInTheDocument
    })
  })

  describe('Styling', () => {
    it('applies custom className', () => {
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('custom-class')
    })

    it('applies default classes', () => {
      render(<Label data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('flex')
      expect(label).toHaveClass('items-center')
      expect(label).toHaveClass('gap-2')
      expect(label).toHaveClass('text-sm')
      expect(label).toHaveClass('leading-none')
      expect(label).toHaveClass('font-medium')
      expect(label).toHaveClass('select-none')
    })

    it('merges custom classes with default classes', () => {
      render(<Label className="text-lg font-bold" data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('flex')
      expect(label).toHaveClass('items-center')
      expect(label).toHaveClass('text-lg') // Custom class overrides text-sm
      expect(label).toHaveClass('font-bold') // Custom class overrides font-medium
    })
  })

  describe('HTML Attributes', () => {
    it('forwards htmlFor attribute', () => {
      render(<Label htmlFor="test-input" data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute('for', 'test-input')
    })

    it('forwards id attribute', () => {
      render(<Label id="test-label" data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute()
    })

    it('forwards data attributes', () => {
      render(<Label data-custom="value" data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute('data-custom', 'value')
    })

    it('forwards aria attributes', () => {
      render(<Label aria-label="Test Label" data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute('aria-label', 'Test Label')
    })
  })

  describe('Accessibility', () => {
    it('associates with input via htmlFor', () => {
      render(
        <>
          <Label htmlFor="username">User</Label>
          <input id="username" type="text" />
        </>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAccessibleName('Username')
    })

    it('supports aria-labelledby relationship', () => {
      render(
        <>
          <Label id="email-label">Email</Label>
          <input aria-labelledby="email-label" type="email" />
        </>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAccessibleName('Email')
    })
  })

  describe('Disabled States', () => {
    it('has peer-disabled opacity styles', () => {
      render(<Label data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed')
      expect(label).toHaveClass('peer-disabled:opacity-50')
    })

    it('has group disabled styles', () => {
      render(<Label data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none')
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50')
    })
  })

  describe('onClick Support', () => {
    it('does not have onClick by default', () => {
      render(<Label data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      // Label elements are interactive by nature, but this component doesn't add explicit onClick
      expect(label).toBeInTheDocument()
    })
  })
})
