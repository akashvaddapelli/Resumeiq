import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const History = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      const { data: sessionsData } = await supabase.from("sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const s = sessionsData || [];

      // Get question counts for each session
      const enriched = await Promise.all(s.map(async (session) => {
        const { count: totalQ } = await supabase.from("questions").select("*", { count: "exact", head: true }).eq("session_id", session.id);
        const { count: practicedQ } = await supabase.from("questions").select("*", { count: "exact", head: true }).eq("session_id", session.id).eq("is_practiced", true);
        return { ...session, totalQuestions: totalQ || 0, practicedQuestions: practicedQ || 0 };
      }));

      setSessions(enriched);
      setLoading(false);
    };
    fetchSessions();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto max-w-3xl px-4 pt-24 flex justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground">Session History</h1>
          <p className="mt-2 text-muted-foreground">{sessions.length} sessions</p>
        </motion.div>

        {sessions.length === 0 ? (
          <div className="mt-12 glass-card p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-heading text-xl font-semibold text-foreground">No sessions yet</h3>
            <p className="mt-2 text-muted-foreground">Start your first interview prep session.</p>
            <Link to="/setup" className="mt-6 inline-block">
              <Button className="glow-button rounded-xl px-8 py-6 text-primary-foreground">Start New Session</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {sessions.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/questions?session=${s.id}`} className="glass-card-hover flex items-center justify-between p-5 block">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.job_description_interpreted || s.job_description_raw || "Session"}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">{s.totalQuestions} questions</span>
                      <span className="text-xs text-primary">{s.practicedQuestions} practiced</span>
                    </div>
                  </div>
                  {s.ats_score != null && (
                    <span className={`font-heading text-xl font-bold ${s.ats_score >= 70 ? "text-primary" : s.ats_score >= 40 ? "text-yellow-400" : "text-destructive"}`}>
                      {s.ats_score}%
                    </span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
