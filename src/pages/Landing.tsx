import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Brain, Target, BarChart3, FileText, Mic, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Brain, title: "AI-Powered Questions", desc: "Personalized questions generated from your resume and job description" },
  { icon: Target, title: "Smart JD Parsing", desc: "Understands any input — from formal JDs to casual descriptions" },
  { icon: Mic, title: "Practice Mode", desc: "Type or voice answers with optional countdown timer" },
  { icon: BarChart3, title: "Progress Tracking", desc: "Streaks, session history, and improvement graphs" },
  { icon: Shield, title: "ATS Score Check", desc: "See how well your resume matches the role" },
  { icon: FileText, title: "Export & Share", desc: "Download as PDF or share via link" },
];

const steps = [
  { num: "01", title: "Upload & Describe", desc: "Upload your resume and describe the role you're targeting" },
  { num: "02", title: "Practice", desc: "Answer AI-generated questions with real-time feedback" },
  { num: "03", title: "Improve", desc: "Track your progress and ace your interview" },
];

const Landing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Interview Prep
          </div>
          <h1 className="font-heading text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-foreground">Ace Your Next</span><br />
            <span className="gradient-text">IT Interview</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
            Upload your resume, describe your role, and get personalized interview questions powered by AI.
          </p>
          <div className="mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="glow-button rounded-xl px-8 text-base font-semibold text-primary-foreground">
                <Zap className="mr-2 h-4 w-4" /> Get Started Free
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    <section id="features" className="section-dark py-24">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need to <span className="gradient-text">prepare</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-muted-foreground">From resume analysis to mock interviews — all powered by AI.</motion.p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="glass-card-hover p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center font-heading text-3xl font-bold text-foreground sm:text-4xl mb-16">
          How it <span className="gradient-text">works</span>
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1} variants={fadeUp} className="glass-card p-8 text-center">
              <div className="mb-4 font-heading text-4xl font-extrabold gradient-text">{s.num}</div>
              <h3 className="font-heading text-xl font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-dark py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Ready to ace your next interview?</motion.h2>
          <motion.div variants={fadeUp} custom={1} className="mt-8">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="glow-button rounded-xl px-10 text-base font-semibold text-primary-foreground">Get Started — It's Free</Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>

    <footer className="border-t border-border/50 py-8">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">Resumiq</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Resumiq. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default Landing;
