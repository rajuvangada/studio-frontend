import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { api } from "./api";

const credentials = z.object({
  token: z.string().trim().min(6).max(64),
  passcode: z.string().trim().min(4).max(32),
});

export type GalleryPhoto = {
  id: string;
  kind?: string;
  file_name: string;
  url: string;
  selected: boolean;
  comment: string | null;
};

export type GalleryData = {
  client: {
    id: string;
    name: string;
    event_name: string | null;
    event_date: string | null;
    location: string | null;
  };
  photos: GalleryPhoto[];
  submitted_at: string | null;
};

export type GalleryResult = { ok: true; gallery: GalleryData } | { ok: false; message: string };

export const openGallery = createServerFn({ method: "POST" })
  .validator((input: unknown) => credentials.parse(input))
  .handler(async ({ data }): Promise<GalleryResult> => {
    try {
      const res = await api.openGallery(data.token, data.passcode);
      if (!res || !res.client) {
        return { ok: false, message: "Gallery unavailable." };
      }
      return {
        ok: true,
        gallery: {
          client: {
            id: res.client.id || res.client._id || "",
            name: res.client.name,
            event_name: res.client.eventName || res.client.event_name || null,
            event_date: res.client.eventDate || res.client.event_date || null,
            location: res.client.location || null,
          },
          photos: (res.photos || []).map((p: any) => ({
            id: p.id || p._id,
            file_name: p.fileName || p.file_name || "photo.jpg",
            url: p.url,
            selected: !!p.selected,
            comment: p.comment || null,
          })),
          submitted_at: res.submittedAt || null,
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Incorrect passcode.",
      };
    }
  });

export const toggleSelection = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    credentials.extend({ mediaId: z.string(), selected: z.boolean(), comment: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const payload: { passcode: string; mediaId: string; selected: boolean; comment?: string } = {
      passcode: data.passcode,
      mediaId: data.mediaId,
      selected: data.selected,
    };
    if (data.comment !== undefined) {
      payload.comment = data.comment;
    }
    await api.selectGalleryMedia(data.token, payload);
    return { ok: true };
  });

export const submitSelection = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    credentials.extend({ notes: z.string().trim().max(1000).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const payload: { passcode: string; notes?: string } = {
      passcode: data.passcode,
    };
    if (data.notes !== undefined) {
      payload.notes = data.notes;
    }
    const res = await api.submitGallerySelection(data.token, payload);
    return { ok: true, count: res.count || 1 };
  });
