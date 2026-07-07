import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * AuthLayout component
 *
 * Layout wrapper for authentication pages (sign-in, register, forgot password).
 * Provides consistent styling and branding across auth pages.
 *
 * @example
 * ```tsx
 * <AuthLayout>
 *   <SignIn />
 * </AuthLayout>
 * ```
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='min-h-screen flex flex-col bg-secondary'>
      {/* Main Content */}
      <main className='flex-1 h-full w-full flex flex-col gap-10 items-center justify-center px-5 pt-5 pb-8 animate-in fade-in duration-500'>
        <Link
          to={ROUTES.HOME}
          className={cn(
            "flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity",
          )}
          aria-label='Qualia Home'
        >
          <div className='flex justify-center animate-in slide-in-from-bottom-4 duration-700'>
            <Logo size={100} />
          </div>
        </Link>
        {children}
      </main>

      {/* Footer */}
      <footer className='flex justify-center px-5 py-6 text-center text-xs text-muted-foreground/70'>
        <p className='mx-auto max-w-sm'>&copy; {new Date().getFullYear()} Qualia. All rights reserved.</p>
      </footer>
    </div>
  );
}
