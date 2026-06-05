import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * DashboardLayout component
 * 
 * Layout wrapper for dashboard pages.
 * Includes the sidebar navigation and main content area.
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
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
