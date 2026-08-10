export const getApiBase = () => {
  const envUrl = import.meta.env["VITE_API_URL"];
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/$/, "");
  }

  return "http://localhost:4000";
};

export const API_BASE = getApiBase();

export type StudioProfile = {
  id: string;
  studio_name?: string;
  studioName?: string;
  owner_name?: string | null;
  ownerName?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  owner_photo_url?: string | null;
  ownerPhotoUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  address?: string | null;
  business_hours?: string | null;
  businessHours?: string | null;
  tagline?: string | null;
  about?: string | null;
};

export type PortfolioItem = {
  id: string;
  _id?: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl?: string;
  image_url?: string;
  storageKey?: string;
  sort_order?: number;
  sortOrder?: number;
  published: boolean;
  show_on_home?: boolean;
  showOnHome?: boolean;
  featured?: boolean;
  created_at?: string;
  createdAt?: string;
};

export type InquiryItem = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string | null;
  eventType?: string | null;
  event_type?: string | null;
  eventDate?: string | null;
  event_date?: string | null;
  message: string;
  reply: string | null;
  status: "new" | "replied" | "archived";
  createdAt?: string;
  created_at?: string;
};

export type ClientItem = {
  id: string;
  _id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  eventName?: string | null;
  event_name?: string | null;
  eventDate?: string | null;
  event_date?: string | null;
  location: string | null;
  projectCode?: string;
  project_code?: string;
  galleryToken?: string;
  gallery_token?: string;
  passcode: string;
  notes?: string | null;
  galleryPublished?: boolean;
  gallery_published?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  status: "pending" | "shooting" | "editing" | "delivered" | "archived";
  createdAt?: string;
  created_at?: string;
};

export type MediaItem = {
  id: string;
  _id?: string;
  kind: "photo" | "video";
  fileName?: string;
  file_name?: string;
  sizeBytes?: number;
  sortOrder?: number;
  selected?: boolean;
  url: string;
};

export type SelectionItem = {
  id: string;
  media_id?: string;
  mediaId?: string;
  comment?: string | null;
};

export type SubmissionItem = {
  id: string;
  _id?: string;
  notes?: string | null;
  photoCount?: number;
  submittedAt?: string | null;
  submitted_at?: string | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;
};

export type ActivityEventItem = {
  id: string;
  _id?: string;
  type?: string;
  event_type?: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
};

export type ServiceItem = {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category?: string | null;
  priceFrom?: string | null;
  price_from?: string | null;
  coverImageKey?: string | null;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  sortOrder?: number;
  sort_order?: number;
  featured?: boolean;
  published?: boolean;
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileMediaDetails(file: File): { contentType: string; kind: "photo" | "video" } {
  let contentType = file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  const videoExtensions: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    m4v: "video/mp4",
    mkv: "video/x-matroska",
    "3gp": "video/3gpp",
    ogv: "video/ogg",
  };

  const imageExtensions: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    svg: "image/svg+xml",
  };

  if (!contentType || contentType === "application/octet-stream" || contentType === "binary/octet-stream") {
    if (videoExtensions[ext]) {
      contentType = videoExtensions[ext];
    } else if (imageExtensions[ext]) {
      contentType = imageExtensions[ext];
    } else {
      contentType = "application/octet-stream";
    }
  }

  const isVideo = contentType.startsWith("video/") || Boolean(videoExtensions[ext]);
  const kind: "photo" | "video" = isVideo ? "video" : "photo";

  return { contentType, kind };
}

export function uploadWithProgress(options: {
  url: string;
  method?: string;
  body: Blob | FormData;
  headers?: Record<string, string>;
  onProgress?: (loaded: number, total: number, percentage: number) => void;
}): Promise<{ ok: boolean; status: number; responseText: string; etag: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "PUT", options.url, true);

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, val]) => {
        xhr.setRequestHeader(key, val);
      });
    }

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const percent = Math.round((e.loaded / e.total) * 100);
          options.onProgress!(e.loaded, e.total, percent);
        }
      };
    }

    xhr.onload = () => {
      const etag = xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag") || null;
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        responseText: xhr.responseText,
        etag,
      });
    };

    xhr.onerror = () => {
      reject(new Error("Network error during media upload. Check connection or CORS settings."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Media upload timed out. Please check network speed or try a smaller file."));
    };

    // 15-minute timeout for large video uploads (900,000ms)
    xhr.timeout = 900000;
    xhr.send(options.body);
  });
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = API_BASE.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Authorization") && typeof window !== "undefined") {
    const savedToken = localStorage.getItem("gk_token");
    if (savedToken) {
      headers.set("Authorization", `Bearer ${savedToken}`);
    }
  }

  const controller = new AbortController();
  const timeoutMs = options.body instanceof FormData ? 900000 : 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `API request failed with status ${res.status}`;
      try {
        const errorData = (await res.json()) as Record<string, unknown>;
        const msg = errorData["message"];
        const err = errorData["error"];
        if (typeof msg === "string") errorMessage = msg;
        else if (typeof err === "string") errorMessage = err;
      } catch {
        // Ignore non-JSON error response body
      }
      throw new Error(errorMessage);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`API request timed out (${url}). Ensure backend server is running and accessible.`);
    }
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Cannot connect to backend API (${url}). Check network or VITE_API_URL setting.`);
    }
    throw err;
  }
}


export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiFetch<{ user: Record<string, unknown>; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
    );
    if (res && res.token && typeof window !== "undefined") {
      localStorage.setItem("gk_token", res.token);
    }
    return res;
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gk_token");
    }
    return apiFetch("/api/auth/logout", {
      method: "POST",
    });
  },

  getMe: () => apiFetch<{ user: Record<string, unknown> }>("/api/auth/me"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Public Studio Profile & Content
  getProfile: async () => {
    const res = await apiFetch<{ profile: StudioProfile }>("/api/profile");
    return res.profile;
  },

  updateProfile: async (patch: Record<string, unknown>) => {
    const res = await apiFetch<{ profile: StudioProfile }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.profile;
  },

  signOwnerPhotoUpload: (fileName: string, contentType: string) =>
    apiFetch<{ key: string; uploadUrl: string }>("/api/profile/photo/sign", {
      method: "POST",
      body: JSON.stringify({ fileName, contentType }),
    }),

  uploadOwnerPhotoFile: async (formData: FormData) => {
    const res = await apiFetch<{ profile: StudioProfile }>("/api/profile/photo/upload", {
      method: "POST",
      body: formData,
    });
    return res.profile;
  },

  getServices: async () => {
    const res = await apiFetch<{ services: ServiceItem[] }>("/api/services");
    return res.services || [];
  },

  getAdminServices: async () => {
    const res = await apiFetch<{ services: ServiceItem[] }>("/api/services/admin");
    return res.services || [];
  },

  createService: async (data: Record<string, unknown>) => {
    const res = await apiFetch<{ service: ServiceItem }>("/api/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.service;
  },

  updateService: async (id: string, patch: Record<string, unknown>) => {
    const res = await apiFetch<{ service: ServiceItem }>(`/api/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return res.service;
  },

  deleteService: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/services/${id}`, { method: "DELETE" }),

  uploadServiceCover: async (formData: FormData) => {
    const res = await apiFetch<{ coverImageUrl: string; service?: ServiceItem }>("/api/services/cover/upload", {
      method: "POST",
      body: formData,
    });
    return res;
  },

  getPortfolio: async () => {
    const res = await apiFetch<{ items: PortfolioItem[] }>("/api/portfolio");
    return res.items;
  },

  getAllPortfolio: async () => {
    const res = await apiFetch<{ items: PortfolioItem[] }>("/api/portfolio/all");
    return res.items;
  },

  signPortfolioUpload: (fileName: string, contentType: string) =>
    apiFetch<{ key: string; uploadUrl: string }>("/api/portfolio/sign", {
      method: "POST",
      body: JSON.stringify({ fileName, contentType }),
    }),

  uploadPortfolioFile: async (formData: FormData) => {
    const res = await apiFetch<{ item: PortfolioItem }>("/api/portfolio/upload", {
      method: "POST",
      body: formData,
    });
    return res.item;
  },

  createPortfolioItem: async (data: Record<string, unknown>) => {

    const res = await apiFetch<{ item: PortfolioItem }>("/api/portfolio", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.item;
  },

  updatePortfolioItem: async (id: string, patch: Record<string, unknown>) => {
    const res = await apiFetch<{ item: PortfolioItem }>(`/api/portfolio/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return res.item;
  },

  deletePortfolioItem: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/portfolio/${id}`, {
      method: "DELETE",
    }),

  // Public Inquiry Submission
  submitInquiry: (inquiry: Record<string, unknown>) =>
    apiFetch("/api/inquiries", {
      method: "POST",
      body: JSON.stringify(inquiry),
    }),

  getInquiries: async () => {
    const res = await apiFetch<{ inquiries: InquiryItem[] }>("/api/inquiries");
    return res.inquiries;
  },

  updateInquiry: async (id: string, patch: Record<string, unknown>) => {
    const res = await apiFetch<{ inquiry: InquiryItem }>(`/api/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return res.inquiry;
  },

  deleteInquiry: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/inquiries/${id}`, {
      method: "DELETE",
    }),

  // Client Gallery Proofing (Public Client Portal)
  getGalleryInfo: (token: string) =>
    apiFetch<{ ok: boolean; published: boolean; name: string; eventName?: string; galleryPublished: boolean }>(
      `/api/gallery/${token}`,
    ),

  verifyGalleryPasscode: (token: string, passcode: string) =>
    apiFetch<{ ok: boolean; client?: ClientItem; photos?: MediaItem[]; submittedAt?: string | null }>(
      `/api/gallery/${token}/verify-passcode`,
      {
        method: "POST",
        body: JSON.stringify({ passcode }),
      },
    ),

  getGalleryMedia: (token: string, passcode: string) =>
    apiFetch<{ ok: boolean; photos: MediaItem[] }>(
      `/api/gallery/${token}/media?passcode=${encodeURIComponent(passcode)}`,
    ),

  openGallery: (token: string, passcode?: string) =>
    apiFetch<{ client?: ClientItem; photos?: MediaItem[]; submittedAt?: string | null }>(
      `/api/gallery/${token}/verify-passcode`,
      {
        method: "POST",
        body: JSON.stringify({ passcode }),
      },
    ),

  selectGalleryMedia: (token: string, data: { passcode: string; mediaId: string; selected: boolean; comment?: string }) =>
    apiFetch<{ ok: boolean }>(`/api/gallery/${token}/select`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitGallerySelection: (token: string, data: { passcode: string; notes?: string }) =>
    apiFetch<{ submission: Record<string, unknown>; count: number }>(`/api/gallery/${token}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin Client Management
  getClients: async (q?: string) => {
    const url = q ? `/api/clients?q=${encodeURIComponent(q)}` : "/api/clients";
    const res = await apiFetch<{ clients: ClientItem[] }>(url);
    return res.clients;
  },

  getClient: (id: string) =>
    apiFetch<{
      client: ClientItem;
      media: MediaItem[];
      submissions: SubmissionItem[];
      timeline: ActivityEventItem[];
    }>(`/api/clients/${id}`),

  createClient: async (data: Record<string, unknown>) => {
    const res = await apiFetch<{ client: ClientItem }>("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  },

  updateClient: async (id: string, patch: Record<string, unknown>) => {
    const res = await apiFetch<{ client: ClientItem }>(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return res;
  },

  deleteClient: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/clients/${id}`, {
      method: "DELETE",
    }),

  signClientMediaUpload: (clientId: string, fileName: string, contentType: string, kind: string = "photo") =>
    apiFetch<{ key: string; uploadUrl: string }>(`/api/clients/${clientId}/media/sign`, {
      method: "POST",
      body: JSON.stringify({ fileName, contentType, kind }),
    }),

  confirmClientMediaUpload: (clientId: string, data: { key: string; fileName: string; contentType?: string; sizeBytes?: number; kind?: string }) =>
    apiFetch<{ media: MediaItem }>(`/api/clients/${clientId}/media`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadClientMediaFile: async (clientId: string, formData: FormData) => {
    const res = await apiFetch<{ media: MediaItem }>(`/api/clients/${clientId}/media/upload`, {
      method: "POST",
      body: formData,
    });
    return res.media;
  },

  // S3 Multipart Upload for Large Videos
  initiateClientMultipartUpload: (
    clientId: string,
    fileName: string,
    contentType: string,
    kind: string = "video",
    sizeBytes?: number,
  ) =>
    apiFetch<{ uploadId: string; key: string }>(`/api/clients/${clientId}/media/multipart/initiate`, {
      method: "POST",
      body: JSON.stringify({ fileName, contentType, kind, sizeBytes }),
    }),

  signClientMultipartPart: (clientId: string, key: string, uploadId: string, partNumber: number) =>
    apiFetch<{ uploadUrl: string; partNumber: number }>(`/api/clients/${clientId}/media/multipart/sign`, {
      method: "POST",
      body: JSON.stringify({ key, uploadId, partNumber }),
    }),

  completeClientMultipartUpload: (
    clientId: string,
    data: {
      key: string;
      uploadId: string;
      fileName: string;
      contentType?: string;
      sizeBytes?: number;
      kind?: string;
      parts: { PartNumber: number; ETag: string }[];
    },
  ) =>
    apiFetch<{ media: MediaItem }>(`/api/clients/${clientId}/media/multipart/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  abortClientMultipartUpload: (clientId: string, key: string, uploadId: string) =>
    apiFetch<{ ok: boolean }>(`/api/clients/${clientId}/media/multipart/abort`, {
      method: "POST",
      body: JSON.stringify({ key, uploadId }),
    }),


  deleteClientMedia: (clientId: string, mediaId: string) =>
    apiFetch<{ ok: boolean }>(`/api/clients/${clientId}/media/${mediaId}`, {
      method: "DELETE",
    }),

  publishClientGallery: (clientId: string, published: boolean) =>
    apiFetch<{ client: ClientItem; galleryPath: string; passcode: string }>(`/api/clients/${clientId}/publish`, {
      method: "POST",
      body: JSON.stringify({ published }),
    }),

  rotateClientPasscode: (clientId: string) =>
    apiFetch<{ passcode: string }>(`/api/clients/${clientId}/rotate-passcode`, {
      method: "POST",
    }),

  getDashboardStats: () =>
    apiFetch<{
      stats: { totalClients: number; activeProjects: number; deliveredProjects: number; newInquiries: number; pendingSubmissions: number };
      clients: ClientItem[];
      inquiries: InquiryItem[];
      portfolio: PortfolioItem[];
      activity: ActivityEventItem[];
    }>("/api/dashboard"),
};
