import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignIn.css';

interface SignInFormData {
  email: string;
  password: string;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'reviewer' | 'viewer';
  full_name: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserData;
  expires_in: number;
}

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Integrate with actual API endpoint
      const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } else {
            // If not JSON, try to read as text for better error context
            const textError = await response.text();
            errorMessage = textError || `Login failed with status ${response.status}`;
          }
        } catch {
          // If parsing fails, use a generic error message with status code
          errorMessage = `Login failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (!data.access_token || !data.refresh_token) {
        throw new Error('Missing authentication tokens in response');
      }

      if (!data.user || typeof data.user !== 'object') {
        throw new Error('Missing user information in response');
      }

      if (!data.user.role) {
        throw new Error('Missing user role in response');
      }

      // Type-safe response after validation
      const loginData = data as LoginResponse;

      // Store the access token (in a real app, use secure storage)
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('refresh_token', loginData.refresh_token);

      // Navigate based on user role
      if (loginData.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loginData.user.role === 'reviewer') {
        navigate('/reviewer/dashboard');
      } else {
        navigate('/viewer/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
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
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Sign In to Qualia</h1>
          <p>Welcome back! Please enter your credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="signin-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
