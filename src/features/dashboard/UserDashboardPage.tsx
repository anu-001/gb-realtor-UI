import { ArrowRight, Bell, Heart, Search, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store";
import { cn } from "@/utils/cn";

const shortcuts = [
  {
    label: "Saved listings",
    description: "Open homes you have bookmarked and keep track of them in one place.",
    to: "/dashboard/saved",
    icon: Heart,
  },
  {
    label: "Saved searches",
    description: "Review the searches you want to revisit without rebuilding filters.",
    to: "/dashboard/searches",
    icon: Search,
  },
  {
    label: "Property alerts",
    description: "Manage alerts so new matches reach you as soon as they appear.",
    to: "/dashboard/alerts",
    icon: Bell,
  },
  {
    label: "Profile settings",
    description: "Keep your contact details and account preferences up to date.",
    to: "/dashboard/profile",
    icon: User,
  },
];

const quickLinks = [
  { label: "Browse listings", to: "/search" },
  { label: "Request a property", to: "/request-property" },
  { label: "Security settings", to: "/dashboard/security" },
];

export default function UserDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const firstName = user?.fullName?.split(/\s+/)[0] ?? "there";

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-surface)_96%,white)_0%,var(--color-surface)_100%)] p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Dashboard</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Welcome back, {firstName}.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Keep your search, saved homes, and account preferences organized from one calm workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {quickLinks.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition",
                  index === 0
                    ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]",
                )}
              >
                {link.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))] text-[var(--color-accent)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-secondary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
              </div>

              <div className="mt-5 space-y-2">
                <h2 className="font-display text-h4 text-[var(--color-text-primary)]">{item.label}</h2>
                <p className="text-caption text-[var(--color-text-secondary)]">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <h2 className="font-display text-h4 text-[var(--color-text-primary)]">What you can do next</h2>
          <p className="mt-2 max-w-2xl text-body text-[var(--color-text-secondary)]">
            Continue your search, save promising homes, and keep your account ready for the next enquiry.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Open the listings page and continue browsing.",
              "Save a property before it slips away.",
              "Set an alert for the area you care about.",
              "Update your profile so enquiries reach you quickly.",
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Account</h2>
          <dl className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
              <dt className="text-caption text-[var(--color-text-secondary)]">Signed in as</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">{user?.fullName ?? "Workspace user"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
              <dt className="text-caption text-[var(--color-text-secondary)]">Role</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">{user?.role ?? user?.roles?.[0]?.code ?? "User"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-caption text-[var(--color-text-secondary)]">Security</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">Keep your session secure</dd>
            </div>
          </dl>

          <div className="mt-6">
            <Link
              to="/dashboard/security"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
            >
              Open security
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
