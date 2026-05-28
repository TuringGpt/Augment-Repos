import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface ForgotPasswordFormData {
  email: string;
}

function ForgotPassword() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Cleanup to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to backend password reset endpoint
      // Example: const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/forgot-password`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: formData.email }),
      // });

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // Mock successful response
      // TODO: Handle actual API response when backend endpoint is implemented
      setSuccess(
        "If an account exists with this email, you will receive password reset instructions shortly."
      );
      setFormData({ email: "" });
    } catch {
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // Show generic error message to prevent leaking technical details
      // or account enumeration information (e.g., "email not found")
      setError(
        "Unable to process your request at this time. Please try again later."
      );
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Trim email input to normalize whitespace
      [name]: name === "email" ? value.trim() : value,
    }));
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary p-5 animate-in fade-in duration-500'>
      <Card className='w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500'>
        <CardHeader className='text-center space-y-2'>
          <CardTitle className='text-3xl font-bold'>Forgot Password?</CardTitle>
          <CardDescription className='text-base'>
            Enter your email address and we'll send you instructions to reset
            your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-5'>
            {error && (
              <div
                className='rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300'
                role='alert'
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className='rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200 animate-in fade-in slide-in-from-top-2 duration-300'
                role='status'
              >
                {success}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder='Enter your email'
                autoComplete='email'
                disabled={isLoading}
                className='h-10'
              />
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full h-10'
              aria-label={isLoading ? "Sending..." : "Send Reset Instructions"}
            >
              {isLoading ? (
                <>
                  <Spinner aria-hidden="true" />
                  <span className='ml-2'>Sending...</span>
                </>
              ) : (
                "Send Reset Instructions"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Remember your password?{" "}
            <Link
              to='/signin'
              className='text-primary font-medium hover:underline underline-offset-4 transition-colors'
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ForgotPassword;
