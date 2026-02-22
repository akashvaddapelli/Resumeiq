import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
      if (session) navigate("/setup");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/setup");
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

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center section-dark overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-12"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glow-button">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">Intervu</h2>
          <p className="mt-4 text-muted-foreground max-w-sm mx-auto">
            AI-powered interview preparation that adapts to your resume and target role.
          </p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "Start preparing for your interviews" : "Continue your interview prep"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <div className="input-glow flex items-center gap-3 px-4 py-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  required
                />
              </div>
            )}
            <div className="input-glow flex items-center gap-3 px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                required
              />
            </div>
            <div className="input-glow flex items-center gap-3 px-4 py-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full glow-button rounded-xl py-6 text-sm font-semibold text-primary-foreground"
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary hover:underline font-medium"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
