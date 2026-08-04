import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { studioProfileQuery } from "@/lib/studio";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { data: profile } = useQuery(studioProfileQuery);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="shell">
        <div
          className={cn(
            "flex items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 md:px-5",
            scrolled ? "glass-strong shadow-[var(--shadow-md)]" : "glass",
          )}
        >
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-display text-lg tracking-[0.24em] uppercase text-brand-gradient md:text-xl">
              {profile?.studio_name ?? "GK Digital Studios"}
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="group relative py-1 text-[0.7rem] uppercase tracking-[0.22em] text-foreground/75 transition-colors hover:text-brand data-[status=active]:text-brand"
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-brand transition-all duration-300 ease-[var(--ease-silk)] group-hover:w-full group-data-[status=active]:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <Link
              to="/contact"
              className="btn-base btn-brand hidden !rounded-full !px-5 !py-2 text-[0.68rem] uppercase tracking-[0.2em] md:inline-flex"
            >
              Book a date
            </Link>
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="rounded-full p-1.5 text-foreground transition-colors hover:bg-surface-2 md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong mt-2 flex flex-col gap-1 rounded-3xl p-3 shadow-[var(--shadow-lg)] md:hidden"
            >
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: l.to === "/" }}
                  className="rounded-2xl px-4 py-3 text-sm uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-accent hover:text-brand data-[status=active]:bg-accent data-[status=active]:text-brand"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="btn-base btn-brand mt-1 !rounded-2xl text-[0.7rem] uppercase tracking-[0.2em]"
              >
                Book a date
              </Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
