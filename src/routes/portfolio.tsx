import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { publicMediaUrl, publishedPortfolioQuery } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — GK Digital Studios Photography" },
      {
        name: "description",
        content:
          "A curated archive of weddings, portraits and editorial commissions photographed by GK Digital Studios.",
      },
      { property: "og:title", content: "Portfolio — GK Digital Studios" },
      {
        property: "og:description",
        content:
          "Weddings, portraits and editorial commissions photographed in cinematic low light.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: items = [], isLoading } = useQuery(publishedPortfolioQuery);
  const [active, setActive] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Portfolio"
        title="An archive of light"
        intro="Every commission is shot as a film — a sequence, not a set of pictures."
      />

      <section className="shell pb-24">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  "rounded-full border px-5 py-2 text-[0.68rem] uppercase tracking-[0.2em] transition-colors",
                  active === c
                    ? "border-brand bg-brand text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-brand/50 hover:text-brand",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn("skeleton", i % 2 === 0 ? "h-72" : "h-96")} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel mt-16 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No published work in this category yet.</p>
          </div>
        ) : (
          <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={(i % 6) * 0.05}>
                <figure className="lift group relative overflow-hidden rounded-2xl border border-border/60 hover:shadow-[var(--shadow-lift)]">
                  <img
                    src={publicMediaUrl(item.image_url)}
                    alt={item.title}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-background/95 to-transparent p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="truncate font-display text-xl">{item.title}</p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-brand">
                      {item.category}
                    </p>
                    {item.description && (
                      <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
