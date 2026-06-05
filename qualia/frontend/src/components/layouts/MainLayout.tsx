import type { ReactNode } from 'react';
import NavBar from '@/components/NavBar';

interface MainLayoutProps {
  children: ReactNode;
  navVariant?: 'transparent' | 'default';
}

/**
 * MainLayout component
 * 
 * Layout wrapper for public-facing pages (like home page).
 * Includes the main navigation bar.
 * 
 * @example
 * ```tsx
 * <MainLayout navVariant="transparent">
 *   <Home />
 * </MainLayout>
 * ```
 */
export function MainLayout({ children, navVariant = 'transparent' }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar variant={navVariant} />
      <main>{children}</main>
    </div>
  );
}
