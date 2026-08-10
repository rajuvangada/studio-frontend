import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Copy, Image as ImageIcon, MessageSquare, Pause, Play, RefreshCw, StopCircle, Trash2, Upload, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE, api, formatBytes, getFileMediaDetails, uploadWithProgress, type MediaItem } from "@/lib/api";
import { formatDate, whatsappHref } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/clients/$id")({
  component: ClientWorkspace,
});

const TABS = ["Workspace", "Media", "Share", "Submissions", "Timeline"] as const;

type ProgressInfo = {
  fileIndex: number;
  totalFiles: number;
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
  step: string;
  speedBytesPerSec?: number;
  remainingSeconds?: number;
  errorMessage?: string;
};

type MultipartSession = {
  key: string;
  uploadId: string;
  completedParts: { PartNumber: number; ETag: string }[];
  partProgressMap: Map<number, number>;
};

function ClientWorkspace() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Workspace");
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "paused" | "completing" | "success" | "error">("idle");
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);

  // Pause / Resume & Cancel Refs
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const activeSessionRef = useRef<MultipartSession | null>(null);

  useEffect(() => {
    const handleOffline = () => {
      if (uploadState === "uploading") {
        isPausedRef.current = true;
        setUploadState("paused");
        toast.error("Network connection lost. Upload paused. Click Resume when online.");
      }
    };
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, [uploadState]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "client", id] });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "client", id],
    queryFn: async () => {
      try {
        const clientData = await api.getClient(id);
        return {
          client: clientData?.client ?? null,
          media: clientData?.media ?? [],
          submissions: clientData?.submissions ?? [],
          timeline: clientData?.timeline ?? [],
        };
      } catch {
        return { client: null, media: [], submissions: [], timeline: [] };
      }
    },
  });

  const updateClient = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      await api.updateClient(id, patch);
    },
    onSuccess: () => {
      toast.success("Client workspace saved.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update client."),
  });

  const rotatePasscode = useMutation({
    mutationFn: async () => {
      return await api.rotateClientPasscode(id);
    },
    onSuccess: (res) => {
      toast.success(`Passcode regenerated: ${res.passcode}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleGalleryPublished = useMutation({
    mutationFn: async (published: boolean) => {
      return await api.publishClientGallery(id, published);
    },
    onSuccess: (res) => {
      toast.success(res.client.galleryPublished || res.client.gallery_published ? "Gallery published live!" : "Gallery unpublished.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMedia = useMutation({
    mutationFn: async (mediaId: string) => {
      await api.deleteClientMedia(id, mediaId);
    },
    onSuccess: () => {
      toast.success("Media deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 1024 * 1024; // 1 TB in bytes

  function handleFileSelection(files: FileList | null) {
    if (!files || !files.length) return;
    const fileArray = Array.from(files);

    for (const f of fileArray) {
      const { kind } = getFileMediaDetails(f);
      if (kind === "video" && f.size > MAX_VIDEO_SIZE_BYTES) {
        toast.error("Video exceeds the maximum allowed size of 1 TB.");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }

    setSelectedFiles(fileArray);
    setUploadState("idle");
    setProgressInfo(null);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    activeSessionRef.current = null;
  }

  function handlePause() {
    isPausedRef.current = true;
    setUploadState("paused");
    toast.info("Upload paused. Click Resume to continue.");
  }

  function handleResume() {
    if (uploadState !== "paused") return;
    isPausedRef.current = false;
    setUploadState("uploading");
    executeUpload();
  }

  async function handleCancel() {
    if (confirm("Are you sure you want to cancel the video upload? Unsaved progress will be lost.")) {
      isCancelledRef.current = true;
      if (activeSessionRef.current) {
        await api.abortClientMultipartUpload(id, activeSessionRef.current.key, activeSessionRef.current.uploadId).catch(() => {});
        activeSessionRef.current = null;
      }
      setSelectedFiles([]);
      setUploadState("idle");
      setProgressInfo(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.info("Upload cancelled.");
    }
  }

  async function executeUpload() {
    if (!selectedFiles.length) return;
    setUploadState("uploading");
    isPausedRef.current = false;
    isCancelledRef.current = false;

    const totalFiles = selectedFiles.length;
    let completedCount = 0;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        if (!file) continue;
        const { contentType, kind } = getFileMediaDetails(file);

        if (kind === "video") {
          // ==========================================
          // S3 MULTIPART UPLOAD FOR LARGE VIDEOS
          // ==========================================
          const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks
          const totalParts = Math.ceil(file.size / CHUNK_SIZE);

          let session = activeSessionRef.current;
          let key = session?.key || "";
          let uploadId = session?.uploadId || "";
          let completedPartsMap = new Map<number, string>(
            session?.completedParts.map((p) => [p.PartNumber, p.ETag]) || [],
          );
          let partProgressMap = session?.partProgressMap || new Map<number, number>();

          if (!uploadId || !key) {
            setProgressInfo({
              fileIndex: i + 1,
              totalFiles,
              fileName: file.name,
              loaded: 0,
              total: file.size,
              percent: 0,
              step: "Initiating S3 multipart upload...",
            });

            const initRes = await api.initiateClientMultipartUpload(id, file.name, contentType, kind, file.size);
            key = initRes.key;
            uploadId = initRes.uploadId;
            session = {
              key,
              uploadId,
              completedParts: [],
              partProgressMap: new Map(),
            };
            activeSessionRef.current = session;
          }

          const CONCURRENCY = 3;
          let nextPartIndex = 1;
          const startTime = Date.now();

          const updateProgressUI = () => {
            let totalLoaded = 0;
            for (const [pNum] of completedPartsMap.entries()) {
              const pSize = pNum === totalParts ? file.size - (totalParts - 1) * CHUNK_SIZE : CHUNK_SIZE;
              totalLoaded += pSize;
            }
            for (const [pNum, bytes] of partProgressMap.entries()) {
              if (!completedPartsMap.has(pNum)) {
                totalLoaded += bytes;
              }
            }

            totalLoaded = Math.min(file.size, totalLoaded);
            const percent = Math.min(99, Math.round((totalLoaded / file.size) * 100));
            const elapsedSec = (Date.now() - startTime) / 1000;
            const speed = elapsedSec > 0.5 ? totalLoaded / elapsedSec : 0;
            const remainingSec = speed > 0 ? Math.round((file.size - totalLoaded) / speed) : undefined;

            const pInfo: ProgressInfo = {
              fileIndex: i + 1,
              totalFiles,
              fileName: file.name,
              loaded: totalLoaded,
              total: file.size,
              percent,
              step: isPausedRef.current
                ? "Upload paused"
                : `Uploading video parts... ${percent}%`,
            };
            if (speed > 0) pInfo.speedBytesPerSec = speed;
            if (remainingSec !== undefined) pInfo.remainingSeconds = remainingSec;

            setProgressInfo(pInfo);
          };

          async function worker() {
            while (nextPartIndex <= totalParts && !isPausedRef.current && !isCancelledRef.current) {
              const partNumber = nextPartIndex++;
              if (completedPartsMap.has(partNumber)) continue;

              if (!file) break;
              const start = (partNumber - 1) * CHUNK_SIZE;
              const end = Math.min(file.size, start + CHUNK_SIZE);
              const chunk = file.slice(start, end);

              let attempts = 0;
              let success = false;

              while (attempts < 3 && !success && !isPausedRef.current && !isCancelledRef.current) {
                attempts++;
                try {
                  const { uploadUrl } = await api.signClientMultipartPart(id, key, uploadId, partNumber);

                  const uploadRes = await uploadWithProgress({
                    url: uploadUrl,
                    method: "PUT",
                    body: chunk,
                    headers: { "Content-Type": contentType },
                    onProgress: (loaded) => {
                      partProgressMap.set(partNumber, loaded);
                      updateProgressUI();
                    },
                  });

                  if (!uploadRes.ok) {
                    throw new Error(`Part #${partNumber} returned status ${uploadRes.status}`);
                  }

                  const etag = uploadRes.etag || uploadRes.responseText || `"${key}-${partNumber}"`;
                  completedPartsMap.set(partNumber, etag);
                  session!.completedParts = Array.from(completedPartsMap.entries()).map(([pNum, e]) => ({
                    PartNumber: pNum,
                    ETag: e,
                  }));
                  success = true;
                  updateProgressUI();
                } catch (err) {
                  console.warn(`[multipart] Part #${partNumber} attempt ${attempts} failed:`, err);
                  if (attempts >= 3) {
                    throw new Error(`Network interruption on video part #${partNumber}. Click Resume when connection stabilizes.`);
                  }
                  await new Promise((r) => setTimeout(r, 1000 * attempts));
                }
              }
            }
          }

          const workers = Array.from({ length: Math.min(CONCURRENCY, totalParts) }, () => worker());
          await Promise.all(workers);

          if (isCancelledRef.current) {
            return;
          }

          if (isPausedRef.current) {
            setUploadState("paused");
            return;
          }

          // Complete S3 Multipart Upload
          setUploadState("completing");
          setProgressInfo((prev) => (prev ? { ...prev, step: "Finalizing video upload in database..." } : null));

          const sortedParts = Array.from(completedPartsMap.entries())
            .map(([PartNumber, ETag]) => ({ PartNumber, ETag }))
            .sort((a, b) => a.PartNumber - b.PartNumber);

          await api.completeClientMultipartUpload(id, {
            key,
            uploadId,
            fileName: file.name,
            contentType,
            sizeBytes: file.size,
            kind: "video",
            parts: sortedParts,
          });

          activeSessionRef.current = null;
        } else {
          // ==========================================
          // DIRECT S3 PRESIGNED PUT FOR IMAGES
          // ==========================================
          setProgressInfo({
            fileIndex: i + 1,
            totalFiles,
            fileName: file.name,
            loaded: 0,
            total: file.size,
            percent: 0,
            step: "Uploading image to S3...",
          });

          let uploadSuccess = false;
          let s3Key = "";

          try {
            const { key, uploadUrl } = await api.signClientMediaUpload(id, file.name, contentType, kind);
            s3Key = key;

            const uploadRes = await uploadWithProgress({
              url: uploadUrl,
              method: "PUT",
              body: file,
              headers: { "Content-Type": contentType },
              onProgress: (loaded, total, percent) => {
                setProgressInfo({
                  fileIndex: i + 1,
                  totalFiles,
                  fileName: file.name,
                  loaded,
                  total,
                  percent,
                  step: `Uploading image... ${percent}%`,
                });
              },
            });

            if (uploadRes.ok) uploadSuccess = true;
          } catch (s3Err) {
            console.warn("[image upload] S3 presigned upload fallback to API backend upload:", s3Err);
          }

          if (uploadSuccess && s3Key) {
            await api.confirmClientMediaUpload(id, {
              key: s3Key,
              fileName: file.name,
              contentType,
              sizeBytes: file.size,
              kind,
            });
          } else {
            const formData = new FormData();
            formData.append("file", file);
            await api.uploadClientMediaFile(id, formData);
          }
        }

        completedCount++;
      }

      setUploadState("success");
      toast.success(`Successfully uploaded ${completedCount} file(s).`);
      invalidate();
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadState("idle");
        setProgressInfo(null);
        if (fileRef.current) fileRef.current.value = "";
      }, 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Media upload failed. Please try again.";
      setUploadState("error");
      setProgressInfo((prev) =>
        prev
          ? { ...prev, step: "Upload failed", errorMessage: msg }
          : {
              fileIndex: 1,
              totalFiles: 1,
              fileName: selectedFiles[0]?.name || "File",
              loaded: 0,
              total: 0,
              percent: 0,
              step: "Upload failed",
              errorMessage: msg,
            },
      );
      toast.error(msg);
    }
  }


  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <span className="skeleton block h-4 w-32" />
        <span className="skeleton block h-9 w-64" />
        <span className="skeleton block h-40 w-full" />
      </div>
    );
  }
  if (!data?.client) return <p className="text-sm text-muted-foreground">Client project not found.</p>;

  const client = data.client;
  const eventName = client.eventName || client.event_name || "—";
  const eventDate = client.eventDate || client.event_date;
  const projectCode = client.projectCode || client.project_code;
  const galleryToken = client.galleryToken || client.gallery_token;
  const isPublished = client.galleryPublished ?? client.gallery_published ?? false;

  const galleryLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/gallery/${galleryToken}`
      : `/gallery/${galleryToken}`;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/admin/clients"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> All clients
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{client.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {eventName} · {formatDate(eventDate)} · <span className="font-mono">{projectCode}</span>
      </p>

      <div className="mt-6 inline-flex gap-1 rounded-lg bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm transition-colors",
              tab === t
                ? "bg-card text-foreground shadow-[var(--shadow-xs)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview Workspace Form */}
      {tab === "Workspace" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            updateClient.mutate({
              name: String(f.get("name") ?? "").trim(),
              email: (f.get("email") as string)?.trim() || null,
              phone: (f.get("phone") as string)?.trim() || null,
              eventName: (f.get("eventName") as string)?.trim() || null,
              eventDate: (f.get("eventDate") as string)?.trim() || null,
              location: (f.get("location") as string)?.trim() || null,
              status: String(f.get("status") ?? "pending"),
              notes: (f.get("notes") as string)?.trim() || null,
            });
          }}
          className="card-surface mt-6 grid gap-4 p-6 md:grid-cols-2"
        >
          <div>
            <label className="field-label">Client name *</label>
            <Input name="name" defaultValue={client.name} className="field" required />
          </div>
          <div>
            <label className="field-label">Email</label>
            <Input name="email" defaultValue={client.email ?? ""} className="field" />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <Input name="phone" defaultValue={client.phone ?? ""} className="field" />
          </div>
          <div>
            <label className="field-label">Event name</label>
            <Input name="eventName" defaultValue={eventName !== "—" ? eventName : ""} className="field" />
          </div>
          <div>
            <label className="field-label">Event date</label>
            <Input
              name="eventDate"
              type="date"
              defaultValue={eventDate ? String(eventDate).slice(0, 10) : ""}
              className="field"
            />
          </div>
          <div>
            <label className="field-label">Location</label>
            <Input name="location" defaultValue={client.location ?? ""} className="field" />
          </div>
          <div>
            <label className="field-label">Project status</label>
            <select name="status" defaultValue={client.status} className="field">
              {["pending", "shooting", "editing", "delivered", "archived"].map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {client.phone && (
            <div className="flex items-end">
              <a
                href={whatsappHref(client.phone, `Hi ${client.name}, here is an update regarding your project with GK Digital Studios:`)}
                target="_blank"
                rel="noreferrer"
                className="btn-base btn-secondary w-full"
              >
                WhatsApp client
              </a>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="field-label">Internal notes & specifications</label>
            <Textarea name="notes" defaultValue={client.notes ?? ""} rows={5} className="field" />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={updateClient.isPending}
              className="btn-base btn-primary"
            >
              {updateClient.isPending ? "Saving changes…" : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Media Gallery Upload & Management */}
      {tab === "Media" && (
        <section className="mt-6 space-y-4">
          <div className="card-surface flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">
                {data.media.length} media item{data.media.length === 1 ? "" : "s"} uploaded
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports photos (JPEG, PNG, WEBP) and videos (MP4, MOV, WEBM, AVI, MPEG up to 500MB).
              </p>
            </div>
            <label
              className={cn(
                "btn-base btn-primary cursor-pointer",
                uploadState === "uploading" && "opacity-50 pointer-events-none",
              )}
            >
              <Upload className="size-4" />
              {uploadState === "uploading" ? "Uploading..." : "Select Photos & Videos"}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/*"
                hidden
                disabled={uploadState === "uploading"}
                onChange={(e) => handleFileSelection(e.target.files)}
              />
            </label>
          </div>

          {/* Selected File & Progress Card */}
          {selectedFiles.length > 0 && (
            <div className="card-surface p-6 border border-brand/40 bg-surface/90 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-display text-base text-foreground">
                    Selected Media ({selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"})
                  </h3>
                  <p className="text-xs text-muted-foreground">Review selected files before uploading to S3.</p>
                </div>
                {uploadState !== "uploading" && (
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setUploadState("idle");
                      setProgressInfo(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="btn-base btn-ghost !p-2"
                    title="Clear selection"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Selected Files List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((file, idx) => {
                  const { contentType, kind } = getFileMediaDetails(file);
                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {kind === "video" ? (
                          <Video className="size-4 text-brand shrink-0" />
                        ) : (
                          <ImageIcon className="size-4 text-brand shrink-0" />
                        )}
                        <span className="font-medium text-foreground truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="chip text-[0.65rem] uppercase">{kind}</span>
                        <span className="font-mono text-muted-foreground">{formatBytes(file.size)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload Progress Bar & Status (Uploading or Paused or Completing) */}
              {(uploadState === "uploading" || uploadState === "paused" || uploadState === "completing") && progressInfo && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span className="truncate flex items-center gap-2">
                      {uploadState === "paused" ? (
                        <span className="chip text-[0.65rem] bg-amber-500/20 text-amber-500 uppercase font-semibold">Paused</span>
                      ) : uploadState === "completing" ? (
                        <span className="chip text-[0.65rem] bg-brand/20 text-brand uppercase font-semibold">Finalizing</span>
                      ) : (
                        <span className="chip text-[0.65rem] bg-brand/20 text-brand uppercase font-semibold">Uploading</span>
                      )}
                      <span>{progressInfo.step}</span>
                    </span>
                    <span className="font-mono text-brand shrink-0 text-sm font-bold">{progressInfo.percent}%</span>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2 p-0.5 border border-border">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        uploadState === "paused" ? "bg-amber-500" : "bg-brand",
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, progressInfo.percent))}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-muted-foreground font-mono">
                    <div>
                      <span>Uploaded: </span>
                      <span className="font-semibold text-foreground">
                        {formatBytes(progressInfo.loaded)} / {formatBytes(progressInfo.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {progressInfo.speedBytesPerSec !== undefined && progressInfo.speedBytesPerSec > 0 && (
                        <span>
                          Speed: <strong className="text-foreground">{formatBytes(progressInfo.speedBytesPerSec)}/s</strong>
                        </span>
                      )}
                      {progressInfo.remainingSeconds !== undefined && (
                        <span>
                          Est. Time: <strong className="text-foreground">~{progressInfo.remainingSeconds}s</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Success Banner */}
              {uploadState === "success" && (
                <div className="chip-success flex items-center gap-2 rounded-lg p-3 text-xs">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Media uploaded successfully and registered in gallery!</span>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadState === "error" && progressInfo?.errorMessage && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Upload Failed</p>
                    <p className="mt-0.5">{progressInfo.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Start, Pause, Resume, Cancel */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {uploadState === "uploading" && (
                  <>
                    <button
                      type="button"
                      onClick={handlePause}
                      className="btn-base btn-secondary !py-2 !px-4 text-xs flex items-center gap-1.5"
                    >
                      <Pause className="size-3.5" />
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-base btn-ghost text-destructive hover:bg-destructive/10 !py-2 !px-4 text-xs flex items-center gap-1.5"
                    >
                      <StopCircle className="size-3.5" />
                      Cancel
                    </button>
                  </>
                )}

                {uploadState === "paused" && (
                  <>
                    <button
                      type="button"
                      onClick={handleResume}
                      className="btn-base btn-brand !py-2 !px-4 text-xs flex items-center gap-1.5"
                    >
                      <Play className="size-3.5" />
                      Resume Upload
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-base btn-ghost text-destructive hover:bg-destructive/10 !py-2 !px-4 text-xs flex items-center gap-1.5"
                    >
                      <StopCircle className="size-3.5" />
                      Cancel
                    </button>
                  </>
                )}

                {(uploadState === "idle" || uploadState === "error" || uploadState === "success") && (
                  <button
                    type="button"
                    onClick={executeUpload}
                    className="btn-base btn-primary"
                  >
                    <Upload className="size-4" />
                    {uploadState === "error"
                      ? "Retry Upload"
                      : `Start Upload (${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"})`}
                  </button>
                )}

                {uploadState === "completing" && (
                  <button
                    type="button"
                    disabled
                    className="btn-base btn-primary opacity-60 cursor-not-allowed"
                  >
                    <RefreshCw className="size-4 animate-spin" />
                    Finalizing Upload...
                  </button>
                )}
              </div>
            </div>
          )}

          {data.media.length === 0 ? (
            <div className="card-surface mt-4 flex flex-col items-center justify-center gap-2 p-12 text-center">
              <ImageIcon className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No media files yet</p>
              <p className="text-xs text-muted-foreground">
                Upload photos or videos for this client gallery.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {data.media.map((m: MediaItem) => (
                <figure
                  key={m.id || m._id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface"
                >
                  {m.kind === "video" ? (
                    <div className="flex aspect-square w-full items-center justify-center bg-black/60 text-white">
                      <Video className="size-8 text-brand" />
                    </div>
                  ) : (
                    <img
                      src={m.url}
                      alt={m.fileName || m.file_name || "Media"}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  )}
                  {m.selected && (
                    <span className="chip chip-brand absolute left-2 top-2">Selected</span>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this file permanently?")) {
                        deleteMedia.mutate(m.id || m._id || "");
                      }
                    }}
                    className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 text-destructive opacity-0 shadow-[var(--shadow-sm)] transition-opacity group-hover:opacity-100"
                    title="Delete Media"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Share Gallery */}
      {tab === "Share" && (
        <section className="card-surface mt-6 space-y-6 p-6">
          <div>
            <p className="field-label">Shareable client gallery link</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="panel flex-1 px-4 py-2 text-xs text-foreground font-mono truncate">{galleryLink}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(galleryLink);
                  toast.success("Gallery link copied to clipboard!");
                }}
                className="btn-base btn-secondary"
              >
                <Copy className="size-3.5" /> Copy Link
              </button>
            </div>
          </div>

          <div>
            <p className="field-label">Passcode authentication</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="panel px-4 py-2 text-sm tracking-[0.3em] font-semibold text-brand">
                {client.passcode}
              </code>
              <button
                onClick={() => rotatePasscode.mutate()}
                disabled={rotatePasscode.isPending}
                className="btn-base btn-secondary"
              >
                <RefreshCw className={cn("size-3.5", rotatePasscode.isPending && "animate-spin")} /> Regenerate Passcode
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={() => toggleGalleryPublished.mutate(!isPublished)}
              disabled={toggleGalleryPublished.isPending}
              className={cn("btn-base", isPublished ? "btn-brand" : "btn-secondary")}
            >
              {isPublished ? "Gallery Live (Public)" : "Publish Gallery"}
            </button>
            <a
              href={whatsappHref(
                client.phone ?? "",
                `Hi ${client.name}, your private client gallery from GK Digital Studios is ready!\n\nGallery Link: ${galleryLink}\nPasscode: ${client.passcode}`,
              )}
              target="_blank"
              rel="noreferrer"
              className="btn-base btn-brand"
            >
              Share via WhatsApp
            </a>
          </div>
        </section>
      )}

      {/* Tab 4: Submissions */}
      {tab === "Submissions" && (
        <section className="mt-6 space-y-4">
          {data.submissions.length === 0 ? (
            <div className="card-surface flex flex-col items-center justify-center gap-2 p-12 text-center">
              <MessageSquare className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No client selections submitted yet</p>
              <p className="text-xs text-muted-foreground">
                Once the client submits their chosen photos from the portal, they will be listed here.
              </p>
            </div>
          ) : (
            data.submissions.map((s) => (
              <article key={s.id || s._id} className="card-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {s.photoCount ?? 0} photo{(s.photoCount ?? 0) === 1 ? "" : "s"} selected by client
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted on {formatDate(s.submittedAt || s.submitted_at)}
                    </p>
                  </div>
                  {(s.reviewedAt || s.reviewed_at) ? (
                    <span className="chip chip-success flex items-center gap-1">
                      <Check className="size-3" /> Reviewed
                    </span>
                  ) : (
                    <span className="chip chip-brand">New Submission</span>
                  )}
                </div>
                {s.notes && <p className="mt-3 panel p-4 text-sm text-foreground">{s.notes}</p>}
              </article>
            ))
          )}
        </section>
      )}

      {/* Tab 5: Timeline Activity */}
      {tab === "Timeline" && (
        <section className="card-surface mt-6 p-6">
          {data.timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No activity recorded</p>
              <p className="text-xs text-muted-foreground">
                Activity events for this project will automatically log here.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.timeline.map((e) => (
                <li key={e.id || e._id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                  <div className="flex-1">
                    <p className="text-foreground">{e.description || e.type || e.event_type}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(e.createdAt || e.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
