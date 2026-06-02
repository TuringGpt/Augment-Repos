import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  // Synchronous ref to prevent double-submit race condition
  // isPending is async (waits for React re-render), so we need a ref for immediate checking
  const isSubmittingRef = useRef<boolean>(false);

  // Use the TanStack Query mutation hook with mutateAsync for proper async handling
  const { mutateAsync: registerUser, isPending } = useRegister({
    onSuccess: (data) => {
      // Development-only logging (gated to prevent PII leakage in production)
      if (import.meta.env.DEV) {
        console.log("Registration successful for:", data);
      }

      // Redirect to sign in page immediately
      navigate("/signin");
    },
    onError: (err: ApiError) => {
      setError(
        err.message || "Registration failed. Please try again.",
      );
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
        if (err instanceof z.ZodError) {
          const issues = err.issues;
          setError(issues[0]?.message || "Validation failed");
        }
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

            {/* Confirm Password field with cross-field validation */}
            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["password"],
                onChange: ({ value, fieldApi }) => {
                  // First check if the field is empty
                  if (!value || value.length === 0) {
                    return "Please confirm your password";
                  }
                  // Then check if it matches the password field
                  const passwordValue = fieldApi.form.getFieldValue("password");
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
                  <Input
                    type="password"
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
