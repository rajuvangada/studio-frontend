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
        title="Collections"
        intro="Coverage shaped around the day rather than a package sheet. Everything below can be tailored."
      />

      <section className="shell pb-24">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card-surface h-56 p-10">
                <div className="skeleton h-6 w-24 rounded-full" />
                <div className="skeleton mt-5 h-8 w-2/3" />
                <div className="skeleton mt-4 h-4 w-full" />
                <div className="skeleton mt-2 h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="panel px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">Collections are being updated.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.06}>
                <article className="card-surface card-interactive lift flex h-full flex-col justify-between p-10">
                  <div>
                    {s.price_from && <span className="chip-brand">{s.price_from}</span>}
                    <h2 className="mt-5 font-display text-3xl">{s.title}</h2>
                    <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
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
