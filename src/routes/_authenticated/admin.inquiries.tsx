import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { api, type InquiryItem } from "@/lib/api";
import { formatDate, whatsappHref } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  component: InquiriesAdmin,
});

function InquiriesAdmin() {
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["admin", "inquiries"],
    queryFn: async () => {
      try {
        const data = await api.getInquiries();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const mutate = useMutation({
    mutationFn: async (v: { id: string; patch: Record<string, unknown> }) => {
      await api.updateInquiry(v.id, v.patch);
    },
    onSuccess: () => {
      toast.success("Inquiry updated.");
      invalidate();
      setReplying(null);
      setReply("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update inquiry."),
  });

  const removeInquiry = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteInquiry(id);
    },
    onSuccess: () => {
      toast.success("Inquiry deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete inquiry."),
  });

  const filtered = inquiries.filter((item: InquiryItem) => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Respond to client enquiries submitted from the studio website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["all", "new", "replied", "archived"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn("chip capitalize", statusFilter === st ? "chip-brand" : "")}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-surface p-6">
              <span className="skeleton block h-5 w-40" />
              <span className="skeleton mt-3 block h-4 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card-surface flex flex-col items-center justify-center gap-2 p-12 text-center">
            <MessageSquare className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No enquiries found</p>
            <p className="text-xs text-muted-foreground">
              New enquiries submitted from your website will appear here.
            </p>
          </div>
        ) : (
          filtered.map((i: InquiryItem) => {
            const inquiryId = i.id || i._id || "";
            const eventType = i.eventType || i.event_type || "—";
            const eventDate = i.eventDate || i.event_date;
            const createdAt = i.createdAt || i.created_at;

            return (
              <article key={inquiryId} className="card-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{i.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {i.email}
                      {i.phone ? ` · ${i.phone}` : ""} · Submitted {formatDate(createdAt)}
                    </p>
                  </div>
                  <span className={cn("chip capitalize", i.status === "new" ? "chip-brand" : "")}>
                    {i.status}
                  </span>
                </div>

                <p className="mt-4 text-sm text-foreground">{i.message}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Event: {eventType} · Date: {formatDate(eventDate)}
                </p>

                {i.reply && (
                  <p className="panel mt-4 p-4 text-sm text-foreground">
                    <span className="font-semibold text-brand">Reply note:</span> {i.reply}
                  </p>
                )}

                {replying === inquiryId ? (
                  <div className="mt-5">
                    <Textarea
                      rows={4}
                      className="field"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write your reply notes for this client..."
                    />
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() =>
                          mutate.mutate({
                            id: inquiryId,
                            patch: {
                              reply,
                              status: "replied",
                            },
                          })
                        }
                        className="btn-base btn-primary"
                      >
                        Save reply
                      </button>
                      <button onClick={() => setReplying(null)} className="btn-base btn-ghost">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setReplying(inquiryId);
                          setReply(i.reply ?? "");
                        }}
                        className="btn-base btn-secondary"
                      >
                        Log reply
                      </button>
                      <a
                        href={`mailto:${i.email}?subject=GK Digital Studios — Your Enquiry`}
                        className="btn-base btn-secondary"
                      >
                        <Mail className="size-4" />
                        Email client
                      </a>
                      {i.phone && (
                        <a
                          href={whatsappHref(i.phone, `Hi ${i.name}, thank you for reaching out to GK Digital Studios!`)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-base btn-brand"
                        >
                          WhatsApp
                        </a>
                      )}
                      {i.status !== "archived" && (
                        <button
                          onClick={() => mutate.mutate({ id: inquiryId, patch: { status: "archived" } })}
                          className="btn-base btn-ghost"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete inquiry from ${i.name}?`)) {
                          removeInquiry.mutate(inquiryId);
                        }
                      }}
                      className="btn-base btn-ghost !p-2 text-destructive hover:bg-destructive/10"
                      title="Delete inquiry"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
