import { motion } from "framer-motion";
import { PublicRequestPropertyForm } from "@/components/leads/PublicRequestPropertyForm";
import { pageTransition } from "@/utils/motion";

export default function RequestPropertyPage() {
  return (
    <motion.div {...pageTransition} className="mx-auto max-w-5xl space-y-8 py-4 md:space-y-10 md:py-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Request a Property
        </p>
        <h1 className="font-display text-h1 text-[var(--color-text-primary)]">
          Tell us what you’re looking for.
        </h1>
        <p className="max-w-xl text-body-lg text-[var(--color-text-secondary)]">
          Share the brief in your own words. We’ll follow up with a sharper match.
        </p>
      </div>

      <PublicRequestPropertyForm />
    </motion.div>
  );
}
