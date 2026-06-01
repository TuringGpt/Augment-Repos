import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function Home() {
  const feature: Feature = [
    {
      title: 'Dynamic Forms',
      description: 'Create flexible QA forms with custom fields, validation rules, and conditional logic',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'AI-Powered Insights',
      description: 'Automatically consolidate feedback, identify patterns, and generate comprehensive reports',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Team Collaboration',
      description: 'Enable seamless collaboration with role-based access for admins, reviewers, and viewers',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Real-time Analytics',
      description: 'Track submissions, monitor trends, and gain insights into recurring quality issues',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data storage and comprehensive audit logs',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Easy Export',
      descriptions: 'Export reports in multiple formats including PDF, CSV, and JSON for further analysis',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <NavBar />

      {/* Hero Section */}
      <section className="mx-auto px-5 py-20 md:py-32 animate-in fade-in duration-700 bg-background">
        <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex justify-center animate-in slide-in-from-bottom-4 duration-700">
            <Logo size={100} />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium border border-primary/20 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="text-base" aria-hidden="true">✨</span>
            <span>AI-Powered QA Platform</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-in slide-in-from-bottom-4 duration-700 delay-150">
            Welcome to <span className="text-primary">Qualia</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-200">
            Transform your quality assurance workflow with intelligent automation.
            Qualia combines the simplicity of Google Forms with powerful AI-driven
            insights to consolidate reviewer feedback into actionable reports.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button asChild size="lg" className="h-11 px-8">
              <Link to="/signin">
                Get Started
                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-8 border-primary text-primary hover:text-primary">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-5 py-20 scroll-mt-20">
        <div className="text-center mb-12 space-y-3 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why Choose Qualia?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline your QA process in one powerful platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="transition-all hover:shadow-lg animate-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-5 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Qualia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;