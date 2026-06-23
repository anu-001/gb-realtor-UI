import { ChevronRight } from "lucide-react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Breadcrumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <a href={item.href} className="transition hover:text-[var(--color-text-primary)]">
                {item.label}
              </a>
            ) : (
              <span className={isLast ? "text-[var(--color-text-primary)]" : ""}>{item.label}</span>
            )}
            {!isLast ? <ChevronRight className="h-4 w-4" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
