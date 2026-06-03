import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import {
  HomeIcon,
  FileTextIcon,
  BarChartIcon,
  SettingsIcon,
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

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      name: 'Forms',
      href: '/dashboard/forms',
      icon: <FileTextIcon className="w-5 h-5" />,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: <BarChartIcon className="w-5 h-5" />,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
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
          onClick={() => {
            // TODO: Implement logout functionality
            console.log('Logout clicked');
          }}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOutIcon className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}

export default Sidebar;
