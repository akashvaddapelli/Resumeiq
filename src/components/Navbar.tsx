import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg glow-button">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">Resumiq</span>
        </Link>

        {isLanding ? (
          <>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it Works</a>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="glow-button rounded-lg px-5 text-sm font-semibold text-primary-foreground">Get Started</Button>
              </Link>
            </div>
            <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Dashboard</Button>
            </Link>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">History</Button>
            </Link>
            <Link to="/setup">
              <Button size="sm" className="glow-button rounded-lg px-5 text-sm font-semibold text-primary-foreground">New Session</Button>
            </Link>
            {user && (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {open && isLanding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-3 p-4">
            <a href="#features" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>How it Works</a>
            <Link to="/auth" className="mt-2" onClick={() => setOpen(false)}>
              <Button className="w-full glow-button text-primary-foreground">Get Started</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
