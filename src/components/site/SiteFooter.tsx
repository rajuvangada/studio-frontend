import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

import { studioProfileQuery } from "@/lib/studio";

export function SiteFooter() {
  const { data: profile } = useQuery(studioProfileQuery);

  return (
    <footer className="hairline mt-28 bg-surface/50 md:mt-32">
      <div className="shell grid gap-12 py-16 md:grid-cols-4 md:py-20">
        <div className="md:col-span-2">
          <p className="font-display text-2xl tracking-[0.18em] uppercase text-brand-gradient md:text-3xl">
            {profile?.studio_name ?? "GK Digital Studios"}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {profile?.tagline ?? "Cinematic photography for once-in-a-lifetime days."}
          </p>
        </div>

        <div>
          <p className="eyebrow">Studio</p>
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

        <div>
          <p className="eyebrow">Reach us</p>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {profile?.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-brand" />
                <a
                  href={`tel:${profile.phone}`}
                  className="min-w-0 truncate transition-colors hover:text-brand"
                >
                  {profile.phone}
                </a>
              </li>
            )}
            {profile?.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-brand" />
                <a
                  href={`mailto:${profile.email}`}
                  className="min-w-0 truncate transition-colors hover:text-brand"
                >
                  {profile.email}
                </a>
              </li>
            )}
            {profile?.instagram && (
              <li className="flex items-center gap-2">
                <Instagram className="size-4 shrink-0 text-brand" />
                <a
                  href={
                    profile.instagram.startsWith("http")
                      ? profile.instagram
                      : `https://instagram.com/${profile.instagram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-brand"
                >
                  @gk_digital_studios
                </a>
              </li>
            )}
            {profile?.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{profile.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="hairline">
        <div className="shell flex flex-col gap-2 py-6 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {profile?.studio_name ?? "GK Digital Studios"}
          </span>
          <Link to="/auth" className="transition-colors hover:text-brand">
            Studio login
          </Link>
        </div>
      </div>
    </footer>
  );
}
