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
      // TODO: Integrate with actual API endpoint
      const response = await fetch('http://localhost:8000/api/v1/auth/forgot-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send password reset email';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();

            // Handle detail or message fields that might be strings, objects, or arrays
            const detail = errorData.detail;
            const message = errorData.message;

            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (Array.isArray(detail)) {
              errorMessage = detail.map((item: any) => 
                typeof item === 'string' ? item : item.msg || JSON.stringify(item)
              ).join(', ');
            } else if (typeof message === 'string') {
              errorMessage = message;
            } else if (detail && typeof detail === 'object') {
              errorMessage = JSON.stringify(detail);
            }
          } else {
            // If not JSON, try to read as text for better error context
            const textError = await response.text();
            errorMessage = textError || `Request failed with status ${response.status}`;
          }
        } catch {
          // If parsing fails, use a generic error message with status code
          errorMessage = `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Success response
      setSuccess(
        'If an account exists with this email address, you will receive password reset instructions shortly.'
      );
      
      // Clear the form
      setFormData({ email: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your request');
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
            <Link to="/signin" className="signin-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
