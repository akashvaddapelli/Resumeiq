import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Plus, Calendar, TrendingUp, Award, BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["hsl(155,100%,50%)", "hsl(190,100%,50%)", "hsl(45,100%,60%)", "hsl(280,60%,60%)"];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [practicedCount, setPracticedCount] = useState(0);
  const [bestAts, setBestAts] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [profileRes, streakRes, sessionsRes, questionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("streaks").select("*").eq("user_id", user.id).single(),
        supabase.from("sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("questions").select("*").eq("user_id", user.id),
      ]);

      setProfile(profileRes.data);
      setStreak(streakRes.data);
      const s = sessionsRes.data || [];
      setSessions(s);

      const practiced = (questionsRes.data || []).filter((q: any) => q.is_practiced).length;
      setPracticedCount(practiced);

      if (s.length > 0) {
        setBestAts(Math.max(...s.filter((x: any) => x.ats_score != null).map((x: any) => x.ats_score), 0));
        setChartData(s.filter((x: any) => x.ats_score != null).reverse().map((x: any, i: number) => ({
          session: `S${i + 1}`,
          score: x.ats_score,
        })));

        // Category breakdown
        const cats: Record<string, number> = {};
        (questionsRes.data || []).filter((q: any) => q.is_practiced).forEach((q: any) => {
          cats[q.category] = (cats[q.category] || 0) + 1;
        });
        setCategoryData(Object.entries(cats).map(([name, value]) => ({ name, value })));
      }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 pt-24">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-24 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const userName = profile?.full_name || user?.user_metadata?.full_name || "there";
  const currentStreak = streak?.current_streak || 0;
  const totalSessions = sessions.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                {totalSessions > 0 ? `Welcome back, ${userName} 👋` : `Welcome, ${userName} 👋`}
              </h1>
              <p className="mt-1 text-muted-foreground">{today}</p>
            </div>
            <Link to="/setup">
              <Button className="glow-button rounded-xl text-sm font-semibold text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> New Session
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center">
              {currentStreak > 0 ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-2xl mb-1">🔥</motion.div>
              ) : (
                <Flame className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
              )}
              <p className="font-heading text-2xl font-bold text-foreground">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Calendar className="mx-auto h-6 w-6 text-secondary mb-2" />
              <p className="font-heading text-2xl font-bold text-foreground">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="glass-card p-5 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-primary mb-2" />
              <p className="font-heading text-2xl font-bold text-foreground">{practicedCount}</p>
              <p className="text-xs text-muted-foreground">Practiced</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Award className="mx-auto h-6 w-6 text-yellow-400 mb-2" />
              <p className="font-heading text-2xl font-bold text-foreground">{bestAts !== null && bestAts > 0 ? `${bestAts}%` : "—"}</p>
              <p className="text-xs text-muted-foreground">Best ATS</p>
            </div>
          </div>

          {totalSessions === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-12 glass-card p-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-heading text-xl font-semibold text-foreground">You haven't started any sessions yet</h3>
              <p className="mt-2 text-muted-foreground">Start your first session to see your progress here.</p>
              <Link to="/setup" className="mt-6 inline-block">
                <Button className="glow-button rounded-xl px-8 py-6 text-base font-semibold text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" /> Start New Session
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Recent Sessions */}
              <div className="mt-8">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/questions?session=${s.id}`} className="glass-card-hover flex items-center justify-between p-4 block">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.job_description_interpreted || s.job_description_raw || "Session"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                        {s.ats_score != null && (
                          <span className={`font-heading text-lg font-bold ${s.ats_score >= 70 ? "text-primary" : s.ats_score >= 40 ? "text-yellow-400" : "text-destructive"}`}>
                            {s.ats_score}%
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Charts - only show when enough data */}
              {chartData.length >= 2 && (
                <div className="mt-8 glass-card p-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-4">ATS Score Over Sessions</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="session" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(240 15% 8%)", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(155,100%,50%)" strokeWidth={2} dot={false} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {categoryData.length > 0 && (
                <div className="mt-6 glass-card p-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Categories Practiced</h3>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" animationDuration={1200}>
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="ml-6 space-y-2">
                      {categoryData.map((c, i) => (
                        <div key={c.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm text-muted-foreground">{c.name} ({c.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
