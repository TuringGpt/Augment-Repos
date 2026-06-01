import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

interface NavBarProps {
  variant?: "transparent" | "default";
}

function NavBar({ variant = "transparent" }: NavBarProps) {
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
            to='/'
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

          {/* Navigation Menu */}
          <div className='flex items-center gap-4'>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href='#features'
                      className={cn(navigationMenuTriggerStyle(), linkClasses)}
                    >
                      Features
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to='/signin'
                      className={cn(navigationMenuTriggerStyle(), linkClasses)}
                    >
                      Sign In
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Button
              asChild
              size='default'
              className={
                variant === "transparent"
                  ? "bg-primary hover:bg-primary/90"
                  : ""
              }
            >
              <Link to='/register' className='text-white!'>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
