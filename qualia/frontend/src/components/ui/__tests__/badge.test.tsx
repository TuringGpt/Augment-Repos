import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  describe('Basic Rendering', () => {
    it('renders badge with text', () => {
      render(<Badge>Badge Text</Badge>)
      expect(screen.getByText(/badge text/i)).toBeinTheDocument()
    })

    it('renders as a span by default', () => {
      render(<Badge data-testid="badge">Default Badge</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('SPAN')
    })

    it('renders with data-slot attribute', () => {
      render(<Badge data-testid="badge">Test Badge</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-slot', 'badge')
    })
  })

  describe('Variants', () => {
    it('applies default variant by default', () => {
      render(<Badge data-testid="badge">Default</Badge>)
      const badge = screen.getByTestId('badge').get()
      expect(badge).toHaveAttribute('data-variant', 'default')
    })

    it('applies default variant class', () => {
      render(<Badge data-testid="badge">Default Badge</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'default')
    })

    it('applies secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('applies destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('applies outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'outline')
    })

    it('applies ghost variant', () => {
      render(<Badge variant="ghost" data-testid="badge">Ghost</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'ghost')
    })

    it('applies link variant', () => {
      render(<Badge variant="link" data-testid="badge">Link</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'link')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Badge className="custom-class" data-testid="badge">Custom</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-class').toBeTrue()
    })

    it('merges custom className with variant classes', () => {
      render(
        <Badge variant="secondary" className="custom-class" data-testid="badge">
          Custom Secondary
        </Badge>
      )
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-class')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })
  })

  describe('AsChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Badge asChild data-testid="badge">
          <a href="/test">Link Badge</a>
        </Badge>
      )
      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('A')
      expect(badge).toHaveAttribute('href', '/test')
    })

    it('applies badge classes to child element when asChild is true', () => {
      render(
        <Badge asChild variant="secondary" data-testid="badge">
          <button type="button">Button Badge</button>
        </Badge>
      )
      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('BUTTON')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
      expect(badge).toHaveAttribute('data-slot', 'badge')
    })
  })

  describe('Accessibility', () => {
    it('supports aria attributes', () => {
      render(
        <Badge aria-label="Status badge" data-testid="badge">
          Active
        </Badge>
      )
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('aria-label', 'Status badge')
    })

    it('applies aria-invalid styling', () => {
      render(
        <Badge aria-invalid="true" data-testid="badge">
          Invalid
        </Badge>
      )
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Children and Content', () => {
    it('renders with icons', () => {
      expect(screen.getByTestId('badge')).toBeInTheDocument()
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })

    it('renders with complex children', () => {
      render(
        <Badge data-testid="badge">
          <span>Count: </span>
          <strong>42</strong>
        </Badge>
      )
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('Count: 42')
    })
  })
})
