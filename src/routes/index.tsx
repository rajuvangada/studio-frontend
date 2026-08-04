import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { AWARDS, STATS } from "@/lib/gk";
import { Reveal } from "@/components/site/Reveal";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  publicMediaUrl,
  publishedPortfolioQuery,
  servicesQuery,
  studioProfileQuery,
  testimonialsQuery,
} from "@/lib/studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GK Digital Studios — Luxury Wedding & Editorial Photography" },
      {
        name: "description",
        content:
          "A luxury photography house shooting cinematic weddings, portraits and editorial stories with a clean, modern editorial eye.",
      },
      { property: "og:title", content: "GK Digital Studios — Luxury Photography" },
      {
        property: "og:description",
        content: "Cinematic weddings, portraits and editorial photography, crafted frame by frame.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useQuery(studioProfileQuery);
  const { data: portfolio = [] } = useQuery(publishedPortfolioQuery);
  const { data: services = [], isLoading: servicesLoading } = useQuery(servicesQuery);
  const { data: testimonials = [] } = useQuery(testimonialsQuery);

  const featured = portfolio.filter((p) => p.show_on_home || p.featured).slice(0, 6);
  const showcase = featured.length ? featured : portfolio.slice(0, 6);

  const disciplines = ["Wedding", "Portrait", "Commercial", "Cinematic"];

  return (
    <SiteLayout>
      <section className="shell flex min-h-[78svh] flex-col justify-center pb-0 pt-36 md:pt-44">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow"
        >
          {profile?.studio_name ?? "GK Digital Studios"}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)] font-display leading-[1.02]"
        >
          Capturing moments.
          <span className="block text-muted-foreground">Creating timeless memories.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base"
        >
          Award-winning wedding, portrait, commercial and cinematic photography by{" "}
          {profile?.owner_name ?? "Govind Kumar Gella"} — Andhra Pradesh, India.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
        >
          {disciplines.map((d) => (
            <li
              key={d}
              className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground"
            >
              {d}
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-wrap items-center gap-3"
        >
          <Link
            to="/portfolio"
            className="btn-base btn-brand group !rounded-full !px-8 !py-4 text-[0.7rem] uppercase tracking-[0.24em]"
          >
            View portfolio
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            to="/contact"
            className="btn-base btn-secondary !rounded-full !px-8 !py-4 text-[0.7rem] uppercase tracking-[0.24em]"
          >
            Book a date
          </Link>
        </motion.div>

        <div className="mt-16 hairline md:mt-20" />
      </section>

      {/* Stats */}
      <section className="shell pt-4 md:pt-6">
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-surface px-8 py-10 text-center">
                <p className="font-display text-4xl text-foreground">{s.value}</p>
                <p className="mt-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Selected work */}
      <section className="shell section-y">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Selected work</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.75rem)] font-display leading-[1.05]">
                Recent stories
              </h2>
            </div>
            <Link
              to="/portfolio"
              className="shrink-0 text-[0.7rem] uppercase tracking-[0.22em] text-brand transition-colors hover:text-brand-soft"
            >
              Full portfolio →
            </Link>
          </div>
        </Reveal>

        {showcase.length === 0 ? (
          <div className="panel mt-14 flex flex-col items-center gap-2 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">New work is being prepared for release.</p>
          </div>
        ) : (
          <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {showcase.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.06}>
                <figure className="lift group relative overflow-hidden rounded-2xl border border-border/60 hover:shadow-[var(--shadow-lift)]">
                  <img
                    src={publicMediaUrl(item.image_url)}
                    alt={item.title}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-background/95 to-transparent p-5">
                    <span className="min-w-0 truncate font-display text-xl">{item.title}</span>
                    <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.2em] text-brand">
                      {item.category}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Services */}
      <section className="hairline shell section-y">
        <Reveal>
          <p className="eyebrow">What we do</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3.75rem)] font-display leading-[1.05]">
            Considered coverage, start to finish
          </h2>
        </Reveal>
        {servicesLoading ? (
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-surface h-48 p-8">
                <div className="skeleton h-6 w-2/3" />
                <div className="skeleton mt-4 h-4 w-full" />
                <div className="skeleton mt-2 h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="panel mt-14 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">Collections are being updated.</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {services.slice(0, 3).map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <article className="card-surface card-interactive lift h-full p-8">
                  <h3 className="font-display text-2xl">{s.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                  {s.price_from && (
                    <p className="mt-6 text-[0.7rem] uppercase tracking-[0.2em] text-brand">
                      From {s.price_from}
                    </p>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="shell section-y">
          <div className="mx-auto max-w-5xl text-center">
            <Reveal>
              <p className="eyebrow">In their words</p>
            </Reveal>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 0.08}>
                  <blockquote className="card-surface h-full p-9 text-left">
                    <p className="max-w-prose font-display text-2xl leading-snug">“{t.quote}”</p>
                    <footer className="mt-6 text-[0.7rem] uppercase tracking-[0.2em] text-brand">
                      {t.author}
                      {t.role ? ` · ${t.role}` : ""}
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Awards */}
      <section className="hairline shell section-y">
        <Reveal>
          <p className="eyebrow">Recognition</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3.75rem)] font-display leading-[1.05]">
            Nationally and internationally awarded
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {AWARDS.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.08}>
              <article className="card-surface card-interactive lift h-full p-8">
                <h3 className="font-display text-xl leading-snug">{a.title}</h3>
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-brand">
                  {a.authority}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.subtitle}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="shell pb-20 pt-8 md:pb-28 md:pt-10">
        <Reveal>
          <div className="glass-strong mx-auto max-w-5xl rounded-3xl px-8 py-16 text-center shadow-[var(--shadow-lg)]">
            <h2 className="text-[clamp(2rem,4vw,3.75rem)] font-display leading-[1.05]">
              Dates fill quietly.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Tell us about the day, the light and the people. We'll tell you what's possible.
            </p>
            <Link
              to="/contact"
              className="btn-base btn-brand mt-9 inline-flex !rounded-full !px-8 !py-4 text-[0.7rem] uppercase tracking-[0.24em]"
            >
              Start an enquiry
            </Link>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
