import { api, API_BASE } from "./api";

export const BUCKET = "client-media";

/** Public URL for an asset stored under the public/ prefix of the media bucket. */
export function publicMediaUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const baseUrl = API_BASE.replace(/\/$/, "");
  return `${baseUrl}/uploads/${path}`;
}

export function whatsappHref(number: string | null | undefined, message?: string) {
  const digits = (number ?? "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message ?? "Hello, I'd like to enquire about a booking.");
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatBusinessActivityDescription(raw?: string): string {
  if (!raw) return "Studio activity recorded";
  let desc = raw.trim();

  // Strip technical jargon like "via S3 multipart (242 parts)", "via S3", etc.
  desc = desc.replace(/\s*via\s+S3\s+multipart\s*\(\d+\s*parts\)/gi, "");
  desc = desc.replace(/\s*via\s+S3\s+multipart/gi, "");
  desc = desc.replace(/\s*via\s+S3/gi, "");
  desc = desc.replace(/\s*via\s+presigned\s+PUT/gi, "");
  desc = desc.replace(/media_uploaded/gi, "Media uploaded");
  desc = desc.replace(/client_created/gi, "New client created");
  desc = desc.replace(/selection_submitted/gi, "Client submitted photo selection");

  desc = desc.trim();
  return desc || "Studio activity recorded";
}

export type StudioProfile = {
  id: string;
  studio_name: string;
  studioName?: string;
  owner_name: string | null;
  ownerName?: string | null;
  logo_url: string | null;
  logoUrl?: string | null;
  owner_photo_url?: string | null;
  ownerPhotoUrl?: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  address: string | null;
  business_hours: string | null;
  businessHours?: string | null;
  tagline: string | null;
  about: string | null;
};

export type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  image_url: string;
  sort_order: number;
  published: boolean;
  show_on_home?: boolean;
  featured?: boolean;
  created_at?: string;
};

export type ServiceItem = {
  id: string;
  _id?: string;
  title: string;
  description: string | null;
  category?: string | null;
  priceFrom?: string | null;
  price_from?: string | null;
  coverImageKey?: string | null;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  sortOrder?: number;
  sort_order?: number;
  featured?: boolean;
  published: boolean;
};

export type TestimonialItem = {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  sort_order: number;
  published: boolean;
};

export const studioProfileQuery = {
  queryKey: ["studio-profile"],
  queryFn: async (): Promise<StudioProfile | null> => {
    try {
      const res = await api.getProfile();
      return res as unknown as StudioProfile;
    } catch {
      return {
        id: "default-profile",
        studio_name: "GK Digital Studios",
        owner_name: "Govind Kumar Gella",
        logo_url: null,
        phone: "+91 98765 43210",
        whatsapp: "+91 98765 43210",
        email: "studio@gkdigitalstudios.com",
        instagram: "@gk_digital_studios",
        address: "Andhra Pradesh, India",
        business_hours: "Mon - Sat: 9:00 AM - 8:00 PM",
        tagline: "Cinematic photography for once-in-a-lifetime days.",
        about: "Award-winning wedding, portrait, and cinematic photography studio.",
      };
    }
  },
};

export const publishedPortfolioQuery = {
  queryKey: ["portfolio", "published"],
  queryFn: async (): Promise<PortfolioItem[]> => {
    try {
      const data = await api.getPortfolio();
      return Array.isArray(data) ? (data as unknown as PortfolioItem[]) : [];
    } catch {
      return [];
    }
  },
};

export const servicesQuery = {
  queryKey: ["services", "published"],
  queryFn: async (): Promise<ServiceItem[]> => {
    try {
      const data = await api.getServices();
      return Array.isArray(data) ? (data as unknown as ServiceItem[]) : [];
    } catch {
      return [];
    }
  },
};

export const testimonialsQuery = {
  queryKey: ["testimonials", "published"],
  queryFn: async (): Promise<TestimonialItem[]> => {
    return [];
  },
};
