import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'

describe('DropdownMenu', () => {
  describe('Basic Rendering', () => {
    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('does not render content when closed', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
    })

    it('renders with data-slot attributes', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        </DropdownMenu>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger')
    })
  })

  describe('User Interactions', () => {
    it('opens menu when trigger is clicked', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button', { name: /open menu/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
      })
    })

    it('handles menu item click', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClick}>Click Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button', { name: /open menu/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Click Me')).toBeInTheDocument()
      })

      const menuItem = screen.getByText('Click Me')
      await user.click(menuItem)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('DropdownMenuItem', () => {
    it('renders with default variant', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem data-testid="menu-item">Default Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toHaveAttribute('data-variant', 'default')
      })
    })

    it('renders with destructive variant', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive" data-testid="menu-item">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toHaveAttribute('data-variant', 'destructive')
      })
    })

    it('renders with inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset data-testid="menu-item">
              Inset Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toHaveAttribute('data-inset', 'true')
      })
    })

    it('applies custom className', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-class" data-testid="menu-item">
              Custom Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toHaveClass('custom-class')
      })
    })
  })

  describe('DropdownMenuCheckboxItem', () => {
    it('renders checkbox item', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Checkbox Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Checkbox Item')).toBeInTheDocument()
      })
    })

    it('handles checked state', async () => {
      const user = userEvent.setup()
      const handleCheckedChange = vi.fn()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={handleCheckedChange}
            >
              Toggle Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Toggle Item')).toBeInTheDocument()
      })

      const checkboxItem = screen.getByText('Toggle Item')
      await user.click(checkboxItem)

      expect(handleCheckedChange).toHaveBeenCalled()
    })

    it('renders with inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem inset data-testid="checkbox-item">
              Inset Checkbox
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const checkboxItem = screen.getByTestId('checkbox-item')
        expect(checkboxItem).toHaveAttribute('data-inset', 'true')
      })
    })
  })

  describe('DropdownMenuRadioGroup', () => {
    it('renders radio group with items', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('handles value change', async () => {
      const user = userEvent.setup()
      const handleValueChange = vi.fn()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={handleValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })

      const radioItem = screen.getByText('Option 2')
      await user.click(radioItem)

      expect(handleValueChange).toHaveBeenCalledWith('option2')
    })

    it('renders radio item with inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1" inset data-testid="radio-item">
                Inset Option
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const radioItem = screen.getByTestId('radio-item')
        expect(radioItem).toHaveAttribute('data-inset', 'true')
      })
    })
  })

  describe('DropdownMenuLabel', () => {
    it('renders label', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Label Text</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Label Text')).toBeInTheDocument()
      })
    })

    it('renders with inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset data-testid="label">
              Inset Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const label = screen.getByTestId('label')
        expect(label).toHaveAttribute('data-inset', 'true')
      })
    })
  })

  describe('DropdownMenuSeparator', () => {
    it('renders separator', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const separator = screen.getByTestId('separator')
        expect(separator).toBeInTheDocument()
        expect(separator).toHaveAttribute('data-slot', 'dropdown-menu-separator')
      })
    })
  })

  describe('DropdownMenuShortcut', () => {
    it('renders shortcut text', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('⌘S')).toBeInTheDocument()
      })
    })
  })

  describe('DropdownMenuGroup', () => {
    it('renders grouped items', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup data-testid="group">
              <DropdownMenuItem>Group Item 1</DropdownMenuItem>
              <DropdownMenuItem>Group Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const group = screen.getByTestId('group')
        expect(group).toBeInTheDocument()
        expect(group).toHaveAttribute('data-slot', 'dropdown-menu-group')
      })
    })
  })

  describe('DropdownMenuSub', () => {
    it('renders submenu', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('More Options')).toBeInTheDocument()
      })
    })

    it('renders submenu trigger with inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset data-testid="sub-trigger">
                More Options
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const subTrigger = screen.getByTestId('sub-trigger')
        expect(subTrigger).toHaveAttribute('data-inset', 'true')
      })
    })
  })

  describe('Complex Menu Composition', () => {
    it('renders a complete dropdown menu with all components', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Show Sidebar</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value="light">
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /actions/i }))

      await waitFor(() => {
        expect(screen.getByText('My Account')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
        expect(screen.getByText('Show Sidebar')).toBeInTheDocument()
        expect(screen.getByText('Light')).toBeInTheDocument()
        expect(screen.getByText('Dark')).toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
        expect(screen.getByText('⌘P')).toBeInTheDocument()
      })
    })
  })

  describe('Content Alignment', () => {
    it('renders content with default align prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toBeInTheDocument()
      })
    })

    it('renders content with custom align prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toBeInTheDocument()
      })
    })
  })
})
