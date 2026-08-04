import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Images, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type PortfolioItem } from "@/lib/api";
import { publicMediaUrl } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({
  component: PortfolioAdmin,
});

const empty = { title: "", category: "Weddings", description: "", storageKey: "" };

function PortfolioAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "portfolio"] });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "portfolio"],
    queryFn: async () => {
      try {
        const data = await api.getAllPortfolio();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required.");
      if (!form.storageKey) throw new Error("Upload an image first.");
      await api.createPortfolioItem({
        title: form.title.trim(),
        category: form.category.trim() || "Editorial",
        description: form.description.trim() || null,
        storageKey: form.storageKey,
      });
    },
    onSuccess: () => {
      toast.success("Portfolio item added successfully.");
      setForm(empty);
      setPreviewUrl(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add portfolio item."),
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; patch: Record<string, unknown> }) => {
      await api.updatePortfolioItem(v.id, v.patch);
    },
    onSuccess: () => {
      toast.success("Portfolio item updated.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.deletePortfolioItem(id);
    },
    onSuccess: () => {
      toast.success("Portfolio item deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const contentType = file.type || "image/jpeg";

    try {
      let storageKey = "";
      try {
        // Step 1: Obtain pre-signed upload URL from backend
        const { key, uploadUrl } = await api.signPortfolioUpload(file.name, contentType);

        // Step 2: Directly PUT binary file to AWS S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": contentType },
        });

        if (!uploadRes.ok) {
          throw new Error(`S3 upload failed with status ${uploadRes.status}`);
        }
        storageKey = key;
      } catch (s3Error) {
        console.warn("[portfolio upload] S3 presigned upload fallback to direct backend upload:", s3Error);
        const formData = new FormData();
        formData.append("file", file);
        const item = await api.uploadPortfolioFile(formData);
        storageKey = item.storageKey || item.id;
        if (item.imageUrl || item.image_url) {
          setPreviewUrl(item.imageUrl || item.image_url || null);
        }
      }

      if (storageKey) {
        setForm((f) => ({ ...f, storageKey }));
        if (!previewUrl) setPreviewUrl(URL.createObjectURL(file));
        toast.success("Image uploaded successfully.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }


  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your public portfolio showcase. All media is uploaded directly to AWS S3.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="card-surface mt-6 grid gap-4 p-6 md:grid-cols-2"
      >
        <div>
          <label className="field-label">Title *</label>
          <Input
            required
            className="field"
            placeholder="Golden hour portraits"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Category *</label>
          <Input
            required
            className="field"
            placeholder="Weddings"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Description</label>
          <Textarea
            rows={3}
            className="field"
            placeholder="Short story or context for this shoot"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input p-6 text-center text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:bg-surface",
            form.storageKey && "border-brand/50 text-brand bg-brand/5",
          )}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Upload Preview" className="max-h-32 rounded object-cover" />
          ) : (
            <>
              <Upload className="size-5" />
              {uploading ? "Uploading to S3…" : form.storageKey ? "Image ready on S3" : "Click to upload image to S3"}
            </>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => uploadImage(e.target.files?.[0])}
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={create.isPending || uploading}
            className="btn-base btn-primary w-full md:w-auto"
          >
            {create.isPending ? "Adding…" : "Add to portfolio"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-surface overflow-hidden">
              <span className="skeleton block aspect-[4/3] w-full" />
              <div className="space-y-2 p-5">
                <span className="skeleton block h-4 w-2/3" />
                <span className="skeleton block h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-surface mt-6 flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Images className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No portfolio items yet</p>
          <p className="text-xs text-muted-foreground">Upload your first piece of work above.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: PortfolioItem) => {
            const itemId = item.id || item._id || "";
            const imageUrl = item.imageUrl || item.image_url || "";
            const isPub = item.published !== false;
            const isFeat = !!item.featured;
            const isHome = item.showOnHome ?? item.show_on_home ?? false;

            return (
              <article key={itemId} className="card-surface overflow-hidden">
                <img
                  src={publicMediaUrl(imageUrl)}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-5">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-brand">
                    {item.category}
                  </p>
                  {item.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => update.mutate({ id: itemId, patch: { published: !isPub } })}
                      className={cn("chip", isPub ? "chip-brand" : "")}
                    >
                      {isPub ? "Published" : "Draft"}
                    </button>
                    <button
                      onClick={() => update.mutate({ id: itemId, patch: { featured: !isFeat } })}
                      className={cn("chip", isFeat ? "chip-brand" : "")}
                    >
                      Featured
                    </button>
                    <button
                      onClick={() => update.mutate({ id: itemId, patch: { showOnHome: !isHome } })}
                      className={cn("chip", isHome ? "chip-brand" : "")}
                    >
                      Home
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete portfolio item "${item.title}"?`)) {
                          remove.mutate(itemId);
                        }
                      }}
                      className="ml-auto rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                      title="Delete item"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
