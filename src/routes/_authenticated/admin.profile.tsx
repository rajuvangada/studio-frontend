import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin", "studio-profile"],
    queryFn: async () => {
      try {
        return await api.getProfile();
      } catch {
        return null;
      }
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      return await api.updateProfile(patch);
    },
    onSuccess: () => {
      toast.success("Studio profile saved to database successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "studio-profile"] });
      queryClient.invalidateQueries({ queryKey: ["studio-profile"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save profile."),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Studio profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage contact details, social links, and brand details stored in MongoDB.
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
            });
          }}
          className="card-surface mt-6 grid gap-4 p-6 md:grid-cols-2"
        >
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
            <button type="submit" disabled={save.isPending} className="btn-base btn-primary">
              {save.isPending ? "Saving to database…" : "Save profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
