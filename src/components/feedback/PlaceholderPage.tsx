import type { ReactNode } from "react";
import { Typography } from "@/components/ui/Typography";

type PlaceholderPageProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PlaceholderPage({ title, description, action }: PlaceholderPageProps) {
  return (
    <section className="app-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-xl rounded-[var(--radius-modal)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-modal)]">
        <Typography as="h1" variant="h3" className="text-[var(--color-text-primary)]">
          {title}
        </Typography>
        <Typography variant="body" className="mt-3 text-[var(--color-text-secondary)]">
          {description}
        </Typography>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </section>
  );
}
