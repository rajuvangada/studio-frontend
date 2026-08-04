import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Images, MessageSquare, Sparkles, Users } from "lucide-react";

import { api } from "@/lib/api";
import { formatDate } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      try {
        const statsData = await api.getDashboardStats();
        return {
          stats: statsData?.stats ?? { totalClients: 0, activeProjects: 0, deliveredProjects: 0, newInquiries: 0, pendingSubmissions: 0 },
          clients: statsData?.clients ?? [],
          inquiries: statsData?.inquiries ?? [],
          portfolio: statsData?.portfolio ?? [],
          activity: statsData?.activity ?? [],
        };
      } catch {
        return {
          stats: { totalClients: 0, activeProjects: 0, deliveredProjects: 0, newInquiries: 0, pendingSubmissions: 0 },
          clients: [],
          inquiries: [],
          portfolio: [],
          activity: [],
        };
      }
    },
  });

  const stats = [
    { label: "Total Clients", value: data?.stats.totalClients ?? data?.clients.length ?? 0, to: "/admin/clients", icon: Users },
    {
      label: "Active Projects",
      value: data?.stats.activeProjects ?? (data?.clients ?? []).filter((c) => c.status !== "archived").length,
      to: "/admin/clients",
      icon: Sparkles,
    },
    {
      label: "New Inquiries",
      value: data?.stats.newInquiries ?? (data?.inquiries ?? []).filter((i) => i.status === "new").length,
      to: "/admin/inquiries",
      icon: MessageSquare,
    },
    {
      label: "Published Showcase",
      value: (data?.portfolio ?? []).filter((p) => p.published !== false).length,
      to: "/admin/portfolio",
      icon: Images,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Studio Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time snapshot of clients, projects, inquiries, and published portfolio from MongoDB Atlas.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-surface p-5">
                <span className="skeleton block h-3 w-20" />
                <span className="skeleton mt-4 block h-8 w-14" />
              </div>
            ))
          : stats.map((s) => (
              <Link key={s.label} to={s.to} className="card-surface card-interactive block p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {s.label}
                  </p>
                  <s.icon className="size-4 text-brand" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {s.value}
                </p>
              </Link>
            ))}
      </div>

      <section className="card-surface mt-6 p-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Recent Activity Log
        </p>
        {isLoading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="skeleton block h-4 w-full" />
            ))}
          </div>
        ) : (data?.activity ?? []).length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <CalendarClock className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Activity from client galleries and inquiries will log here automatically.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data?.activity.map((a) => (
              <li key={a.id || a._id} className="flex items-start justify-between gap-6 py-3 text-sm">
                <span className="text-foreground">{a.description || a.type || a.event_type}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(a.createdAt || a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
