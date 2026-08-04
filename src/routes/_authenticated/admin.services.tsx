import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Plus, Star, Trash2, Upload, Sparkles, Edit2, Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type ServiceItem } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: ServicesAdmin,
});

function ServicesAdmin() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: api.getAdminServices,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createService(data),
    onSuccess: () => {
      toast.success("Service package created!");
      setIsCreateOpen(false);
      setCoverImageUrl(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create service."),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; patch: Record<string, unknown> }) =>
      api.updateService(vars.id, vars.patch),
    onSuccess: () => {
      toast.success("Service package updated!");
      setEditingService(null);
      setCoverImageUrl(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update service."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      toast.success("Service package deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete service."),
  });

  async function handleCoverUpload(file: File | undefined, serviceId?: string) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (serviceId) formData.append("serviceId", serviceId);

      const res = await api.uploadServiceCover(formData);
      setCoverImageUrl(res.coverImageUrl);
      toast.success("Cover image uploaded to AWS S3!");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload cover image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Services &amp; Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage services, upload cover photos, toggle visibility, and mark featured packages.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setCoverImageUrl(null);
            setIsCreateOpen(true);
          }}
          className="btn-base btn-primary"
        >
          <Plus className="size-4" /> Add Service
        </button>
      </div>

      {/* Create / Edit Form Modal */}
      {(isCreateOpen || editingService) && (
        <div className="card-surface p-6 space-y-5 border border-brand/40 bg-surface/80">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display text-lg text-foreground">
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setEditingService(null);
                setCoverImageUrl(null);
              }}
              className="btn-base btn-ghost !p-2"
            >
              <X className="size-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const payload = {
                title: String(f.get("title")).trim(),
                description: String(f.get("description")).trim(),
                category: String(f.get("category") || "General").trim(),
                priceFrom: String(f.get("priceFrom") || "").trim() || null,
                sortOrder: Number(f.get("sortOrder") || 0),
                featured: f.get("featured") === "on",
                published: f.get("published") === "on",
                coverImageUrl: coverImageUrl || editingService?.coverImageUrl || editingService?.cover_image_url || null,
              };

              if (editingService) {
                updateMutation.mutate({ id: editingService.id || editingService._id!, patch: payload });
              } else {
                createMutation.mutate(payload);
              }
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="field-label" htmlFor="title">
                Service Title *
              </label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={editingService?.title || ""}
                placeholder="e.g. Wedding Photography & Films"
                className="field"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="category">
                Category
              </label>
              <Input
                id="category"
                name="category"
                defaultValue={editingService?.category || "Weddings"}
                placeholder="e.g. Weddings, Couples, Portraits"
                className="field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="field-label" htmlFor="description">
                Short Description *
              </label>
              <Textarea
                id="description"
                name="description"
                required
                rows={3}
                defaultValue={editingService?.description || ""}
                placeholder="Brief summary of what this service coverage includes..."
                className="field"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="priceFrom">
                Starting Price (Optional)
              </label>
              <Input
                id="priceFrom"
                name="priceFrom"
                defaultValue={editingService?.priceFrom || editingService?.price_from || ""}
                placeholder="e.g. From ₹50,000"
                className="field"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="sortOrder">
                Sort Order
              </label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={editingService?.sortOrder ?? editingService?.sort_order ?? 0}
                className="field"
              />
            </div>

            {/* Cover Image Upload */}
            <div className="md:col-span-2 space-y-2 rounded-xl border border-border p-4 bg-surface/50">
              <label className="field-label">Cover Image (AWS S3)</label>
              <div className="flex flex-wrap items-center gap-4">
                {(coverImageUrl || editingService?.coverImageUrl || editingService?.cover_image_url) && (
                  <img
                    src={coverImageUrl || editingService?.coverImageUrl || editingService?.cover_image_url!}
                    alt="Cover preview"
                    className="size-20 rounded-lg object-cover border border-border"
                  />
                )}
                <label className="btn-base btn-secondary cursor-pointer">
                  <Upload className="size-4" />
                  {uploading ? "Uploading to S3…" : "Upload Cover Image"}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading}
                    onChange={(e) => handleCoverUpload(e.target.files?.[0], editingService?.id || editingService?._id)}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-6 md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={editingService ? editingService.published : true}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                Published (Visible on site)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={editingService?.featured || false}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                Mark as Featured
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 md:col-span-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingService(null);
                  setCoverImageUrl(null);
                }}
                className="btn-base btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
                className="btn-base btn-primary"
              >
                {editingService ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-24 p-6 flex items-center justify-between">
              <div className="skeleton h-6 w-48 rounded" />
              <div className="skeleton h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="panel p-12 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg text-foreground">No services configured yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Click "Add Service" to create your first package.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((item) => {
            const coverUrl = item.coverImageUrl || item.cover_image_url;
            return (
              <div
                key={item.id || item._id}
                className="card-surface flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:border-brand/30"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {coverUrl ? (
                    <img src={coverUrl} alt={item.title} className="size-16 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted-foreground">
                      <Sparkles className="size-6 text-brand" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg text-foreground truncate">{item.title}</h3>
                      {item.featured && <span className="chip-brand text-[0.65rem]">Featured</span>}
                      {!item.published && <span className="chip-secondary text-[0.65rem]">Draft</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                    {item.category && <p className="mt-1 text-[0.7rem] uppercase tracking-wider text-brand">{item.category}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: item.id || item._id!,
                        patch: { published: !item.published },
                      })
                    }
                    title={item.published ? "Hide service" : "Publish service"}
                    className="btn-base btn-ghost !p-2"
                  >
                    {item.published ? <Eye className="size-4 text-brand" /> : <EyeOff className="size-4 text-muted-foreground" />}
                  </button>

                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: item.id || item._id!,
                        patch: { featured: !item.featured },
                      })
                    }
                    title={item.featured ? "Unmark featured" : "Mark as featured"}
                    className="btn-base btn-ghost !p-2"
                  >
                    <Star className={`size-4 ${item.featured ? "fill-brand text-brand" : "text-muted-foreground"}`} />
                  </button>

                  <button
                    onClick={() => {
                      setEditingService(item);
                      setCoverImageUrl(null);
                      setIsCreateOpen(false);
                    }}
                    className="btn-base btn-secondary"
                  >
                    <Edit2 className="size-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${item.title}"?`)) {
                        deleteMutation.mutate(item.id || item._id!);
                      }
                    }}
                    className="btn-base btn-ghost text-destructive hover:text-destructive !p-2"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
