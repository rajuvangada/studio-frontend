import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { studioProfileQuery, whatsappHref } from "@/lib/studio";

export function WhatsAppFab() {
  const { data: profile } = useQuery(studioProfileQuery);
  const number = profile?.whatsapp || profile?.phone;
  if (!number) return null;

  return (
    <motion.a
      href={whatsappHref(
        number,
        `Hi ${profile?.studio_name ?? ""}, I'd like to check your availability.`,
      )}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.04, y: -1 }}
      className="glass-strong fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-brand shadow-[var(--shadow-brand)] lift md:bottom-6 md:right-6"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="size-4" />
      <span className="hidden sm:inline">WhatsApp</span>
    </motion.a>
  );
}
