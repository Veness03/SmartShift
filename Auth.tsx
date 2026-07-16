import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui";
import { useStore } from "./store";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, signup, currentUser } = useStore();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (!url || url.trim() === '' || url === 'https://mock-project.supabase.co' || url.includes('mock')) {
        throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Settings menu.");
      }
      if (isLogin) {
        await login(email, password);
        navigate("/dashboard");
      } else {
        const data = await signup(email, password, name, 'admin');
        if (data?.user && data?.session === null) {
          setSuccess("Account created successfully! Please check your email to confirm your account.");
          setIsLogin(true);
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message === 'Invalid path specified in request URL' || err.message.includes('Invalid URL')) {
        setError(`The Supabase URL you entered seems to be invalid. Please make sure it is the full URL (e.g., https://your-project.supabase.co). Current value: "${import.meta.env.VITE_SUPABASE_URL}"`);
      } else if (err.message.includes('mock-project')) {
        setError("Supabase keys are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings.");
      } else if (err.message === 'Invalid login credentials') {
        setError("Invalid email or password. If you haven't created an account yet, please sign up first.");
      } else if (err.message === 'Email not confirmed') {
        setError("Please check your email to confirm your account before logging in. (Or disable Email Confirmations in your Supabase Auth settings).");
      } else if (err.message === 'Failed to fetch') {
        setError("Failed to connect to Supabase. Your project might be paused, the URL might be incorrect, or there's a network/CORS issue. Check VITE_SUPABASE_URL in Settings.");
        setError("Please check your email to confirm your account before logging in. (Or disable Email Confirmations in your Supabase Auth settings).");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-md"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "Enter your credentials to access your account" : "Enter your details to get started"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2 text-left">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required={!isLogin} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </div>
            )}
            {!isLogin && (
              <div className="space-y-2 text-left">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value="Admin (Staff accounts are created in the Dashboard)" disabled />
              </div>
            )}
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} />
            </div>
            
            {success && (
              <div className="p-3 text-sm rounded-md bg-green-500/15 text-green-600 text-center font-medium">
                {success}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 text-center font-medium">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex gap-2">
              
              <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </div>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-primary hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
