import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { servicesQuery } from "@/lib/studio";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Collections — GK Digital Studios" },
      {
        name: "description",
        content:
          "Wedding, portrait and editorial photography collections from GK Digital Studios, with full-day coverage, films and hand-finished albums.",
      },
      { property: "og:title", content: "Services & Collections — GK Digital Studios" },
      {
        property: "og:description",
        content: "Photography collections built around your day, your light and your people.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services = [], isLoading } = useQuery(servicesQuery);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title="Collections & Services"
        intro="Cinematic photography and video coverage shaped around your day. Everything below can be customized to your requirements."
      />

      <section className="shell pb-24">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card-surface h-72 p-8">
                <div className="skeleton h-48 w-full rounded-xl" />
                <div className="skeleton mt-5 h-6 w-2/3" />
                <div className="skeleton mt-3 h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((s, i) => {
              const coverUrl = s.coverImageUrl || s.cover_image_url || null;
              return (
                <Reveal key={s.id || s._id || i} delay={i * 0.06}>
                  <article className="card-surface card-interactive lift flex h-full flex-col justify-between overflow-hidden p-8">
                    <div>
                      {coverUrl && (
                        <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-surface-2">
                          <img
                            src={coverUrl}
                            alt={s.title}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {s.category && <span className="chip-brand text-[0.65rem]">{s.category}</span>}
                        {s.featured && <span className="chip-brand border-brand/50 bg-brand/10 text-brand text-[0.65rem]">Featured</span>}
                        {(s.priceFrom || s.price_from) && <span className="chip-secondary text-[0.65rem]">{s.priceFrom || s.price_from}</span>}
                      </div>
                      <h2 className="mt-4 font-display text-2xl text-foreground md:text-3xl">{s.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {s.description}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                      <Link
                        to="/contact"
                        className="btn-base btn-ghost text-xs text-brand hover:text-brand"
                      >
                        Request Quote &rarr;
                      </Link>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}

        <Reveal>
          <div className="hairline mt-20 pt-14 text-center">
            <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display leading-[1.05]">
              Something bespoke?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Destination weddings, brand campaigns and multi-day celebrations are quoted
              individually.
            </p>
            <Link
              to="/contact"
              className="btn-base btn-secondary mt-8 inline-flex !rounded-full border-brand/40 !px-8 !py-4 text-[0.7rem] uppercase tracking-[0.22em] text-brand hover:!bg-brand hover:!text-primary-foreground"
            >
              Request a quote
            </Link>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
