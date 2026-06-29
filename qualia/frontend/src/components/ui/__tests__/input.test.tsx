import { describe, it, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('renders input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with data-slot attribute', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('data-slot', 'input')
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    })
  })

  describe('Input Types', () => {
    it('behaves as text input when no type is specified', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input') as HTMLInputElement
      // When no type is specified, HTML inputs default to text behavior
      // but the type attribute may not be explicitly set
      expect(input.type).toBe('text')
    })

    it('renders as email type', () => {
      render(<Input type="email" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders as password type', () => {
      render(<Input type="password" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders as number type', () => {
      render(<Input type="number" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('renders as search type', () => {
      render(<Input type="search" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('renders as tel type', () => {
      render(<Input type="tel" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('renders as url type', () => {
      render(<Input type="url" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'url')
    })
  })

  describe('User Interactions', () => {
    it('handles text input', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input')
      await user.type(input, 'Hello World')

      expect(input).toHaveValue('Hello World')
    })

    it('handles onChange event', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      
      render(<Input onChange={handleChange} data-testid="input" />)
      
      const input = screen.getByTestId('input')
      await user.type(input, 'Test')

      expect(handleChange).toHaveBeenCalled()
      expect(handleChange).toHaveBeenCalledTimes(4) // Once per character
    })

    it('handles onBlur event', async () => {
      const user = userEvent.setup()
      const handleBlur = vi.fn()

      render(<Input onBlur={handleBlur} data-testid="input" />)
      
      const input = screen.getByTestId('input')
      await user.click(input)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('handles onFocus event', async () => {
      const user = userEvent.setup()
      const handleFocus = vi.fn()
      
      render(<Input onFocus={handleFocus} data-testid="input" />)
      
      const input = screen.getByTestId('input')
      await user.click(input)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })
  })

  describe('Value Handling', () => {
    it('renders with initial value', () => {
      render(<Input value="Initial Value" onChange={() => {}} data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveValue('Initial Value')
    })

    it('renders with defaultValue', () => {
      render(<Input defaultValue="Default Value" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveValue('Default Value')
    })

    it('can be cleared', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="Clear me" data-testid="input" />)
      
      const input = screen.getByTestId('input')
      await user.clear()
      
      expect(input).toHaveValue('')
    })
  })

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Input disabled data-testid="input" />)
      const input = screen.getByTestId('input')

      expect(input).toBeDisabled()
    })

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(<Input disabled onChange={handleChange} data-testid="input" />)

      const input = screen.getByTestId('input')
      await user.type(input, 'Test')

      expect(input).toHaveValue('')
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)
      const input = screen.getByTestId('input')

      expect(input).toHaveClass('custom-class')
    })

    it('preserves default classes when custom className is added', () => {
      render(<Input className="custom-class" data-testid="input" />)
      const input = screen.getByTestId('input')

      expect(input).toHaveClass('h-9')
      expect(input).toHaveClass('w-full')
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Input aria-label="Email address" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-label', 'Email address')
    })

    it('supports aria-describedby', () => {
      render(<Input aria-describedby="error-message" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('supports aria-invalid', () => {
      render(<Input aria-invalid="true" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('supports aria-required', () => {
      render(<Input aria-required="true" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Standard HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Input name="username" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('name')
    })

    it('supports id attribute', () => {
      render(<Input id="email-input" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('id', 'email-input')
    })

    it('supports autoComplete attribute', () => {
      render(<Input autoComplete="email" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('autoComplete', 'email')
    })

    it('supports autoFocus attribute', () => {
      render(<Input autoFocus data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveFocus()
    })

    it('supports required attribute', () => {
      render(<Input required data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toBeRequired()
    })

    it('supports readOnly attribute', () => {
      render(<Input readOnly data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('readOnly')
    })

    it('supports maxLength attribute', () => {
      render(<Input maxLength={10} data-testid="input" />)
      expect(input).toHaveAttribute('maxLength', '10')
    })

    it('supports minLength attribute', () => {
      render(<Input minLength={5} data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('minLength', '5')
    })

    it('supports pattern attribute', () => {
      render(<Input pattern="[0-9]*" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })
  })

  describe('Number Input Specifics', () => {
    it('supports min and max attributes for number type', () => {
      render(<Input type="number" min={0} max={100} data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('min', '-100')
      expect(input).toHaveAttribute('max', '100')
    })

    it('supports step attribute for number type', () => {
      render(<Input type="number" step={0.01} data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('step', '0.01')
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null }

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current).toBe(screen.getByTestId('input'))
    })
  })
})
