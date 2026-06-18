import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

describe('AlertDialog', () => {
  describe('Basic Rendering', () => {
    it('renders trigger button', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Test Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument()
    })

    it('does not render content initially when closed', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Test Title</AlertDialogTitle>
            <AlertDialogDescription>Test Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
    })

    it('renders content when opened via trigger', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Test Title</AlertDialogTitle>
            <AlertDialogDescription>Test Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open dialog/i }))

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('renders when controlled with open prop', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Controlled Dialog</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
    })
  })

  describe('Content Variants', () => {
    it('renders with default size', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Default Size</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const content = screen.getByRole('alertdialog')
        expect(content).toHaveAttribute('data-size', 'default')
      })
    })

    it('renders with small size', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogTitle>Small Size</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const content = screen.getByRole('alertdialog')
        expect(content).toHaveAttribute('data-size', 'sm')
      })
    })

    it('renders with media element', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <span data-testid="media-icon">Icon</span>
              </AlertDialogMedia>
              <AlertDialogTitle>With Media</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByTestId('media-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Actions', () => {
    it('renders action and cancel buttons', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole.all('button', { name: /cancel/i })).toBeInTheDocument()
        expect(screen.getByRole.all('button', { name: /confirm/i })).toBeInTheDocument()
      })
    })

    it('calls action button onClick handler', async () => {
      const user = userEvent.setup()
      const handleAction = vi.fn()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /confirm/i }))

      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    it('closes dialog when cancel is clicked', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
      })
    })

    it('renders action with custom variant', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Destructive Action</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /delete/i })
        expect(button).toHaveAttribute('data-variant', 'destructive')
      })
    })

    it('renders cancel with custom variant', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel variant="ghost">Dismiss</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /dismiss/i })
        expect(button).toHaveAttribute('data-variant', 'ghost')
      })
    })

    it('disables action button when disabled prop is true', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction disabled>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /confirm/i })
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Controlled State', () => {
    it('respects controlled open state', () => {
      const { rerender } = render(
        <AlertDialog open={false}>
          <AlertDialogContent>
            <AlertDialogTitle>Controlled</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.queryByText('Controlled')).not.toBeInTheDocument()

      rerender(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Controlled</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Controlled')).toBeInTheDocument()
    })

    it('calls onOpenChange when cancel is clicked', async () => {
      const user = userEvent.setup()
      const handleOpenChange = vi.fn()

      render(
        <AlertDialog open={true} onOpenChange={handleOpenChange}>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Accessibility', () => {
    it('renders with proper ARIA role', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })

    it('associates title with dialog via aria-labelledby', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Accessible Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        const title = screen.getByText('Accessible Title')
        expect(dialog).toHaveAttribute('aria-labelledby', title.id)
      })
    })

    it('associates description with dialog via aria-describedby', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>This is the description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        const description = screen.getByText('This is the description')
        expect(dialog).toHaveAttribute('aria-describedby', description.id)
      })
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className to content', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent className="custom-content-class">
            <AlertDialogTitle>Custom Styled</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const content = screen.getByRole('alertdialog')
        expect(content).toHaveClass('custom-content-class')
      })
    })

    it('applies custom className to action button', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction className="custom-action-class">Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /confirm/i })
        expect(button).toHaveClass('custom-action-class')
      })
    })
  })

  describe('Data Attributes', () => {
    it('applies correct data-slot attributes', async () => {
      const user = userEvent.setup()

      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test</AlertDialogTitle>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).tohaveAttribute('data-slot', 'alert-dialog-content')
      })
    })
  })
})

