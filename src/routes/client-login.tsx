import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/client-login")({
  head: () => ({
    meta: [
      { title: "Client Gallery Sign In — GK Digital Studios" },
      {
        name: "description",
        content: "Access your private photography gallery and image selection portal.",
      },
      { property: "og:title", content: "Client Gallery Sign In — GK Digital Studios" },
      { property: "og:description", content: "Access your private photography gallery." },
    ],
  }),
  component: ClientLoginPage,
});

function ClientLoginPage() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = tokenInput.trim();
    if (!input) {
      toast.error("Please enter your gallery access token or link.");
      return;
    }

    setBusy(true);

    // Extract token if full URL is pasted (e.g. https://domain.com/gallery/ABC12345 -> ABC12345)
    let token = input;
    if (input.includes("/gallery/")) {
      const parts = input.split("/gallery/")[1] || "";
      token = (parts.split("?")[0] || "").split("#")[0] || input;
    } else if (input.includes("/")) {
      token = input.split("/").pop() || input;
    }

    token = token.trim();

    if (!token) {
      toast.error("Invalid gallery token format.");
      setBusy(false);
      return;
    }

    toast.success("Opening client gallery portal...");
    navigate({ to: `/gallery/${token}` });
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Top Header Navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 lg:px-12">
        <Link
          to="/"
          preload={false}
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
          {/* Left Information Section */}
          <div className="flex flex-col justify-center lg:col-span-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-1.5 shadow-sm w-fit">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <KeyRound className="size-4" />
              </div>
              <span className="font-display text-sm font-semibold tracking-wider uppercase text-foreground">
                Client Portal Access
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Your memories, <br />
                <span className="text-muted-foreground">
                  privately delivered.
                </span>
              </h1>
              <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
                Enter your unique gallery token or passcode link provided by the studio to view your high-resolution collection and make image selections.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                <ShieldCheck className="size-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Passcode Protected</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Encrypted private access per client</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                <Sparkles className="size-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Proofing &amp; Selection</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Select favorite photos for final editing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Access Token Card */}
          <div className="flex items-center justify-center lg:col-span-6 lg:justify-end animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-xl transition-all">
              {/* Card Title */}
              <div className="space-y-2 text-left">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Client Gallery Sign In
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your gallery link or access code below.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="tokenInput">
                    Gallery Code or Link
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="tokenInput"
                      type="text"
                      required
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="e.g. paste your gallery link"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="relative mt-2 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                      Opening Gallery...
                    </span>
                  ) : (
                    "Open Client Gallery"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GK Digital Studios. All rights reserved.
      </footer>
    </div>
  );
}
