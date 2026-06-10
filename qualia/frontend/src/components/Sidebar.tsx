import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import Logo from '@/components/Logo';
import { ROUTES } from '@/config/routes';
import { useLogout } from '@/hooks/useLogout';
import { toast } from 'sonner';
import {
  HomeIcon,
  SettingsIcon,
  // TODO: Uncomment these imports when the corresponding nav items are re-enabled
  // FileTextIcon,
  // BarChartIcon,
  LogOutIcon,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Logout mutation hook
  const { mutate: logoutUser, isPending: isLoggingOut } = useLogout({
    onSuccess: () => {
      // Development-only logging
      if (import.meta.env.DEV) {
        console.log('Logout successful');
      }

      // Close the dialog
      setShowLogoutDialog(false);

      // Show success toast notification
      toast.success('Logged out successfully', {
        description: 'Redirecting to sign in page...',
      });

      // Redirect to sign in page after logout
      setTimeout(() => {
        navigate(ROUTES.SIGN_IN);
      }, 500);
    },
    onError: (error) => {
      // Development-only logging
      if (import.meta.env.DEV) {
        console.error('Logout failed:', error);
      }

      // Close the dialog
      setShowLogoutDialog(false);

      // Show error toast
      toast.error('Logout failed', {
        description: 'Please try again',
      });
    },
  });

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: <HomeIcon className="w-5 h-5" />,
    },
    // TODO: Uncomment these items when the corresponding routes are implemented in AppRoutes
    // {
    //   name: 'Forms',
    //   href: ROUTES.DASHBOARD_FORMS,
    //   icon: <FileTextIcon className="w-5 h-5" />,
    // },
    // {
    //   name: 'Analytics',
    //   href: ROUTES.DASHBOARD_ANALYTICS,
    //   icon: <BarChartIcon className="w-5 h-5" />,
    // },
    {
      name: 'Settings',
      href: ROUTES.DASHBOARD_SETINGS,
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    logoutUser();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <Logo size={32} />
        <span className="text-xl font-bold text-sidebar-foreground">Qualia</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleLogoutClick}
          disabled={isLoggingOut}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOutIcon className="w-5 h-5" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </Button>
      </div>

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
    </aside>
  );
}

export default Sidebar;
