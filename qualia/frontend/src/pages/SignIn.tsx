import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
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
import { useLogin } from "@/hooks/useLogin";
import type { ApiError } from "@/lib/axios";

// Zod schema for sign-in form validation
const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type SignInFormData = z.infer<typeof signInSchema>;

// Input field configuration map
const formFields = [
  {
    name: "email" as const,
    label: "Email",
    type: "email" as const,
    placeholder: "Enter your email",
    autoComplete: "email",
    validator: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" }),
  },
  {
    name: "password" as const,
    label: "Password",
    type: "password" as const,
    placeholder: "Enter your password",
    autoComplete: "current-password",
    validator: z.string().min(1, { message: "Password is required" }),
  },
] as const;

function SignIn() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const isMountedRef = useRef(true);
  const navigationTimerRef = useRef<number | null>(null);

  // Track mount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clean up any pending navigation timer
      if (navigationTimerRef.current !== null) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  // Use the TanStack Query mutation hook for login
  const { mutateAsync: loginUser, isPending } = useLogin({
    onSuccess: (data) => {
      // Development-only logging (gated to prevent PII leakage in production)
      if (import.meta.env.DEV) {
        console.log("Login successful, tokens stored");
      }

      // Show success toast notification
      toast.success("Login successful!", {
        description: "Redirecting to dashboard...",
      });

      // Redirect to dashboard after successful login
      // Small delay to allow toast to be visible
      navigationTimerRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          navigate("/dashboard");
        }
      }, 500);
    },
    onError: (err: ApiError) => {
      // Show error toast notification with string normalization
      const errorMessage = typeof err.message === 'string'
        ? err.message
        : "Sign-in failed. Please check your credentials and try again.";
      toast.error("Login failed", {
        description: errorMessage,
      });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    }
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as SignInFormData,
    onSubmit: async ({ value }) => {
      if (!isMountedRef.current) return;
      setError("");

      try {
        // Validate with Zod
        const validatedData = signInSchema.parse(value);

        // Call the login mutation
        await loginUser({
          email: validatedData.email,
          password: validatedData.password,
        });
      } catch (err) {
        // Handle validation errors from Zod
        if (err instanceof z.ZodError) {
          const issues = err.issues;
          const errorMessage = issues[0]?.message || "Validation failed";
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setError(errorMessage);
          }
          // Show validation error toast
          toast.error("Validation Error", {
            description: errorMessage,
          });
        }
        // Handle API errors from loginUser (these are already handled in onError callback)
        else if (err && typeof err === 'object' && 'message' in err) {
          // Error already displayed via onError callback, just update state
          const apiError = err as ApiError;
          const errorMessage = typeof apiError.message === 'string'
            ? apiError.message
            : "Sign-in failed. Please check your credentials and try again.";
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setError(errorMessage);
          }
        }
        // Handle any other unexpected errors
        else {
          const errorMessage = "An unexpected error occurred. Please try again.";
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setError(errorMessage);
          }
          toast.error("Unexpected Error", {
            description: errorMessage,
          });
        }
      }
    },
  });

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary p-5 animate-in fade-in duration-500'>
      <Card className='w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500'>
        <CardHeader className='text-center space-y-2'>
          <CardTitle className='text-2xl font-bold'>
            Sign In to Qualia
          </CardTitle>
          <CardDescription className='text-base'>
            Welcome back! Please enter your credentials.
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

            {formFields.map((fieldConfig) => (
              <form.Field
                key={fieldConfig.name}
                name={fieldConfig.name}
                validators={{
                  onChange: ({ value }) => {
                    const result = fieldConfig.validator.safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0]?.message;
                  },
                }}
              >
                {(field) => (
                  <div className='space-y-2'>
                    <Label htmlFor={fieldConfig.name}>
                      {fieldConfig.label}
                    </Label>
                    <Input
                      type={fieldConfig.type}
                      id={fieldConfig.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        // Clear page-level error when user starts editing
                        if (error) setError("");
                      }}
                      placeholder={fieldConfig.placeholder}
                      autoComplete={fieldConfig.autoComplete}
                      disabled={isPending}
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
            ))}

            <div className='flex justify-end'>
              <Link
                to='/forgot-password'
                className='text-sm text-primary hover:underline underline-offset-4 transition-colors'
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type='submit'
              disabled={isPending}
              className='w-full h-10'
              aria-label={isPending ? "Signing in..." : "Sign In"}
            >
              {isPending ? (
                <>
                  <Spinner />
                  <span className='ml-2'>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Don't have an account?{" "}
            <Link
              to='/register'
              className='text-primary font-medium hover:underline underline-offset-4 transition-colors'
            >
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignIn;
