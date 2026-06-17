import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Logo from '@/components/Logo';
import { ThemeSelector } from '@/components/theme-selector';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserIcon, LogOutIcon } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * DashboardLayout component
 *
 * Layout wrapper for dashboard pages.
 * Includes the sidebar navigation and main content area.
 * Responsive design with mobile bottom navigation.
 *
 * @example
 * ```tsx
 * <DashboardLayout>
 *   <Dashboard />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Refs to track timeout IDs for cleanup
  const redirectTimeoutRef = useRef<number | null>(null);
  const dialogOpenTimeoutRef = useRef<number | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        clearTimeout(redirectTimeoutRef.current);
      }
      if (dialogOpenTimeoutRef.current !== null) {
        clearTimeout(dialogOpenTimeoutRef.current);
      }
    };
  }, []);

  // Logout mutation hook
  const { mutate: logoutUser, isPending: isLoggingOut } = useLogout({
    onSuccess: () => {
      // Development-only logging
      if (import.meta.env.DEV) {
        console.log('Logout successful');
      }

      // Close the dialogs
      setShowLogoutDialog(false);
      setIsMenuOpen(false);

      // Show success toast notification
      toast.success('Logged out successfully', {
        description: 'Redirecting to sign in page...',
      });

      // Redirect to sign in page after logout
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(ROUTES.SIGN_IN);
      }, 500) as unknown as number;
    },
    onError: (error) => {
      // Development-only logging
      if (import.meta.env.DEV) {
        console.error('Logout failed:', error);
      }

      // Close the dialogs
      setShowLogoutDialog(false);
      setIsMenuOpen(false);

      // Show error toast
      toast.error('Logout failed', {
        description: 'Please try again',
      });
    },
  });

  const handleLogoutClick = () => {
    // Close the sheet first to avoid nested Radix dialogs
    setIsMenuOpen(false);

    // Clear any previously scheduled timeout to prevent stale timers
    if (dialogOpenTimeoutRef.current !== null) {
      clearTimeout(dialogOpenTimeoutRef.current);
    }

    // Use a small delay to allow the sheet to close before opening the dialog
    dialogOpenTimeoutRef.current = setTimeout(() => {
      setShowLogoutDialog(true);
    }, 150) as unknown as number;
  };

  const handleConfirmLogout = () => {
    logoutUser();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Mobile Top Header - Simple branding */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border mobile-header-safe">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-sidebar-foreground">Qualia</span>
          </div>

          {/* Mobile User Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent/50"
                aria-label="Open menu"
              >
                <UserIcon className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Account</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                {/* Theme Selector */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm text-foreground">Theme</span>
                  <ThemeSelector />
                </div>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="w-full justify-start gap-3 text-foreground hover:bg-accent"
                >
                  <LogOutIcon className="w-5 h-5" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 mobile-content-safe">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the sign-in page and will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
