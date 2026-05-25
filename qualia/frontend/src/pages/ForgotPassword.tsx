import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

interface ForgotPasswordFormData {
  email: string;
}

function ForgotPassword() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Trim and normalize email to prevent whitespace-related failures
      const trimmedEmail = formData.email.trim();

      // TODO: Integrate with actual API endpoint
      await fetch('http://localhost:8000/api/v1/auth/forgot-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      // Always show success message regardless of response status
      // to prevent account enumeration attacks
      // This prevents attackers from determining if an email exists in the system
      // by observing different UI states (error vs success)
      setSuccess(
        'If an account exists with this email address, you will receive password reset instructions shortly.'
      );

      // Clear the form
      setFormData({ email: '' });
    } catch (err) {
      // Only show error for network failures or other technical errors
      // that are not related to whether the email exists
      setError('Unable to process your request at this time. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you instructions to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && (
            <div className="forgot-password-error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="forgot-password-success-message" role="status">
              {success}
            </div>
          )}

          <div className="forgot-password-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email address"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="forgot-password-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="forgot-password-footer">
          <p>
            Remember your password?{' '}
            <Link to="/signin" className="forgot-password-signin-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
