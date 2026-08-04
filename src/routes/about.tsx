import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Award, BadgeCheck, Camera, Instagram, Mail, MapPin, Phone, User } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { AWARDS, HIGHLIGHTS, OWNER_NAME, OWNER_TITLE, SKILLS } from "@/lib/gk";
import { studioProfileQuery, whatsappHref } from "@/lib/studio";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Studio — GK Digital Studios" },
      {
        name: "description",
        content:
          "Professional photography and cinematography studio specializing in weddings, editorial portraits, and visual storytelling.",
      },
      { property: "og:title", content: "About GK Digital Studios" },
      {
        property: "og:description",
        content:
          "Award-winning photographer and cinematographer creating elegant, emotional and timeless visual stories.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: profile } = useQuery(studioProfileQuery);
  const [imageError, setImageError] = useState(false);

  const ownerName = profile?.ownerName || profile?.owner_name || OWNER_NAME;
  const ownerTitle = profile?.tagline || OWNER_TITLE;
  const ownerPhoto = profile?.ownerPhotoUrl || profile?.owner_photo_url || null;
  const aboutText = profile?.about || "Award-winning wedding, portrait, and cinematic photography studio.";

  return (
    <SiteLayout>
      <PageHero eyebrow="About the founder" title={ownerName} intro={ownerTitle} />

      <section className="shell pb-24">
        <div className="grid gap-14 md:grid-cols-2 md:items-center">
          <Reveal>
            {ownerPhoto && !imageError ? (
              <img
                src={ownerPhoto}
                alt={`${ownerName}, founder of ${profile?.studioName || profile?.studio_name || "GK Digital Studios"}`}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full aspect-[3/4] max-h-[600px] rounded-2xl border border-border object-cover shadow-[var(--shadow-lift)]"
              />
            ) : (
              <div className="flex aspect-[3/4] max-h-[600px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface-2 p-12 text-center text-muted-foreground shadow-sm">
                <div className="flex size-20 items-center justify-center rounded-full bg-surface border border-border">
                  <User className="size-10 text-brand" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">{ownerName}</h3>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {profile?.studioName || profile?.studio_name || "GK Digital Studios"}
                  </p>
                </div>
              </div>
            )}
          </Reveal>
          <Reveal delay={0.1}>
            <div className="max-w-prose space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p className="text-base text-foreground whitespace-pre-line">
                {aboutText}
              </p>
              <p className="text-[0.7rem] uppercase tracking-[0.22em] text-brand">
                {ownerName} · Founder &amp; Creative Director
              </p>

              {/* Dynamic Contact details */}
              <div className="mt-8 space-y-3 pt-6 border-t border-border">
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-xs text-foreground">
                    <Phone className="size-4 text-brand shrink-0" />
                    <a href={`tel:${profile.phone.replace(/[^\d+]/g, "") || profile.phone}`} className="hover:text-brand">
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile?.email && (
                  <div className="flex items-center gap-3 text-xs text-foreground">
                    <Mail className="size-4 text-brand shrink-0" />
                    <a href={`mailto:${profile.email}`} className="hover:text-brand">
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile?.instagram && (
                  <div className="flex items-center gap-3 text-xs text-foreground">
                    <Instagram className="size-4 text-brand shrink-0" />
                    <a
                      href={
                        profile.instagram.startsWith("http")
                          ? profile.instagram
                          : `https://instagram.com/${profile.instagram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand"
                    >
                      Instagram
                    </a>
                  </div>
                )}
                {profile?.address && (
                  <div className="flex items-center gap-3 text-xs text-foreground">
                    <MapPin className="size-4 text-brand shrink-0" />
                    <a
                      href={
                        profile.address.startsWith("http")
                          ? profile.address
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand"
                    >
                      Location
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Highlights */}
        <div className="mt-24">
          <Reveal>
            <p className="eyebrow">Credentials</p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,3rem)] font-display leading-[1.05]">
              Professional highlights
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {HIGHLIGHTS.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.06}>
                <div className="card-surface h-full p-8">
                  <p className="eyebrow">{item.label}</p>
                  <p className="mt-4 font-display text-2xl text-foreground">{item.value}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Awards */}
        <div className="mt-24">
          <Reveal>
            <p className="eyebrow">Recognition</p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,3rem)] font-display leading-[1.05]">
              Awards &amp; certifications
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {AWARDS.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.06}>
                <article className="card-surface card-interactive lift h-full p-8">
                  <Award className="size-5 text-brand" />
                  <h3 className="mt-5 font-display text-xl leading-snug">{a.title}</h3>
                  <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] text-brand">
                    {a.authority}
                  </p>
                  <p className="mt-4 text-sm font-medium text-foreground">{a.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mt-24">
          <Reveal>
            <p className="eyebrow">Expertise</p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,3rem)] font-display leading-[1.05]">
              Craft &amp; tooling
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((skill, i) => (
              <Reveal key={skill} delay={i * 0.04}>
                <div className="panel flex h-full items-start gap-3 p-5">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                  <p className="text-sm leading-snug text-foreground">{skill}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
