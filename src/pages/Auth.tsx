import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Zap, Mail, Lock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/dashboard");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google login failed");
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center section-dark overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative z-10 text-center px-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glow-button">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">Resumiq</h2>
          <p className="mt-4 text-muted-foreground max-w-sm mx-auto">AI-powered interview preparation that adapts to your resume and target role.</p>
        </motion.div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <h1 className="font-heading text-2xl font-bold text-foreground">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{isSignup ? "Start preparing for your interviews" : "Continue your interview prep"}</p>

          <Button onClick={handleGoogleLogin} variant="outline" className="w-full mt-8 rounded-xl py-6 border-border/50 text-foreground hover:bg-muted/50">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-border/50" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="input-glow flex items-center gap-3 px-4 py-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" required />
              </div>
            )}
            <div className="input-glow flex items-center gap-3 px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" required />
            </div>
            <div className="input-glow flex items-center gap-3 px-4 py-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full glow-button rounded-xl py-6 text-sm font-semibold text-primary-foreground">
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignup(!isSignup)} className="text-primary hover:underline font-medium">
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
