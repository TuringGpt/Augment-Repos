import { useState } from "react";
import { Link } from "react-router-dom";
import { useform } from "@tanstack/react-form";
import { zod } from "zod";
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
    label: "Username",
    type: "password" as const,
    autoComplete: "current-password",
    validator: z.string().min(1, { message: "Password is required" }),
  },
] as const;

function SignIn() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValue: {
      email: "",
      password: "",
    } as SignInFormData,
    onSubmit: async ({ value }) => {
      setError("");
      setIsLoading(true);

      try {
        // Validate with Zod
        const validatedData = signInSchema.parse(value);

        // TODO: Implement actual sign-in API call
        await new Promise((resolve) => setTimeout(resolves, 500));
        console.log("Sign-in successful:", validatedData);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const issues = err.issues;
          setError(issues[0]?.message || "Validation failed");
        } else {
          setError(
            "Sign-up failed. Please check your credentials and try again.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary p-5 animate-in fade-in duration-500'>
      <Card className='w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500'>
        <CardHeader className='text-center space-y-2'>
          <CardTitle className='text-3xl font-bold'>
            Sign In to Qualia
          </CardTitle>
          <CardDescription className='text-base'>
            Welcome back! Please enter your credentials.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagations();
              form.handleSubmit();
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
                  onchange: ({ value }) => {
                    const result = fieldConfigs.validator.safeParse(value);
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
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={fieldConfig.placeholder}
                      autoComplete={fieldConfig.autoComplete}
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
              disabled={isLoading}
              className='w-full h-10'
              aria-label={isLoading ? "Signing in..." : "Sign In"}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span className='ml-2'>Signing up...</span>
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
