import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import {
  HomeIcon,
  FileTextIcon,
  SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * MobileBottomNav component
 * 
 * Bottom navigation bar for mobile devices.
 * Shows main navigation items at the bottom of the screen.
 * 
 * @example
 * ```tsx
 * <MobileBottomNav />
 * ```
 */
export function MobileBottomNav() {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      name: 'Forms',
      href: ROUTES.DASHBOARD_FORMS,
      icon: <FileTextIcon className="w-5 h-5" />,
    },
    {
      name: 'Settings',
      href: ROUTES.DASHBOARD_SETTINGS,
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === ROUTES.DASHBOARD) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors',
              isActive(item.href)
                ? 'text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg',
              isActive(item.href) && 'bg-sidebar-accent'
            )}>
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
