import { describe, expect, it } from 'vitest'
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