import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ROUTES } from "@/config/routes";
import { ThemeSelector } from "@/components/theme-selector";
import { Menu } from "lucide-react";

interface NavBarProps {
  variant?: "transparent" | "default";
}

function NavBar({ variant = "transparent" }: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu when window is resized above mobile breakpoint
  useEffect(() => {
    // Guard against SSR/non-browser environments
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  /**
   * Handle navigation to home page with hash anchor
   * Ensures reliable scrolling to anchor elements even when the Home page is lazy-loaded
   */
  const handleFeaturesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If already on home page, scroll to anchor immediately
    if (location.pathname === ROUTES.HOME) {
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate to home page first, then scroll after component loads
      navigate(ROUTES.HOME);

      // Wait for the lazy-loaded home page to render, then scroll
      setTimeout(() => {
        const element = document.getElementById('features');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    // Close mobile menu if open
    setIsOpen(false);
  };

  const navClasses =
    variant === "transparent"
      ? "fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-border/20"
      : "fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border";

  const linkClasses =
    variant === "transparent"
      ? "text-primary hover:text-primary/80"
      : "text-foreground hover:text-primary";

  return (
    <nav className={navClasses}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className={cn(
              "flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity",
              variant === "transparent" ? "text-white" : "text-primary",
            )}
            aria-label='Qualia Home'
          >
            <div className='flex justify-center animate-in slide-in-from-bottom-4 duration-700'>
              <Logo size={35} />
            </div>
            <span className='text-primary'>Qualia</span>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className='hidden md:flex items-center gap-4'>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="#features"
                      onClick={handleFeaturesClick}
                      className={cn(navigationMenuTriggerStyle(), linkClasses)}
                    >
                      Features
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to={ROUTES.SIGN_IN}
                      className={cn(navigationMenuTriggerStyle(), linkClasses)}
                    >
                      Sign In
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <ThemeSelector />

            <Button
              asChild
              size='default'
              className={
                variant === "transparent"
                  ? "bg-primary hover:bg-primary/90"
                  : ""
              }
            >
              <Link to={ROUTES.REGISTER} className='text-white!'>
                Get Started
              </Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className='md:hidden flex items-center gap-2'>
            <ThemeSelector />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className={cn(
                    variant === "transparent"
                      ? "text-primary hover:bg-primary/10"
                      : "text-foreground hover:bg-foreground/10"
                  )}
                  aria-label='Open menu'
                >
                  <Menu className='h-6 w-6' />
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='w-[300px] sm:w-[400px]'>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-4 mt-8'>
                  <a
                    href="#features"
                    onClick={handleFeaturesClick}
                    className='text-lg font-medium hover:text-primary transition-colors'
                  >
                    Features
                  </a>
                  <Link
                    to={ROUTES.SIGN_IN}
                    className='text-lg font-medium hover:text-primary transition-colors'
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Button
                    asChild
                    size='default'
                    className='w-full mt-4 bg-primary hover:bg-primary/90'
                  >
                    <Link
                      to={ROUTES.REGISTER}
                      className='text-white!'
                      onClick={() => setIsOpen(false)}
                    >
                      Get Started
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
