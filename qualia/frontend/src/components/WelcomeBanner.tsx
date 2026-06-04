import { SparklesIcon } from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string;
}

function WelcomeBanner({ userName = 'User' }: WelcomeBannerProps) {
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="relative z-10">
        {/* Greeting */}
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {getGreeting()}
          </span>
        </div>

        {/* Welcome message */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Welcome back, {userName}!
        </h1>
        
        <p className="text-base text-muted-foreground max-w-2xl">
          Ready to streamline your QA workflow? Check out your latest forms and analytics below.
        </p>
      </div>
    </div>
  );
}

export default WelcomeBanner;
