import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Camera, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio Sign In — GK Digital Studios" },
      {
        name: "description",
        content: "Secure sign-in for the GK Digital Studios admin dashboard.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Studio Sign In — GK Digital Studios" },
      { property: "og:description", content: "Secure sign-in for studio staff." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.login({ email, password });
      toast.success("Welcome back to GK Digital Studios");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Top Header Navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 lg:px-12">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Studio</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6 py-8 lg:px-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Branding Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center lg:col-span-6 space-y-8"
          >
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-1.5 shadow-sm w-fit">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="size-4" />
              </div>
              <span className="font-display text-sm font-semibold tracking-wider uppercase text-foreground">
                GK Digital Studios
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Every frame, <br />
                <span className="text-muted-foreground">
                  beautifully delivered.
                </span>
              </h1>
              <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
                Manage client galleries, proofing, media delivery, and portfolio assets from one elegant, centralized workspace.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                <ShieldCheck className="size-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Private Client Portals</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Secure passcode & token authorization</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                <Sparkles className="size-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">AWS S3 Cloud Delivery</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Instant high-res media distribution</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Authentication Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="flex items-center justify-center lg:col-span-6 lg:justify-end"
          >
            <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-xl transition-all">
              
              {/* Card Title */}
              <div className="space-y-2 text-left">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Studio Sign In
                </h2>
                <p className="text-sm text-muted-foreground">
                  Access to the workspace is restricted to studio staff.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="studio@gkdigitalstudios.com"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="relative mt-2 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in to Dashboard"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GK Digital Studios. All rights reserved.
      </footer>
    </div>
  );
}


