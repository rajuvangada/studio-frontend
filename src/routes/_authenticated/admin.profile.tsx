import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2, Upload, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type StudioProfile } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  component: ProfileAdmin,
});

const fields = [
  ["studioName", "Studio name"],
  ["ownerName", "Owner name"],
  ["tagline", "Tagline"],
  ["phone", "Phone"],
  ["whatsapp", "WhatsApp number"],
  ["email", "Email"],
  ["instagram", "Instagram handle"],
  ["address", "Address"],
] as const;

function ProfileAdmin() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin", "studio-profile"],
    queryFn: async () => {
      try {
        const res = await api.getProfile();
        return res;
      } catch {
        return null;
      }
    },
  });

  const currentPhoto = localPhotoUrl ?? profile?.ownerPhotoUrl ?? profile?.owner_photo_url ?? null;

  const save = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      return await api.updateProfile({
        ...patch,
        ownerPhotoUrl: currentPhoto,
      });
    },
    onSuccess: (updated) => {
      toast.success("Studio profile saved to database successfully.");
      const newUrl = updated.ownerPhotoUrl || updated.owner_photo_url || null;
      if (newUrl) setLocalPhotoUrl(newUrl);
      queryClient.setQueryData(["admin", "studio-profile"], updated);
      queryClient.setQueryData(["studio-profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "studio-profile"] });
      queryClient.invalidateQueries({ queryKey: ["studio-profile"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save profile."),
  });

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB.");
      return;
    }

    // Instant local blob preview for immediate UI feedback
    const previewBlobUrl = URL.createObjectURL(file);
    setLocalPhotoUrl(previewBlobUrl);
    setImageError(false);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updatedProfile = await api.uploadOwnerPhotoFile(formData);
      const newUrl = updatedProfile.ownerPhotoUrl || updatedProfile.owner_photo_url || null;
      setLocalPhotoUrl(newUrl);
      toast.success("Owner profile photo uploaded to AWS S3!");
      queryClient.setQueryData(["admin", "studio-profile"], updatedProfile);
      queryClient.setQueryData(["studio-profile"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["admin", "studio-profile"] });
      queryClient.invalidateQueries({ queryKey: ["studio-profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo to S3.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    setLocalPhotoUrl(null);
    setImageError(false);
    save.mutate({ ownerPhotoUrl: null });
    toast.success("Owner profile photo removed.");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Studio profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage contact details, social links, owner photo, and brand details stored in MongoDB.
        </p>
      </div>

      {isLoading ? (
        <div className="card-surface mt-6 space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="skeleton block h-10 w-full" />
          ))}
        </div>
      ) : (
        <form
          key={profile?.id ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save.mutate({
              studioName: String(f.get("studioName") ?? "GK Digital Studios").trim(),
              ownerName: (f.get("ownerName") as string)?.trim() || null,
              tagline: (f.get("tagline") as string)?.trim() || null,
              phone: (f.get("phone") as string)?.trim() || null,
              whatsapp: (f.get("whatsapp") as string)?.trim() || null,
              email: (f.get("email") as string)?.trim() || null,
              instagram: (f.get("instagram") as string)?.trim() || null,
              address: (f.get("address") as string)?.trim() || null,
              businessHours: (f.get("businessHours") as string)?.trim() || null,
              about: (f.get("about") as string)?.trim() || null,
              ownerPhotoUrl: currentPhoto,
            });
          }}
          className="card-surface mt-6 grid gap-6 p-6 md:grid-cols-2"
        >
          {/* Owner Profile Photo Section */}
          <div className="md:col-span-2 space-y-3 rounded-2xl border border-border p-5 bg-surface/50">
            <label className="field-label">Owner Profile Photo</label>
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                {currentPhoto && !imageError ? (
                  <img
                    src={currentPhoto}
                    alt="Owner profile photo"
                    onError={() => setImageError(true)}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center bg-surface-2 text-muted-foreground">
                    <User className="size-8 text-brand" />
                    <span className="mt-1 text-[0.65rem] text-muted-foreground">No Photo</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="btn-base btn-primary cursor-pointer">
                    <Upload className="size-4" />
                    {uploading ? "Uploading to S3…" : currentPhoto ? "Replace photo" : "Upload photo"}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploading}
                      onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, or WEBP up to 10MB. Uploads directly to AWS S3.
                </p>
              </div>
            </div>
          </div>

          {fields.map(([name, label]) => {
            const val =
              (profile?.[name as keyof StudioProfile] as string | null | undefined) ??
              (profile?.[
                (name === "studioName"
                  ? "studio_name"
                  : name === "ownerName"
                    ? "owner_name"
                    : name) as keyof StudioProfile
              ] as string | null | undefined) ??
              "";

            return (
              <div key={name}>
                <label className="field-label" htmlFor={name}>
                  {label}
                </label>
                <Input
                  id={name}
                  name={name}
                  defaultValue={val}
                  className="field"
                />
              </div>
            );
          })}

          <div className="md:col-span-2">
            <label className="field-label" htmlFor="businessHours">
              Business hours
            </label>
            <Textarea
              id="businessHours"
              name="businessHours"
              rows={3}
              defaultValue={profile?.businessHours ?? profile?.business_hours ?? ""}
              className="field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="field-label" htmlFor="about">
              About the studio
            </label>
            <Textarea
              id="about"
              name="about"
              rows={6}
              defaultValue={profile?.about ?? ""}
              className="field"
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={save.isPending || uploading} className="btn-base btn-primary">
              {save.isPending ? "Saving to database…" : "Save profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
