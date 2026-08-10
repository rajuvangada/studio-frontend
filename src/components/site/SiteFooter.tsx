import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

import { studioProfileQuery } from "@/lib/studio";

export function SiteFooter() {
  const { data: profile } = useQuery(studioProfileQuery);
  const studioName = profile?.studioName || profile?.studio_name || "GK Digital Studios";
  const tagline = profile?.tagline || "Cinematic photography for once-in-a-lifetime days.";

  return (
    <footer className="hairline mt-28 bg-surface/50 md:mt-32">
      <div className="shell grid gap-10 py-16 md:grid-cols-3 lg:gap-16 md:py-20 md:items-start">
        {/* Column 1: Studio Info */}
        <div className="flex flex-col justify-start">
          <p className="font-display text-2xl tracking-[0.18em] uppercase text-brand-gradient md:text-3xl">
            {studioName}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tagline}
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div className="flex flex-col justify-start md:items-center">
          <div>
            <p className="eyebrow">Quick Links</p>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/portfolio" className="transition-colors hover:text-brand">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition-colors hover:text-brand">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors hover:text-brand">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-brand">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Column 3: Reach Us */}
        <div className="flex flex-col justify-start md:items-start">
          <p className="eyebrow">Reach Us</p>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {profile?.phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-brand" />
                <a
                  href={`tel:${profile.phone.replace(/[^\d+]/g, "") || profile.phone}`}
                  className="transition-colors hover:text-brand"
                >
                  {profile.phone}
                </a>
              </li>
            )}
            {profile?.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-brand" />
                <a
                  href={`mailto:${profile.email}`}
                  className="transition-colors hover:text-brand"
                >
                  {profile.email}
                </a>
              </li>
            )}
            {profile?.instagram && (
              <li className="flex items-center gap-2.5">
                <Instagram className="size-4 shrink-0 text-brand" />
                <a
                  href={
                    profile.instagram.startsWith("http")
                      ? profile.instagram
                      : `https://instagram.com/${profile.instagram.replace(/^@/, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand"
                >
                  Instagram
                </a>
              </li>
            )}
            {profile?.address && (
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-brand" />
                <a
                  href={
                    profile.address.startsWith("http")
                      ? profile.address
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand"
                  title="Open Google Maps location"
                >
                  Location
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="hairline">
        <div className="shell flex flex-col gap-2 py-6 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {studioName}
          </span>
          <Link to="/auth" className="transition-colors hover:text-brand sm:mr-28 lg:mr-36">
            Studio login
          </Link>
        </div>
      </div>
    </footer>
  );
}
