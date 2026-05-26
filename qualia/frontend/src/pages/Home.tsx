import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span>AI-Powered QA Platform</span>
          </div>
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Qualia</span>
          </h1>
          <p className="hero-description">
            Transform your quality assurance workflow with intelligent automation. 
            Qualia combines the simplicity of Google Forms with powerful AI-driven 
            insights to consolidate reviewer feedback into actionable reports.
          </p>
          <div className="hero-actions">
            <Link to="/signin" className="btn-primary">
              Get Started
              <svg className="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#features" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-header">
          <h2 className="section-title">Why Choose Qualia?</h2>
          <p className="section-description">
            Everything you need to streamline your QA process in one powerful platform
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon icon-forms">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Dynamic Forms</h3>
            <p className="feature-description">
              Create flexible QA forms with custom fields, validation rules, and conditional logic
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-ai">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">AI-Powered Insights</h3>
            <p className="feature-description">
              Automatically consolidate feedback, identify patterns, and generate comprehensive reports
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-collab">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Team Collaboration</h3>
            <p className="feature-description">
              Enable seamless collaboration with role-based access for admins, reviewers, and viewers
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-analytics">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Real-time Analytics</h3>
            <p className="feature-description">
              Track submissions, monitor trends, and gain insights into recurring quality issues
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-secure">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Secure & Reliable</h3>
            <p className="feature-description">
              Enterprise-grade security with encrypted data storage and comprehensive audit logs
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-export">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Easy Export</h3>
            <p className="feature-description">
              Export reports in multiple formats including PDF, CSV, and JSON for further analysis
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Qualia. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
