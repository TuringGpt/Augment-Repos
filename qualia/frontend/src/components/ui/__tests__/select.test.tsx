import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

describe('Select', () => {
  describe('Basic Rendering', () => {
    it('renders select trigger button', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Choose option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Choose option')).toBeInTheDocument()
    })

    it('does not render content when closed', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })

    it('renders with data-slot attribute on select', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger" aria-label="Select">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-slot', 'select-trigger')
    })
  })

  describe('SelectTrigger', () => {
    it('renders with default size', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger" aria-label="Select">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-size', 'default')
    })

    it('renders with small size', () => {
      render(
        <Select>
          <SelectTrigger size="sm" data-testid="trigger" aria-label="Select">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-size', 'sm')
    })

    it('applies custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-class" aria-label="Select">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('custom-class')
    })

    it('can be disabled', () => {
      render(
        <Select disabled>
          <SelectTrigger aria-label="Select">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })
  })

  describe('User Interactions', () => {
    it('opens select menu when trigger is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('handles option selection', async () => {
      const user = userEvent.setup()
      const handleValueChange = vi.fn()

      render(
        <Select onValueChange={handleValueChange}>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Option 2'))

      expect(handleValueChange).toHaveBeenCalledWith('option2')
    })

    it('does not open when disabled', async () => {
      const user = userEvent.setup()

      render(
        <Select disabled>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })

    it('can be controlled with value prop', async () => {
      const user = userEvent.setup()
      render(
        <Select value="option1">
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        // Option 1 should appear multiple times (in value and in list)
        const options = screen.getAllByText('Option 1')
        expect(options.length).toBeGreaterThan(0)
      })

      // Verify Option 1 is in checked state
      const option1 = screen.getByRole('option', { name: 'Option 1' })
      expect(option1).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('SelectItem', () => {
    it('renders select items with correct data-slot', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" data-testid="item1">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const item = screen.getByTestId('item1')
        expect(item).toHaveAttribute('data-slot', 'select-item')
      })
    })

    it('renders disabled select items', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2" disabled>
              Option 2 (Disabled)
            </SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Option 2 (Disabled)')).toBeInTheDocument()
      })
    })

    it('applies custom className to select items', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item-class">
              Custom Item
            </SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const item = screen.getByText('Custom Item')
        expect(item.parentElement).toHaveClass('custom-item-class')
      })
    })
  })

  describe('SelectGroup', () => {
    it('renders select group with label', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group Label</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Group Label')).toBeInTheDocument()
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('renders with data-slot attribute', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup data-testid="group">
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const group = screen.getByTestId('group')
        expect(group).toHaveAttribute('data-slot', 'select-group')
      })
    })
  })

  describe('SelectLabel', () => {
    it('renders select label', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Category</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument()
      })
    })

    it('renders with data-slot attribute', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel data-testid="label">Label</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const label = screen.getByTestId('label')
        expect(label).toHaveAttribute('data-slot', 'select-label')
      })
    })

    it('applies custom className', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="custom-label-class">Label</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const label = screen.getByText('Label')
        expect(label).toHaveClass('custom-label-class')
      })
    })
  })

  describe('SelectSeparator', () => {
    it('renders separator between items', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator data-testid="separator" />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const separator = screen.getByTestId('separator')
        expect(separator).toBeInTheDocument()
        expect(separator).toHaveAttribute('data-slot', 'select-separator')
      })
    })

    it('applies custom className', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator className="custom-separator" data-testid="separator" />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const separator = screen.getByTestId('separator')
        expect(separator).toHaveClass('custom-separator')
      })
    })
  })

  describe('SelectContent', () => {
    it('renders with data-slot attribute', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-testid="content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toHaveAttribute('data-slot', 'select-content')
      })
    })

    it('renders with default position', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-testid="content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toHaveAttribute('data-align-trigger', 'true')
      })
    })

    it('renders with popper position', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" data-testid="content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toHaveAttribute('data-align-trigger', 'false')
      })
    })

    it('applies custom className', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="custom-content-class" data-testid="content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toHaveClass('custom-content-class')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select an option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('supports aria-label', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Choose your country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
          </SelectContent>
        </Select>
      )

      const select = screen.getByRole('combobox', { name: /choose your country/i })
      expect(select).toBeInTheDocument()
    })

    it('supports aria-invalid', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select option" aria-invalid>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Select Composition', () => {
    it('renders a complete select with all components', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger aria-label="Select fruit">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="potato">Potato</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Select a fruit')).toBeInTheDocument()

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Fruits')).toBeInTheDocument()
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.getByText('Banana')).toBeInTheDocument()
        expect(screen.getByText('Vegetables')).toBeInTheDocument()
        expect(screen.getByText('Carrot')).toBeInTheDocument()
        expect(screen.getByText('Potato')).toBeInTheDocument()
      })
    })
  })

  describe('Default Value', () => {
    it('renders with defaultValue', () => {
      render(
        <Select defaultValue="option2">
          <SelectTrigger aria-label="Select option">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      // The trigger should exist
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})
