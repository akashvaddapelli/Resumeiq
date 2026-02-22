import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Plus, Calendar, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

const mockChartData = [
  { day: "Mon", score: 45 },
  { day: "Tue", score: 52 },
  { day: "Wed", score: 58 },
  { day: "Thu", score: 65 },
  { day: "Fri", score: 72 },
  { day: "Sat", score: 70 },
  { day: "Sun", score: 78 },
];

const categoryData = [
  { name: "Technical", value: 40 },
  { name: "Behavioral", value: 30 },
  { name: "HR", value: 15 },
  { name: "Situational", value: 15 },
];

const COLORS = ["hsl(155,100%,50%)", "hsl(190,100%,50%)", "hsl(45,100%,60%)", "hsl(280,60%,60%)"];

const Dashboard = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.user_metadata?.full_name || "there");
    });
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Hey, {userName} 👋</h1>
              <p className="mt-1 text-muted-foreground">{today}</p>
            </div>
            <Link to="/setup">
              <Button className="glow-button rounded-xl text-sm font-semibold text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> New Session
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-3xl mb-1"
              >
                🔥
              </motion.div>
              <p className="font-heading text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </motion.div>
            <div className="glass-card p-5 text-center">
              <Calendar className="mx-auto h-6 w-6 text-secondary mb-2" />
              <p className="font-heading text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="glass-card p-5 text-center">
              <TrendingUp className="mx-auto h-6 w-6 text-primary mb-2" />
              <p className="font-heading text-2xl font-bold text-foreground">78%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>

          {/* Improvement Chart */}
          <div className="mt-8 glass-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Improvement Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mockChartData}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(240,15%,8%)", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(155,100%,50%)" strokeWidth={2} dot={false} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="mt-6 glass-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Categories Practiced</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" animationDuration={1200}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(240,15%,8%)", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="ml-6 space-y-2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
