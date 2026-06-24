import { BrowserRouter } from 'react-router-dom';
import "@/App.css";
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AppRoutes } from '@/routes';
import { useTokenExpirationCheck } from '@/hooks/useTokenExpirationCheck';

/**
 * AppContent component
 *
 * Inner component that uses hooks requiring Router context
 * Separated from App to allow hooks like useNavigate to work properly
 */
function AppContent() {
  // Automatically check for token expiration and logout if expired
  useTokenExpirationCheck();

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

/**
 * App component
 *
 * Root application component that provides:
 * - Theme provider for dark/light mode
 * - Browser router for client-side routing
 * - Toast notifications
 * - Centralized route configuration
 * - Automatic token expiration checking
 */
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
