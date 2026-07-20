import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from '@project-iq/shared/ui';
import { useLocalStorage } from '@project-iq/shared/hooks';
import { capitalize } from '@project-iq/shared/utils';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {capitalize('project IQ')}
                </h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                Theme: {theme}
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
