import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
import { ROUTES } from "@/config/routes";

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const isMountedRef = useRef(true);
  const navigationTimerRef = useRef<number | null>(null);

  /**
   * Validates that a redirect path is safe for internal navigation
   * Only allows relative paths that start with "/" to prevent:
   * - Cross-origin navigation (absolute URLs)
   * - Protocol handlers (javascript:, data:, etc.)
   * - Unexpected navigation errors
   *
   * Allows query strings and hash fragments (e.g., /path?query=value#hash)
   *
   * @param path - The path to validate
   * @returns true if the path is a valid internal path, false otherwise
   */
  const isValidInternalPath = (path: string): boolean => {
    // Must be a non-empty string
    if (!path || typeof path !== 'string') {
      return false;
    }

    // Must start with "/" to be a relative path
    if (!path.startsWith('/')) {
      return false;
    }

    // Must not contain "//" which could indicate absolute URL or protocol-relative URL
    if (path.includes('//')) {
      return false;
    }

    // Check for protocol handlers (e.g., http://, https://, javascript:, data:)
    // Only check the portion before any query string or hash to allow colons in those parts
    const pathBeforeQueryOrHash = path.split(/[?#]/)[0];
    if (pathBeforeQueryOrHash.includes(':')) {
      return false;
    }

    return true;
  };

  // Determine redirect destination after successful login
  // Priority: 1. Query param (?redirect=...), 2. Location state (from ProtectedRoute), 3. Default to dashboard
  const getRedirectPath = (): string => {
    // Check for redirect query parameter
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && isValidInternalPath(redirectParam)) {
      return redirectParam;
    }

    // Check for location state from ProtectedRoute
    // Preserve full path including query parameters and hash fragments
    const locationState = location.state as { from?: { pathname: string; search: string; hash: string } } | null;
    if (locationState?.from?.pathname) {
      const fullPath = locationState.from.pathname + (locationState.from.search || '') + (locationState.from.hash || '');
      if (isValidInternalPath(fullPath)) {
        return fullPath;
      }
    }

    // Default to dashboard
    return ROUTES.DASHBOARD;
  };

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
    onSuccess: () => {
      // Development-only logging (gated to prevent PII leakage in production)
      if (import.meta.env.DEV) {
        console.log("Login successful");
      }

      const redirectPath = getRedirectPath();

      // Show success toast notification
      toast.success("Login successful!", {
        description: redirectPath === ROUTES.DASHBOARD
          ? "Redirecting to dashboard..."
          : "Redirecting...",
      });

      // Redirect to the intended destination after successful login
      // Small delay to allow toast to be visible
      // Clear any existing timeout before scheduling a new one
      if (navigationTimerRef.current !== null) {
        clearTimeout(navigationTimerRef.current);
      }
      navigationTimerRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          navigate(redirectPath, { replace: true });
        }
      }, 500);
    },
    onError: (err: unknown) => {
      // React Query mutation errors are typed as unknown
      // Use type guards to safely extract error messages
      let errorMessage: string;

      // Check if it's an Error instance (plain Error from token storage failure)
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      // Check if it's an object with a message property (ApiError from API call)
      else if (err && typeof err === 'object' && 'message' in err) {
        const message = (err as { message: unknown }).message;
        errorMessage = typeof message === 'string'
          ? message
          : "Sign-in failed. Please check your credentials and try again.";
      }
      // Fallback for unexpected error shapes
      else {
        errorMessage = "Sign-in failed. Please check your credentials and try again.";
      }

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
        // Note: All errors from loginUser (ApiError, Error, etc.) are handled
        // by the mutation's onError callback to avoid duplicate error handling
        await loginUser({
          email: validatedData.email,
          password: validatedData.password,
        });
      } catch (err) {
        // Only handle Zod validation errors here
        // All other errors from loginUser are already handled by the mutation's onError callback
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
        // If it's not a ZodError, it came from the mutation and was already handled by onError
        // We don't need to do anything here to avoid duplicate toasts
      }
    },
  });

  return (
    <>
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
    </>
  );
}

export default SignIn;
