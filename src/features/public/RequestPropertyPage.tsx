import { motion } from "framer-motion";
import { RequestPropertyForm } from "@/components/leads/RequestPropertyForm";
import { pageTransition } from "@/utils/motion";

export default function RequestPropertyPage() {
  return (
    <motion.div {...pageTransition} className="mx-auto max-w-5xl space-y-8 py-4 md:space-y-10 md:py-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Request a Property
        </p>
        <h1 className="font-display text-h1 text-[var(--color-text-primary)]">
          Tell us what you’re after.
        </h1>
        <p className="max-w-xl text-body-lg text-[var(--color-text-secondary)]">
          Share the brief. We’ll handle the search.
        </p>
      </div>

      <RequestPropertyForm
        compact
        headline="Request a Property"
        subheading="A clear brief gets a sharper match."
        submitLabel="Send Request"
      />
    </motion.div>
  );
}
