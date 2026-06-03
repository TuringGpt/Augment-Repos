import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
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

// Zod schema for forgot password form validation
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim() // Normalize by trimming whitespace before validation
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPassword() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Track mount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const form = useForm({
    defaultValues: {
      email: "",
    } as ForgotPasswordFormData,
    onSubmit: async ({ value }) => {
      if (!isMountedRef.current) return;
      setError("");
      setSuccess("");
      setIsLoading(true);

      try {
        // Validate with Zod and use the parsed (trimmed) result
        const validatedData = forgotPasswordSchema.parse(value);

        // TODO: Replace with actual API call to backend password reset endpoint
        // Example: const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/forgot-password`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ email: validatedData.email }),
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
        form.reset();
      } catch (err) {
        // Only update state if component is still mounted
        if (!isMountedRef.current) return;

        if (err instanceof z.ZodError) {
          const issues = err.issues;
          setError(issues[0]?.message || "Validation failed");
        } else {
          // Show generic error message to prevent leaking technical details
          // or account enumeration information (e.g., "email not found")
          setError(
            "Unable to process your request at this time. Please try again later."
          );
        }
      } finally {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
  });

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary p-5 animate-in fade-in duration-500'>
      <Card className='w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500'>
        <CardHeader className='text-center space-y-2'>
          <CardTitle className='text-2xl font-bold'>Forgot Password?</CardTitle>
          <CardDescription className='text-base'>
            Enter your email address and we'll send you instructions to reset
            your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await form.handleSubmit();
            }}
            className='space-y-5'
          >
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

            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  const result = forgotPasswordSchema.shape.email.safeParse(value);
                  return result.success
                    ? undefined
                    : result.error.issues[0]?.message;
                },
              }}
            >
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    type='email'
                    id='email'
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      // Clear page-level error and success when user starts editing
                      if (error) setError("");
                      if (success) setSuccess("");
                    }}
                    placeholder='Enter your email'
                    autoComplete='email'
                    disabled={isLoading}
                    className='h-10'
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-sm text-destructive'>
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

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
