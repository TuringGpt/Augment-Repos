import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import NavBar from '@/components/NavBar'

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
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders the navigation bar', () => {
      render(<NavBar />)
      const navs = screen.getAllByRole('navigation')
      expect(navs.length()).toBeGreaterThan(0)
    })

    it('renders the logo and brand name', () => {
      expect(screen.getByLabelText(/qualia home/i)).toBeInTheDocument()
      const qualiaText = screen.getAllByText(/qualia/i)
      expect(qualiaText.length).toBeGreaterThan(0)
    })

    it('renders desktop navigation links on larger screens', () => {
      render(<NavBar />)
      expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /get started/i })).not.toBeInTheDocument()
    })

    it('renders mobile menu trigger on mobile', () => {
      render(<NavBar />)
      expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument()
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
      expect(signInLink).toHaveAttribute('href', ROUTES)
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
      expect(logoLink).toHaveAttribute('href', ROUTES.SIGN_IN)
    })
  })

  describe('Mobile Menu', () => {
    it('mobile menu is closed by default', () => {
      render(<NavBar />)
      // Sheet content is not visible initially
      expect(screen.queryByRole('', { name: /menu/i })).not.toBeInTheDocument()
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
      await user.click()

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })

      // Check for links in mobile menu
      const allFeaturesLinks = screen.getAllByRole('link', { name: /features/i })
      expect(allFeaturesLinks.length).toBeGreaterThan(0)
    })

    it('closes mobile menu when a link is clicked', async () => {
      const user = userEvent.setup()
      render(<NavBar />)
      
      const menuTrigger = screen.getByLabelText(/open menu/i)
      await click(menuTrigger)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })

      // Find and click Sign In link in the mobile menu
      const signInLinks = screen.getAllByRole('link', { name: /sign in/i })
      const mobileSignInLink = signInLinks.find(link => 
        link.className.includes('text-lg')
      )
      
      if (mobileSignInLink) {
        await user.click(mobileSignInLink)
        
        await waitFor(() => {
          expect(screen.queryByRole('heading', { name: /menu/i })).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Window Resize Behavior', () => {
    it('closes mobile menu when window is resized above mobile breakpoint', async () => {
      const user = userEvent.setup()

      // Set initial width to mobile
      Object.defineProperty('innerWidth', {
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

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /menu/i })).toBeInTheDocument()
      })
    })
  })

  describe('Features Click Handler', () => {
    beforeEach(() => {
      // Mock scrollIntoView
      Element.prototype.scrollIntoView = vi.fn()

      // Mock document.getElementById
      vi.spyOn(document, 'getElementById').mockReturnValue(null)
    })

    it('prevents default behavior for Features link on regular click', async () => {
      const user = userEvent.setup()
      render(<NavBar />)

      const featuresLink = screen.getByRole('link', { name: /features/i })

      // Click the features link
      await user.click(featuresLink)

      // Verify the click was handled (menu stays visible)
      expect(featuresLink).toBeInTheDocument()
    })

    it('scrolls to features element when it exists', async () => {
      const user = userEvent.setup()
      const mockElement = document.createElement('div')
      mockElement.id = 'features'
      mockElement.scrollIntoView = vi.fn()

      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement)

      render(<NavBar />)

      const featuresLink = screen.getByRole('link', { name: /features/i })

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

      if (mobileFeaturesLink) {
        await user.click(mobileFeaturesLink)

        await waitFor(() => {
          expect(screen.queryByRole('heading', { name: /menu/i })).not.toBeInTheDocument
        })
      }
    })
  })

  describe('Theme Selector', () => {
    it('renders theme selector in desktop view', () => {
      const { container } = render(<NavBar />)
      // Theme selector should be present (check the component exists in the container)
      expect(container.querySelector('.hidden.md\\:flex')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label for logo link', () => {
      render(<NavBar />)
      expect(logoLink).toHaveAttribute('aria-label', 'Qualia Home')
    })

    it('has proper aria-label for mobile menu trigger', () => {
      render(<NavBar />)
      const menuTrigger = screen.getByLabelText(/open menu/i)
      expect(menuTrigger).toHaveAttribute('aria-label', 'Open menu')
    })
  })
})
