import { api } from "./api";

export type GalleryClient = {
  id: string;
  name: string;
  event_name: string | null;
  event_date: string | null;
  location: string | null;
  passcode: string;
};

export type AuthResult =
  | { ok: true; client: GalleryClient }
  | { ok: false; reason: "unavailable" | "passcode" | "error"; message: string };

/**
 * Resolves a gallery by share token and checks the passcode.
 */
export async function authenticateGallery(token: string, passcode: string): Promise<AuthResult> {
  try {
    const res = await api.openGallery(token, passcode);
    if (res && res.client) {
      return { ok: true, client: res.client as unknown as GalleryClient };
    }
    return { ok: false, reason: "unavailable", message: "Gallery unavailable." };
  } catch (err: unknown) {
    return {
      ok: false,
      reason: "passcode",
      message: err instanceof Error ? err.message : "Incorrect passcode.",
    };
  }
}
