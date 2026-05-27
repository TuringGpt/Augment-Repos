import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
} from "@/components/ui/cards";
import { Spinner } from "@/component/ui/spinner";

interface SignInFormData {
  email: string;
  password: string;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  role: "admin" | "reviewer" | "viewer";
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
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    // TODO: Add submit action
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
          <form onSubmit={handleSubmit} className='space-y-5'>
            {error && (
              <div
                className='rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300'
                role='alert'
              >
                {error}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder='Enter your username'
                autoComplete='email'
                disabled={isLoading}
                className='h-10'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder='Confirm your password'
                autoComplete='current-password'
                disabled={isLoading}
                className='h-10'
              />
            </div>

            <div className='flex justify-end'>
              <Link
                to='/forgot-password'
                className='text-sm text-primary hover:underline underline-offset-4 transition-colors'
              >
                Forgot password?
              </Link>
            </div>

            <Button type='submit' disabled={isLoading} className='w-full h-10'>
              {isLoading ? <Spinner /> : "Sign In"}
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
