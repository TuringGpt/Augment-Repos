import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

describe('Dialog', () => {
  describe('Basic Rendering', () => {
    it('renders trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument()
    })

    it('does not render content when closed', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
    })

    it('renders content when opened via trigger', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open dialog/i }))

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('renders when controlled with open prop', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
    })
  })

  describe('Close Button Behavior', () => {
    it('renders close button by default', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog with Close Button</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
      })
    })

    it('hides close button when showCloseButton is false', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Dialog without Close Button</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Dialog without Close Button')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
    })

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /close/i }))

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('DialogHeader Component', () => {
    it('renders header with content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Header Title</DialogTitle>
              <DialogDescription>Header Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Header Title')).toBeInTheDocument()
      })
      expect(screen.getByText('Header Description')).toBeInTheDocument()
    })

    it('applies custom className to header', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const header = screen.getByTestId('dialog-header')
        expect(header).toHaveClass('custom-header')
      })
    })
  })

  describe('DialogFooter Component', () => {
    it('renders footer with content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogFooter>
              <button>Action</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
      })
    })

    it('renders close button in footer when showCloseButton is true', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter showCloseButton={true}>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('applies custom className to footer', async () => {
      const user = userEvent.setup

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter className="custom-footer" data-testid="dialog-footer">
              Footer Content
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const footer = screen.getByTestId('dialog-footer')
        expect(footer).toHaveClass('custom-footer')
      })
    })
  })

  describe('DialogClose Component', () => {
    it('renders custom close trigger', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Custom Close</DialogTitle>
            <DialogClose asChild>
              <button>Custom Close Button</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Custom Close')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /custom close button/i })).toBeInTheDocument()
    })

    it('closes dialog when custom close trigger is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogClose asChild>
              <button>Cancel</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
      })
    })
  })

  describe('Controlled State', () => {
    it('respects controlled open state', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument()

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
    })

    it('calls onOpenChange when dialog state changes', async () => {
      const user = userEvent.setup()
      const handleOpenChange = vi.fn()

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className to content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="custom-content" data-testid="dialog-content">
            <DialogTitle>Custom Styled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const content = screen.getByTestId('dialog-content')
        expect(content).toHaveClass('custom-content')
      })
    })

    it('applies custom className to title', async () => {

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle className="custom-title" data-testid="dialog-title">
              Styled Title
            </DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const title = screen.getByTestId('dialog-title')
        expect(title).toHaveClass('custom-title')
      })
    })

    it('applies custom className to description', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription className="custom-desc" data-testid="dialog-description">
              Styled Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const description = screen.getByTestId('dialog-description')
        expect(description).toHaveClass('custom-desc')
      })
    })
  })

  describe('Accessibility', () => {
    it('renders with proper ARIA role', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Accessible Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('associates title with dialog content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        const title = screen.getByText('Dialog Title')
        expect(dialog).toHaveAccessibleName('Dialog Title')
        expect(title).toBeInTheDocument()
      })
    })

    it('includes description in accessible description', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>This is a description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAccessibleDescription('This is a description')
      })
    })

    it('has accessible close button', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i })
        expect(closeButton).toBeInTheDocument()
      })
    })
  })

  describe('Data Attributes', () => {
    it('applies correct data-slot attributes', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogContent data-testid="content">
            <DialogHeader data-testid="header">
              <DialogTitle data-testid="title">Test</DialogTitle>
              <DialogDescription data-testid="description">Description</DialogDescription>
            </DialogHeader>
            <DialogFooter data-testid="footer">Footer</DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-slot', 'dialog-trigger')

      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'dialog-content')
        expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'dialog-header')
        expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'dialog-title')
        expect(screen.getByTestId('description')).toHaveAttribute('data-slot', 'dialog-description')
        expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'dialog-footer')
      })
    })
  })

  describe('Dialog Composition', () => {
    it('renders a complete dialog with all components', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Dialog</DialogTitle>
              <DialogDescription>This dialog has all components</DialogDescription>
            </DialogHeader>
            <div>Main Content Area</div>
            <DialogFooter>
              <DialogClose asChild>
                <button>Cancel</button>
              </DialogClose>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open dialog/i }))

      await waitFor(() => {
        expect(screen.getByText('Complete Dialog')).toBeInTheDocument()
        expect(screen.getByText('This dialog has all components')).toBeInTheDocument()
        expect(screen.getByText('Main Content Area')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      })
    })

    it('handles multiple actions in footer', async () => {
      const user = userEvent.setup()
      const handleConfirm = vi.fn()
      const handleCancel = vi.fn()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Multi-action Dialog</DialogTitle>
            <DialogFooter>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleConfirm}>Confirm</button>
              <button>Save Draft</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /confirm/i }))
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
