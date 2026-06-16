import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Logo from '@/components/Logo';

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
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Mobile Top Header - Simple branding */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-sidebar-foreground">Qualia</span>
          </div>

          <ThemeSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-16 lg:pb-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
