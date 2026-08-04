import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { GOOGLE_MAPS_URL, SERVICE_OPTIONS } from "@/lib/gk";
import { studioProfileQuery, whatsappHref } from "@/lib/studio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Bookings — GK Digital Studios" },
      {
        name: "description",
        content:
          "Check availability with GK Digital Studios. Send an enquiry with your date and location, or message the studio on WhatsApp.",
      },
      { property: "og:title", content: "Contact GK Digital Studios" },
      { property: "og:description", content: "Check date availability and request a quote." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  event_type: z.string().trim().max(80).optional().or(z.literal("")),
  event_date: z.string().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
});

type FormValues = z.infer<typeof schema>;

function ContactPage() {
  const { data: profile } = useQuery(studioProfileQuery);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await api.submitInquiry({
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        event_type: values.event_type || null,
        event_date: values.event_date ? values.event_date : null,
        message: values.message,
      });
    },
    onSuccess: () => {
      toast.success("Enquiry sent — we'll reply within two working days.");
      reset();
    },
    onError: (e: Error) => toast.error(e.message || "Could not send your enquiry."),
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="Check your date"
        intro="Share a few details and we'll come back with availability and a tailored quote."
      />

      <section className="shell pb-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>
            <form
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="card-surface p-8 md:p-10"
            >
              {mutation.isSuccess && (
                <div className="chip-success mb-6 flex items-center gap-2 !rounded-xl px-4 py-3 text-xs">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Enquiry sent — we'll reply within two working days.
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="field-label">Name</label>
                  <Input className="field" placeholder="Your full name" {...register("name")} />
                  {errors.name && (
                    <p className="field-hint mt-2 text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <Input className="field" placeholder="you@email.com" {...register("email")} />
                  {errors.email && (
                    <p className="field-hint mt-2 text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <Input className="field" placeholder="Optional" {...register("phone")} />
                  <p className="field-hint mt-2">So we can reach you quickly if needed.</p>
                </div>
                <div>
                  <label className="field-label">Event type</label>
                  <select className="field" defaultValue="" {...register("event_type")}>
                    <option value="">Select a service</option>
                    {SERVICE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="field-label">Event date</label>
                  <Input type="date" className="field" {...register("event_date")} />
                </div>
                <div className="md:col-span-2">
                  <label className="field-label">Your story</label>
                  <Textarea
                    rows={6}
                    className="field"
                    placeholder="Where is it, who's there, and what should we know?"
                    {...register("message")}
                  />
                  {errors.message && (
                    <p className="field-hint mt-2 text-destructive">{errors.message.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className={cn(
                  "btn-base btn-brand mt-8 w-full !rounded-full !px-8 !py-4 text-[0.7rem] uppercase tracking-[0.24em] md:w-auto",
                )}
              >
                {mutation.isPending ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          </Reveal>

          <Reveal delay={0.1}>
            <aside className="card-surface h-full p-8 md:p-10">
              <p className="eyebrow">Studio</p>
              <ul className="mt-6 space-y-5 text-sm text-muted-foreground">
                {profile?.phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="size-4 shrink-0 text-brand" />
                    <a href={`tel:${profile.phone}`} className="min-w-0 truncate hover:text-brand">
                      {profile.phone}
                    </a>
                  </li>
                )}
                {profile?.email && (
                  <li className="flex items-center gap-3">
                    <Mail className="size-4 shrink-0 text-brand" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="min-w-0 truncate hover:text-brand"
                    >
                      {profile.email}
                    </a>
                  </li>
                )}
                {profile?.instagram && (
                  <li className="flex items-center gap-3">
                    <Instagram className="size-4 shrink-0 text-brand" />
                    <a
                      href={
                        profile.instagram.startsWith("http")
                          ? profile.instagram
                          : `https://instagram.com/${profile.instagram.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand"
                    >
                      @gk_digital_studios
                    </a>
                  </li>
                )}
                {profile?.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                    <a
                      href={GOOGLE_MAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand"
                    >
                      {profile.address} · View on Google Maps
                    </a>
                  </li>
                )}
              </ul>

              {profile?.business_hours && (
                <div className="hairline mt-8 pt-8">
                  <p className="eyebrow">Hours</p>
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                    {profile.business_hours}
                  </p>
                </div>
              )}

              {(profile?.whatsapp || profile?.phone) && (
                <a
                  href={whatsappHref(profile?.whatsapp || profile?.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-base btn-secondary mt-8 inline-flex !rounded-full border-brand/40 text-[0.7rem] uppercase tracking-[0.2em] text-brand hover:!bg-brand hover:!text-primary-foreground"
                >
                  <MessageCircle className="size-4" />
                  Message on WhatsApp
                </a>
              )}
            </aside>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
