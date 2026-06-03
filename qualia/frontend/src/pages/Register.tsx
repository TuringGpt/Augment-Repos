import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { EyeOn, EyeOff } from "lucide-react";
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
import { useRegister } from "@/hooks/useRegister";
import type { ApiError } from "@/lib/axios";

// Zod schema for registration form validation
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please try again.",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Input field configuration map for standard fields
const formFields = [
  {
    name: "email" as const,
    label: "Email",
    type: "email" as const,
    placeholder: "Enter your email",
    autoComplete: "username",
    validator: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" }),
  },
  {
    name: "password" as const,
    label: "Password",
    type: "password" as const,
    placeholder: "Create a password (min. 8 characters)",
    autoComplete: "new-password",
    validator: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
  },
] as const;

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Synchronous ref to prevent double-submit race condition
  // isPending is async (waits for React re-render), so we need a ref for immediate checking
  const isSubmittingRef = useRef<boolean>(false);

  // Track mount state to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Track redirect timeout to allow cleanup on unmount
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear any pending redirect timeout on unmount
      if (redirectTimeoutRef.current !== null) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  // Use the TanStack Query mutation hook with mutateAsync for proper async handling
  const { mutateAsync: registerUser, isPending } = useRegister({
    onSuccess: (data) => {
      // Development-only logging (gated to prevent PII leakage in production)
      if (import.meta.env.DEV) {
        console.log("Registration successful for:", data);
      }

      // Show success toast notification
      toast.success("Account created successfully!", {
        description: "Redirecting to sign in page...",
      });

      // Delay redirect slightly to allow toast to be seen
      // Guard inside timeout to prevent redirect if component unmounts during delay
      redirectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          navigate("/signin");
        }
      }, 1500);
    },
    onError: (err: ApiError) => {
      // Show error toast notification
      const errorMessage = err.message || "Registration failed. Please try again.";
      toast.error("Registration failed", {
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
      confirmPassword: "",
    } as RegisterFormData,
    onSubmit: async ({ value }) => {
      // Guard against double-submit using synchronous ref check
      // This prevents race condition where two rapid clicks both see isPending=false
      if (isSubmittingRef.current) return;
      if (isPending) return;

      // Set synchronous flag immediately to block concurrent submissions
      isSubmittingRef.current = true;

      setError("");

      try {
        // Validate with Zod
        const validatedData = registerSchema.parse(value);

        // Await the register mutation
        await registerUser({
          email: validatedData.email,
          password: validatedData.password,
        });
      } catch (err) {
        // Only update state if component is still mounted
        if (!isMountedRef.current) return;

        // Handle validation errors from Zod
        if (err instanceof z.ZodError) {
          const issues = err.issues;
          const errorMessage = issues[0]?.message || "Validation failed";
          setError(errorMessage);
          // Show validation error toast
          toast.error("Validation Error", {
            description: errorMessage,
          });
        }
        // Handle API errors from registerUser (these are already handled in onError callback)
        else if (err && typeof err === 'object' && 'message' in err) {
          // Error already displayed via onError callback, just update state
          const apiError = err as ApiError;
          const errorMessage = typeof apiError.message === 'string'
            ? apiError.message
            : "Registration failed. Please try again.";
          setError(errorMessage);
        }
        // Handle any other unexpected errors
        else {
          const errorMessage = "An unexpected error occurred. Please try again.";
          setError(errorMessage);
          toast.error("Unexpected Error", {
            description: errorMessage,
          });
        }

        // Don't re-throw: error state is already set for user feedback,
        // and re-throwing would cause an unhandled promise rejection in form.handleSubmit()
      } finally {
        // Reset synchronous flag when submission completes (success or error)
        isSubmittingRef.current = false;
      }
    },
  });

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary p-5 animate-in fade-in duration-500'>
      <Card className='w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500'>
        <CardHeader className='text-center space-y-2'>
          <CardTitle className='text-2xl font-bold'>
            Create Your Account
          </CardTitle>
          <CardDescription className='text-base'>
            Join Qualia and start transforming your QA workflow.
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
                {(field) => {
                  const isPasswordField = fieldConfig.type === "password";
                  const inputType = isPasswordField && showPassword ? "text" : fieldConfig.type;

                  return (
                    <div className='space-y-2'>
                      <Label htmlFor={fieldConfig.name}>
                        {fieldConfig.label}
                      </Label>
                      <div className='relative'>
                        <Input
                          type={inputType}
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
                          className={isPasswordField ? 'h-10 pr-10' : 'h-10'}
                        />
                        {isPasswordField && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-0 top-0 h-10 px-3 text-muted-foreground hover:text-foreground transition-colors'
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </button>
                        )}
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className='text-sm text-destructive'>
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.Field>
            ))}

            {/* Confirm Password field with cross-field validation */}
            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["password"],
                onChange: ({ value, fieldApi }) => {
                  const passwordValue = fieldApi.form.getFieldValue("password");
                  const fieldMeta = fieldApi.state.meta;

                  // Only show "required" error if field has been touched/blurred or has a value
                  if (!value || value.length === 0) {
                    // Don't show error if user hasn't interacted with the field yet
                    if (!fieldMeta.isTouched && !value) {
                      return undefined;
                    }
                    return "Please confirm your password";
                  }

                  // Check if passwords match
                  if (passwordValue && value !== passwordValue) {
                    return "Passwords do not match. Please try again.";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor="confirmPassword">
                    Confirm Password
                  </Label>
                  <div className='relative'>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        // Clear page-level error when user starts editing
                        if (error) setError("");
                      }}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      disabled={isPending}
                      className='h-10 pr-10'
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='absolute right-0 top-0 h-10 px-3 text-muted-foreground hover:text-foreground transition-colors'
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
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
              disabled={isPending}
              className='w-full h-10'
              aria-label={isPending ? "Creating account..." : "Create Account"}
            >
              {isPending ? (
                <>
                  <Spinner />
                  <span className='ml-2'>Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Already have an account?{" "}
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

export default Register;
