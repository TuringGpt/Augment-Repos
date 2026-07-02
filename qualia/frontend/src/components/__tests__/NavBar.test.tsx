import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor, act } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import NavBar from '@/components/NavBar'
import { ROUTES } from '@/config/routes'

describe('NavBar', () => {
  beforeEach(() => {
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders the navigation bar', () => {
      render(<NavBar />)
      const navs = screen.getAllByRole('navigation')
      expect(navs.length).toBeGreaterThan(0)
    })

    it('renders the logo and brand name', () => {
      render(<NavBar />)
      expect(screen.getByLabelText(/qualia home/i)).toBeInTheDocument()
      const qualiaText = screen.getAllByText(/qualia/i)
      expect(qualiaText.length).toBeGreaterThan(0)
    })

    it('renders desktop navigation with responsive CSS classes', () => {
      // Note: NavBar uses Tailwind's responsive classes (hidden md:flex)
      // for responsive behavior. Desktop nav is always in the DOM but hidden
      // via CSS on mobile. We test that the correct responsive classes are applied.
      const { container } = render(<NavBar />)

      // Desktop navigation should have 'hidden md:flex' classes
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      expect(desktopNav).toBeInTheDocument()
      expect(desktopNav).toHaveClass('hidden', 'md:flex')

      // Verify navigation links are present
      expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
    })

    it('renders mobile menu trigger with responsive CSS classes', () => {
      // Note: NavBar uses Tailwind's responsive classes (md:hidden, hidden md:flex)
      // for responsive behavior, not JavaScript conditional rendering.
      // The mobile trigger is always in the DOM but hidden via CSS on desktop.
      // We test that the correct responsive classes are applied.
      render(<NavBar />)

      const menuTrigger = screen.getByLabelText(/open menu/i)
      expect(menuTrigger).toBeInTheDocument()

      // Verify the trigger's parent container has the md:hidden class
      const mobileContainer = menuTrigger.closest('.md\\:hidden')
      expect(mobileContainer).toBeInTheDocument()
      expect(mobileContainer).toHaveClass('md:hidden')
    })
  })

  describe('Variant Styles', () => {
    it('applies transparent variant styles by default', () => {
      const { container } = render(<NavBar />)
      const mainNav = container.querySelector('nav.fixed')
      expect(mainNav).toHaveClass('bg-white/10')
    })

    it('applies default variant styles when specified', () => {
      const { container } = render(<NavBar variant="default" />)
      const mainNav = container.querySelector('nav.fixed')
      expect(mainNav).toHaveClass('bg-white/80')
    })
  })

  describe('Navigation Links', () => {
    it('Sign In link navigates to sign in page', () => {
      render(<NavBar />)
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toHaveAttribute('href', ROUTES.SIGN_IN)
    })

    it('Get Started button navigates to register page', () => {
      render(<NavBar />)
      const getStartedLinks = screen.getAllByRole('link', { name: /get started/i })
      getStartedLinks.forEach(link => {
        expect(link).toHaveAttribute('href', ROUTES.REGISTER)
      })
    })

    it('Logo link navigates to home page', () => {
      render(<NavBar />)
      const logoLink = screen.getByLabelText(/qualia home/i)
      expect(logoLink).toHaveAttribute('href', ROUTES.HOME)
    })
  })

  describe('Mobile Menu', () => {
    it('mobile menu is closed by default', () => {
      render(<NavBar />)
      // Sheet content is not visible initially
      expect(screen.queryByRole('heading', { name: /menu/i })).not.toBeInTheDocument()
    })

    it('opens mobile menu when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<NavBar />)
      
      const menuTrigger = screen.getByLabelText(/open menu/i)
      await user.click(menuTrigger)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })
    })

    it('mobile menu contains navigation links', async () => {
      const user = userEvent.setup()
      render(<NavBar />)

      const menuTrigger = screen.getByLabelText(/open menu/i)
      await user.click(menuTrigger)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })

      // Check for links specifically within mobile menu (SheetContent)
      // Use the heading "Menu" to find the mobile menu container
      const menuHeading = screen.getByRole('heading', { name: /menu/i })
      const mobileMenuContainer = menuHeading.closest('[role="dialog"]')

      if (!mobileMenuContainer) {
        throw new Error('Could not find Sheet dialog element - mobile menu markup may have changed')
      }

      // Query specifically within the mobile menu to ensure these links are in the mobile menu
      const mobileMenu = within(mobileMenuContainer)
      expect(mobileMenu.getByRole('link', { name: /features/i })).toBeInTheDocument()
      expect(mobileMenu.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      expect(mobileMenu.getByRole('link', { name: /get started/i })).toBeInTheDocument()
    })

    it('closes mobile menu when a link is clicked', async () => {
      const user = userEvent.setup()
      render(<NavBar />)

      const menuTrigger = screen.getByLabelText(/open menu/i)
      await user.click(menuTrigger)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })

      // Find and click Sign In link in the mobile menu
      const signInLinks = screen.getAllByRole('link', { name: /sign in/i })
      const mobileSignInLink = signInLinks.find(link =>
        link.className.includes('text-lg')
      )

      expect(mobileSignInLink).toBeDefined()
      await user.click(mobileSignInLink!)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /menu/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Window Resize Behavior', () => {
    it('closes mobile menu when window is resized above mobile breakpoint', async () => {
      const user = userEvent.setup()

      // Set initial width to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      render(<NavBar />)

      // Open mobile menu
      const menuTrigger = screen.getByLabelText(/open menu/i)
      await user.click(menuTrigger)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })

      // Resize window to desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      // Wait for the resize event listener to be set up with the updated isOpen state.
      // The useEffect that installs the listener depends on isOpen, so we need to
      // ensure it has re-run after isOpen changed to true before dispatching resize.
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Trigger resize event
      await act(async () => {
        window.dispatchEvent(new Event('resize'))
      })

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /menu/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Features Click Handler', () => {
    let originalScrollIntoView: typeof Element.prototype.scrollIntoView | undefined

    beforeEach(() => {
      // Save the original scrollIntoView implementation
      originalScrollIntoView = Element.prototype.scrollIntoView

      // Mock scrollIntoView
      Element.prototype.scrollIntoView = vi.fn()
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(vi.fn())

      // Mock document.getElementById
      vi.spyOn(document, 'getElementById').mockReturnValue(null)
    })

    afterEach(() => {
      // Restore mocks specific to this suite
      vi.restoreAllMocks()

      // Restore or delete scrollIntoView to prevent leaking into other tests
      if (originalScrollIntoView !== undefined) {
        Element.prototype.scrollIntoView = originalScrollIntoView
      } else {
        delete (Element.prototype as any).scrollIntoView
      }

      // Reset window.location.hash to prevent state bleed into other tests
      window.location.hash = ''
    })

    it('prevents default navigation behavior when Features link is clicked', async () => {
      const user = userEvent.setup()
      render(<NavBar />)

      const featuresLink = screen.getByRole('link', { name: /features/i })

      // Track preventDefault calls by adding a click event listener
      const preventDefaultSpy = vi.fn()
      featuresLink.addEventListener('click', (e: Event) => {
        // Spy on whether preventDefault was called
        const originalPreventDefault = e.preventDefault.bind(e)
        e.preventDefault = () => {
          preventDefaultSpy()
          originalPreventDefault()
        }
      }, { capture: true })

      // Click the features link
      await user.click(featuresLink)

      // Verify that preventDefault was called, which prevents default navigation
      expect(preventDefaultSpy).toHaveBeenCalled()

      // Also verify the handler executed by checking it called getElementById
      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith('features')
      })
    })

    it('scrolls to features element when it exists', async () => {
      const user = userEvent.setup()
      const mockElement = document.createElement('div')
      mockElement.id = 'features'
      mockElement.scrollIntoView = vi.fn()

      // Reconfigure the existing spy instead of creating a new one
      vi.mocked(document.getElementById).mockReturnValue(mockElement)

      render(<NavBar />)

      const featuresLink = screen.getByRole('link', { name: /features/i })

      // Click the features link to trigger the scroll behavior
      await user.click(featuresLink)

      await waitFor(() => {
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        })
      })
    })

    it('closes mobile menu when Features link is clicked', async () => {
      const user = userEvent.setup()
      render(<NavBar />)

      // Open mobile menu
      const menuTrigger = screen.getByLabelText(/open menu/i)
      await user.click(menuTrigger)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })

      // Click Features link in mobile menu
      const featuresLinks = screen.getAllByRole('link', { name: /features/i })
      const mobileFeaturesLink = featuresLinks.find(link =>
        link.className.includes('text-lg')
      )

      expect(mobileFeaturesLink).toBeDefined()
      await user.click(mobileFeaturesLink!)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /menu/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Theme Selector', () => {
    it('renders theme selector in desktop view', () => {
      const { container } = render(<NavBar />)
      // Find the desktop navigation container (hidden on mobile, visible on md+)
      const desktopNav = container.querySelector('.hidden.md\\:flex')

      // Verify ThemeSelector is specifically within the desktop navigation
      // This ensures the test fails if the desktop ThemeSelector is removed
      const desktopThemeButton = within(desktopNav as HTMLElement).getByLabelText(/open theme menu/i)
      expect(desktopThemeButton).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('logo link has accessible name', () => {
      render(<NavBar />)
      const logoLink = screen.getByLabelText(/qualia home/i)
      expect(logoLink).toBeInTheDocument()
    })

    it('mobile menu trigger has accessible name', () => {
      render(<NavBar />)
      const menuTrigger = screen.getByLabelText(/open menu/i)
      expect(menuTrigger).toBeInTheDocument()
    })
  })
})
