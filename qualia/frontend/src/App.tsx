import { BrowserRouter } from 'react-router-dom';
import "@/App.css";
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AppRoutes } from '@/routes';

/**
 * App component
 *
 * Root application component that provides:
 * - Theme provider for dark/light mode
 * - Browser router for client-side routing
 * - Toast notifications
 * - Centralized route configuration
 */
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
