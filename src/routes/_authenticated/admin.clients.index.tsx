import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Filter, Plus, Search, Trash2, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { api, type ClientItem } from "@/lib/api";
import { formatDate } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/admin/clients/")({
  component: ClientsPage,
});

function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventName: "",
    eventDate: "",
    location: "",
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin", "clients"],
    queryFn: async () => {
      try {
        const data = await api.getClients();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Client name is required.");
      const res = await api.createClient({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        eventName: form.eventName.trim() || null,
        eventDate: form.eventDate ? form.eventDate : null,
        location: form.location.trim() || null,
      });
      return res.client;
    },
    onSuccess: (newClient) => {
      toast.success("Client workspace created successfully.");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", eventName: "", eventDate: "", location: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
      const newId = newClient.id || newClient._id;
      if (newId) {
        navigate({ to: "/admin/clients/$id", params: { id: newId } });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create client."),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.updateClient(id, { isActive });
    },
    onSuccess: () => {
      toast.success("Client status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeClient = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteClient(id);
    },
    onSuccess: () => {
      toast.success("Client deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Client filtering, sorting, pagination logic
  const filtered = clients.filter((c: ClientItem) => {
    const q = search.toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(q);
    const eventMatch = (c.eventName || c.event_name || "").toLowerCase().includes(q);
    const codeMatch = (c.projectCode || c.project_code || "").toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || eventMatch || codeMatch;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? c.isActive !== false : c.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage projects and private client galleries.
          </p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-base btn-primary">
          <Plus className="size-4" />
          New client
        </button>
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="card-surface mt-6 grid gap-4 p-6 md:grid-cols-2"
        >
          <div>
            <label className="field-label">Client name *</label>
            <Input
              required
              className="field"
              placeholder="Jane & Sam"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <Input
              type="email"
              className="field"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <Input
              className="field"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Event name</label>
            <Input
              className="field"
              placeholder="Destination Wedding"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Event date</label>
            <Input
              type="date"
              className="field"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Location</label>
            <Input
              className="field"
              placeholder="Taj Falaknuma, Hyderabad"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <button type="submit" disabled={create.isPending} className="btn-base btn-primary">
              {create.isPending ? "Creating client…" : "Create client workspace"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-base btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Controls: Search, Filter, Sort */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by client name, event or project code…"
            className="field pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> Filter:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="field !py-1 text-xs"
          >
            <option value="all">All Clients</option>
            <option value="pending">Pending</option>
            <option value="shooting">Shooting</option>
            <option value="editing">Editing</option>
            <option value="delivered">Delivered</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
            className="field !py-1 text-xs"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name">Sort: Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Event</th>
                <th>Date</th>
                <th>Project Code</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <span className="skeleton block h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <Users className="size-6 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">No clients found</p>
                      <p className="text-xs text-muted-foreground">
                        {search || statusFilter !== "all"
                          ? "Try adjusting your search or filters."
                          : "Create your first client project to get started."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => {
                  const clientId = c.id || c._id || "";
                  const eventName = c.eventName || c.event_name || "—";
                  const eventDate = c.eventDate || c.event_date;
                  const projectCode = c.projectCode || c.project_code || "—";
                  const active = c.isActive !== false;

                  return (
                    <tr key={clientId}>
                      <td>
                        <Link
                          to="/admin/clients/$id"
                          params={{ id: clientId }}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {c.name}
                        </Link>
                        {c.email && (
                          <span className="block text-xs text-muted-foreground">{c.email}</span>
                        )}
                      </td>
                      <td className="text-muted-foreground">{eventName}</td>
                      <td className="text-muted-foreground">{formatDate(eventDate)}</td>
                      <td className="font-mono text-xs text-muted-foreground">{projectCode}</td>
                      <td>
                        <span className="chip chip-brand">{c.status}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus.mutate({ id: clientId, isActive: !active })}
                            className="btn-base btn-ghost !p-1 text-xs"
                            title={active ? "Deactivate Client" : "Reactivate Client"}
                          >
                            {active ? (
                              <CheckCircle className="size-4 text-success" />
                            ) : (
                              <XCircle className="size-4 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete client "${c.name}" and all associated media?`)) {
                                removeClient.mutate(clientId);
                              }
                            }}
                            className="btn-base btn-ghost !p-1 text-xs text-destructive hover:bg-destructive/10"
                            title="Delete Client"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Page {page} of {totalPages} ({sorted.length} total clients)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-base btn-secondary !py-1 text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-base btn-secondary !py-1 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
