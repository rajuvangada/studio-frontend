import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/clients", label: "Clients", icon: Users, exact: false },
  { to: "/admin/portfolio", label: "Portfolio", icon: Images, exact: false },
  { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare, exact: false },
  { to: "/admin/profile", label: "Studio profile", icon: Settings, exact: false },
] as const;

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      try {
        const res = await api.getMe();
        return Boolean(res?.user);
      } catch {
        return false;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await api.logout();
    navigate({ to: "/auth", replace: true });
  }

  const activeItem = nav.find((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to),
  );

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="skeleton size-4 rounded-full" />
          Loading studio…
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <div className="card-surface max-w-md p-10 text-center">
          <CalendarClock className="mx-auto size-5 text-brand" />
          <h1 className="mt-6 font-display text-2xl">Awaiting access</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This account isn't approved for the studio dashboard yet. Ask an existing admin to grant
            you access.
          </p>
          <button onClick={signOut} className="btn-base btn-secondary mt-8">
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </main>
    );
  }


  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link
          to="/"
          className="flex items-center gap-2 px-2 font-display text-xl text-sidebar-foreground"
        >
          GK<span className="text-brand">.</span>
          <span className="text-xs font-sans font-normal text-muted-foreground">Studio</span>
        </Link>
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>
        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-4">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="glass-strong absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <Link to="/" className="font-display text-xl text-sidebar-foreground">
                GK<span className="text-brand">.</span>
              </Link>
              <button onClick={() => setDrawerOpen(false)} className="btn-base btn-ghost !p-2">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="mt-auto space-y-1 border-t border-sidebar-border pt-4">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs text-muted-foreground">Appearance</span>
                <ThemeToggle />
              </div>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:text-destructive"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}


      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-base btn-ghost !p-2 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <p className="min-w-0 truncate text-sm font-medium text-foreground">
              {activeItem?.label ?? "Studio"}
            </p>
          </div>
          <ThemeToggle className="lg:hidden" />
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
