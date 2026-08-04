import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Heart, Lock, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  openGallery,
  submitSelection,
  toggleSelection,
  type GalleryData,
} from "@/lib/gallery.functions";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/studio";

export const Route = createFileRoute("/gallery/$token")({
  head: () => ({
    meta: [
      { title: "Private Gallery — GK Digital Studios" },
      {
        name: "description",
        content: "Passcode-protected client gallery for selecting final images.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Private Gallery — GK Digital Studios" },
      { property: "og:description", content: "Passcode-protected client selection gallery." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { token } = Route.useParams();
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState<GalleryData | null>(null);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = useServerFn(openGallery);
  const toggle = useServerFn(toggleSelection);
  const submit = useServerFn(submitSelection);

  // Validate gallery token and publication status
  const { data: infoData, error: infoError, isLoading: infoLoading } = useQuery({
    queryKey: ["gallery-info", token],
    queryFn: async () => {
      try {
        return await api.getGalleryInfo(token);
      } catch (err: any) {
        throw err;
      }
    },
    retry: false,
  });

  const unlock = useMutation({
    mutationFn: () => open({ data: { token, passcode } }),
    onSuccess: (result) => {
      if (result.ok) {
        setLockMessage(null);
        setUnlocked(result.gallery);
      } else {
        setLockMessage(result.message || "Incorrect passcode.");
      }
    },
    onError: (e: Error) => setLockMessage(e.message || "Incorrect passcode."),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { mediaId: string; selected: boolean }) =>
      toggle({ data: { token, passcode, ...vars } }),
    onMutate: (vars) =>
      setUnlocked((prev) =>
        prev
          ? {
              ...prev,
              photos: prev.photos.map((p) =>
                p.id === vars.mediaId ? { ...p, selected: vars.selected } : p,
              ),
            }
          : prev,
      ),
    onError: (e: Error) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: () => submit({ data: { token, passcode, notes } }),
    onSuccess: (res) => {
      toast.success(`Submitted ${res.count} photos to the studio.`);
      setUnlocked((prev) => (prev ? { ...prev, submitted_at: new Date().toISOString() } : prev));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const photos = unlocked?.photos ?? [];

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? i : Math.min(i + 1, photos.length - 1)));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, photos.length]);

  if (infoLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        Loading client gallery…
      </main>
    );
  }

  // Handling Requirement 9: Invalid gallery token -> 404 page
  // Handling Requirement 8: Unpublished gallery -> "Gallery is not available." page
  if (infoError) {
    const errorMsg = infoError instanceof Error ? infoError.message : "Gallery not available.";
    const isUnpublished = errorMsg.includes("not available");

    if (isUnpublished) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="card-surface w-full max-w-sm rounded-3xl p-10 text-center shadow-[var(--shadow-lg)]">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-2">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h1 className="mt-6 font-display text-2xl text-foreground">Gallery is not available.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This gallery has not been published yet. Please contact the studio for access.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="card-surface w-full max-w-sm rounded-3xl p-10 text-center shadow-[var(--shadow-lg)]">
          <h1 className="font-display text-4xl text-brand">404</h1>
          <h2 className="mt-4 font-display text-xl text-foreground">Gallery Not Found</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested gallery link is invalid or has expired.
          </p>
        </div>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onSubmit={(e) => {
            e.preventDefault();
            unlock.mutate();
          }}
          className="card-surface w-full max-w-sm rounded-3xl p-10 text-center shadow-[var(--shadow-lg)]"
        >
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-2">
            <Lock className="size-5 text-brand" />
          </div>
          <h1 className="mt-6 font-display text-3xl text-foreground">Private gallery</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {infoData?.eventName || infoData?.name ? `${infoData.eventName || infoData.name} — ` : ""}
            Enter the passcode provided by the studio.
          </p>
          <div className="field mt-7 text-left">
            <label className="field-label" htmlFor="passcode">
              Passcode
            </label>
            <input
              id="passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (lockMessage) setLockMessage(null);
              }}
              placeholder="••••••"
              className="w-full bg-transparent text-center text-lg tracking-[0.3em] outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <AnimatePresence>
            {lockMessage && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-xs leading-relaxed text-destructive"
              >
                {lockMessage}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={unlock.isPending || passcode.trim().length < 4}
            className="btn-base btn-brand mt-6 w-full"
          >
            {unlock.isPending ? "Checking…" : "Unlock gallery"}
          </button>
        </motion.form>
      </main>
    );
  }

  const selectedCount = photos.filter((p) => p.selected).length;
  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="eyebrow">Private gallery</p>
            <h1 className="mt-1 truncate font-display text-lg md:text-xl">
              {unlocked.client.event_name ?? unlocked.client.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="chip-brand hidden sm:inline-flex">{selectedCount} selected</span>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || selectedCount === 0}
              className="btn-base btn-primary"
            >
              {submitMutation.isPending ? "Sending…" : "Submit selection"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(unlocked.client.event_date)}
          {unlocked.client.location ? ` · ${unlocked.client.location}` : ""}
        </p>

        {photos.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
            <p className="text-sm text-muted-foreground">
              Your images are still being prepared. Check back soon.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {photos.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: (i % 8) * 0.03 }}
                  className={cn(
                    "group relative break-inside-avoid overflow-hidden rounded-2xl border transition-shadow duration-300",
                    p.selected
                      ? "border-brand ring-2 ring-brand shadow-[var(--shadow-md)]"
                      : "border-border/60 hover:shadow-[var(--shadow-md)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="block w-full"
                  >
                    <ImageWithSkeleton src={p.url} alt={p.file_name} />
                  </button>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMutation.mutate({ mediaId: p.id, selected: !p.selected });
                    }}
                    className={cn(
                      "absolute right-3 top-3 grid size-8 place-items-center rounded-full backdrop-blur-md transition-all",
                      p.selected
                        ? "bg-brand text-primary-foreground"
                        : "bg-black/35 text-white opacity-0 group-hover:opacity-100",
                    )}
                    aria-label={p.selected ? "Remove from selection" : "Add to selection"}
                  >
                    <Heart className={cn("size-4", p.selected && "fill-current")} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="card-surface mt-14 rounded-3xl p-8">
              <p className="eyebrow">
                {selectedCount} photo{selectedCount === 1 ? "" : "s"} selected
              </p>
              {unlocked.submitted_at ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-success">
                  <Check className="size-4" />
                  Submitted on {formatDate(unlocked.submitted_at)}. You can still adjust and
                  resubmit.
                </div>
              ) : null}
              <div className="field mt-5">
                <label className="field-label" htmlFor="notes">
                  Notes for the studio
                </label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything you'd like the studio to know (optional)"
                  className="w-full resize-none border-0 bg-transparent p-0 outline-none focus-visible:ring-0"
                />
              </div>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || selectedCount === 0}
                className="btn-base btn-brand mt-6"
              >
                {submitMutation.isPending ? "Sending…" : "Submit selection"}
              </button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {activePhoto && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
                }}
                className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:left-6"
                aria-label="Previous"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {lightboxIndex < photos.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? i : Math.min(i + 1, photos.length - 1)));
                }}
                className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-6"
                aria-label="Next"
              >
                <ChevronRight className="size-5" />
              </button>
            )}

            <motion.div
              key={activePhoto.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative max-h-[85vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activePhoto.url}
                alt={activePhoto.file_name}
                className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-[var(--shadow-lift)]"
              />
              <button
                type="button"
                onClick={() =>
                  toggleMutation.mutate({
                    mediaId: activePhoto.id,
                    selected: !activePhoto.selected,
                  })
                }
                className={cn(
                  "absolute right-4 top-4 grid size-10 place-items-center rounded-full backdrop-blur-md transition-colors",
                  activePhoto.selected
                    ? "bg-brand text-primary-foreground"
                    : "bg-black/40 text-white",
                )}
                aria-label={activePhoto.selected ? "Remove from selection" : "Add to selection"}
              >
                <Heart className={cn("size-5", activePhoto.selected && "fill-current")} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ImageWithSkeleton({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative">
      {!loaded && <div className="skeleton absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full object-cover transition-all duration-700 group-hover:scale-[1.03]",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
