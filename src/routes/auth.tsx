import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";

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
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--color-brand)_18%,transparent),transparent_60%)]" />
        <Link to="/" className="relative eyebrow">
          GK Digital Studios
        </Link>
        <div className="relative">
          <p className="font-display text-4xl leading-tight text-foreground">
            Every frame,
            <br />
            beautifully delivered.
          </p>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Sign in to manage clients, galleries, and deliverables from one refined dashboard.
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} GK Digital Studios
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="card-surface w-full max-w-md rounded-3xl p-10 shadow-[var(--shadow-lg)]"
        >
          <Link to="/" className="eyebrow lg:hidden">
            ← GK Digital Studios
          </Link>
          <h1 className="mt-6 font-display text-3xl text-foreground lg:mt-0">Studio sign in</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Access to the dashboard is restricted to studio staff.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="field">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-base btn-brand w-full">
              {busy ? "Please wait…" : "Sign in"}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
