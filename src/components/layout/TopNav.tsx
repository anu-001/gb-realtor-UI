import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/80 bg-[color-mix(in_srgb,var(--color-bg)_82%,white)]/90 backdrop-blur-xl">
      <div className="app-container relative flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-body font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
            GB &amp; Associates
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 lg:flex">
          {[
            ["Listings", "/#listings"],
            ["Search", "/search"],
            ["Contact", "/request-property"],
          ].map(([label, href]) => (
            <Link
              key={label}
              to={href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <Link
            to="/search"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
          >
            Search
          </Link>
          <Link
            to="/request-property"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            Request property
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
              className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-50 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-modal lg:hidden"
            >
              <div className="grid gap-1">
                {[
                  ["Listings", "/#listings"],
                  ["Contact", "/request-property"],
                  ["Search", "/search"],
                  ["Request property", "/request-property"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    to={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-input px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
