import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { ROUTES } from '@/config/routes';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-5 animate-in fade-in duration-500">
      <Card className="w-full max-w-md text-center animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo size={60} />
          </div>
          
          {/* 404 Badge */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 rounded-full text-destructive text-sm font-medium border border-destructive/20 mx-auto">
            <span className="text-base" aria-hidden="true">🔍</span>
            <span>Error 404</span>
          </div>

          <CardTitle className="text-2xl font-bold">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-base">
            Oops! The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Illustration */}
          <div className="flex justify-center">
            <svg 
              width="200" 
              height="200" 
              viewBox="0 0 200 200" 
              fill="none" 
              className="text-muted-foreground/30"
              aria-hidden="true"
            >
              {/* Lost document illustration */}
              <rect x="60" y="40" width="80" height="100" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="75" y1="60" x2="125" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="75" y1="75" x2="110" y2="75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="75" y1="90" x2="120" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="75" y1="105" x2="105" y2="105" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              
              {/* Question mark */}
              <circle cx="150" cy="150" r="20" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M145 142c0-3 2-5 5-5s5 2 5 5c0 2-1 3-3 4l-2 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="150" cy="156" r="1.5" fill="currentColor"/>
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link to="/">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                </svg>
                Back to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to={ROUTES.DASHBOARD}>
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Need help? Try these:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button asChild variant="link" size="sm" className="text-xs h-auto p-0">
                <Link to="/">Home</Link>
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button asChild variant="link" size="sm" className="text-xs h-auto p-0">
                <Link to="/signin">Sign In</Link>
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button asChild variant="link" size="sm" className="text-xs h-auto p-0">
                <Link to="/register">Register</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotFound;
