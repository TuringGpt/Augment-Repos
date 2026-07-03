import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

describe('Sheet', () => {
  describe('Basic Rendering', () => {
    it('renders trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Test Title</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByRole('button', { name: /open sheet/i })).toBeInTheDocument()
    })

    it('does not render content when closed', () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Test Title</SheetTitle>
            <SheetDescription>Test Description</SheetDescription>
          </SheetContent>
        </Sheet>
      )

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
    })

    it('renders content when opened via trigger', async () => {
      const user = userEvent.setup()

      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Test Title</SheetTitle>
            <SheetDescription>Test Description</SheetDescription>
          </SheetContent>
        </Sheet>
      )

      await user.click(screen.getByRole('button', { name: /open sheet/i }))

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('renders when controlled with open prop', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Controlled Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByText('Controlled Sheet')).toBeInTheDocument()
    })
  })

  describe('Close Behavior', () => {
    it('renders a close button by default and closes when clicked', async () => {
      const user = userEvent.setup()

      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Closable Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      const closeButton = await screen.findByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()

      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Closable Sheet')).not.toBeInTheDocument()
      })
    })

    it('closes when SheetClose is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet With Custom Close</SheetTitle>
            <SheetClose asChild>
              <button type="button">Dismiss</button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(screen.getByText('Sheet With Custom Close')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /dismiss/i }))

      await waitFor(() => {
        expect(screen.queryByText('Sheet With Custom Close')).not.toBeInTheDocument()
      })
    })
  })

  describe('Side Variants', () => {
    it('applies right-side classes by default', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Right Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const content = screen.getByRole('dialog')
      expect(content).toHaveClass('right-0', 'border-l', 'slide-in-from-right')
    })

    it('applies left-side classes when side is left', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="left">
            <SheetTitle>Left Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const content = screen.getByRole('dialog')
      expect(content).toHaveClass('left-0', 'border-r', 'slide-in-from-left')
    })

    it('applies top-side classes when side is top', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="top">
            <SheetTitle>Top Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const content = screen.getByRole('dialog')
      expect(content).toHaveClass('top-0', 'border-b', 'slide-in-from-top')
    })

    it('applies bottom-side classes when side is bottom', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="bottom">
            <SheetTitle>Bottom Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const content = screen.getByRole('dialog')
      expect(content).toHaveClass('bottom-0', 'border-t', 'slide-in-from-bottom')
    })
  })

  describe('Controlled State', () => {
    it('respects controlled open state changes', () => {
      const { rerender } = render(
        <Sheet open={false}>
          <SheetContent>
            <SheetTitle>Controlled Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.queryByText('Controlled Sheet')).not.toBeInTheDocument()

      rerender(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Controlled Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByText('Controlled Sheet')).toBeInTheDocument()
    })

    it('calls onOpenChange when sheet state changes', async () => {
      const user = userEvent.setup()
      const handleOpenChange = vi.fn()

      render(
        <Sheet onOpenChange={handleOpenChange}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Test</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      await user.click(screen.getByRole('button', { name: /open/i }))

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className to content', () => {
      render(
        <Sheet open={true}>
          <SheetContent className="custom-content" data-testid="sheet-content">
            <SheetTitle>Custom Styled Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByTestId('sheet-content')).toHaveClass('custom-content')
    })

    it('applies custom className to title', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle className="custom-title" data-testid="sheet-title">
              Styled Title
            </SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByTestId('sheet-title')).toHaveClass('custom-title')
    })

    it('applies custom className to description', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription className="custom-desc" data-testid="sheet-description">
              Styled Description
            </SheetDescription>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByTestId('sheet-description')).toHaveClass('custom-desc')
    })
  })

  describe('Accessibility', () => {
    it('renders with proper ARIA role', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Accessible Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('associates title with sheet content', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAccessibleName('Sheet Title')
      expect(screen.getByText('Sheet Title')).toBeInTheDocument()
    })

    it('includes description in accessible description', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>This is a sheet description</SheetDescription>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
        'This is a sheet description'
      )
    })

    it('has accessible close button', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Test</SheetTitle>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('SheetHeader Component', () => {
    it('renders header content and applies custom className', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetHeader className="custom-header" data-testid="sheet-header">
              <SheetTitle>Header Title</SheetTitle>
              <SheetDescription>Header Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByText('Header Title')).toBeInTheDocument()
      expect(screen.getByText('Header Description')).toBeInTheDocument()
      expect(screen.getByTestId('sheet-header')).toHaveClass('custom-header')
    })
  })

  describe('SheetFooter Component', () => {
    it('renders footer content and applies custom className', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Footer Sheet</SheetTitle>
            <SheetFooter className="custom-footer" data-testid="sheet-footer">
              <button type="button">Confirm</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      expect(screen.getByTestId('sheet-footer')).toHaveClass('custom-footer')
    })
  })
})