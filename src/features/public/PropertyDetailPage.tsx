import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getPublicPropertyById } from "@/services/properties.service";
import { RichTextContent } from "@/components/data-display/RichTextContent";
import { RequestPropertyForm } from "@/components/leads/RequestPropertyForm";
import { StatusBadge } from "@/components/property/StatusBadge";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import NotFoundPage from "@/features/public/NotFoundPage";
import { htmlTextLength } from "@/utils/html-text-length";
const COLLAPSED_DESCRIPTION_HEIGHT = 240;

function PropertyDescription({ description }: { description?: string | null }) {
  const content = description ?? "";
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(COLLAPSED_DESCRIPTION_HEIGHT);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const textLength = htmlTextLength(content);
  const hasContent = textLength > 0;

  useEffect(() => {
    const element = contentRef.current;
    if (!element || !hasContent) {
      return undefined;
    }

    const measure = () => {
      setContentHeight(element.scrollHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [content, hasContent]);

  if (!hasContent) {
    return (
      <div className="mt-4 text-body text-[var(--color-text-muted)]">
        No description provided
      </div>
    );
  }

  const isCollapsed = !expanded && contentHeight > COLLAPSED_DESCRIPTION_HEIGHT;
  const displayHeight = isCollapsed ? COLLAPSED_DESCRIPTION_HEIGHT : contentHeight;

  return (
    <div className="mt-4">
      <div className="relative">
        <motion.div
          initial={false}
          animate={{ height: displayHeight }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ overflow: "hidden", maxHeight: displayHeight }}
        >
          <div ref={contentRef}>
            <RichTextContent html={content} className="property-description" />
          </div>
        </motion.div>
        {isCollapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-surface)] to-transparent" />
        ) : null}
      </div>
      {contentHeight > COLLAPSED_DESCRIPTION_HEIGHT ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-sm font-semibold text-[var(--color-accent)]"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const propertyQuery = useQuery({
    queryKey: ["public-property", id],
    queryFn: () => getPublicPropertyById(id ?? ""),
    enabled: Boolean(id),
  });

  if (propertyQuery.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <SkeletonLoader height="420px" />
          <SkeletonLoader height="24px" width="60%" />
          <SkeletonLoader height="16px" width="40%" />
        </div>
        <SkeletonLoader height="520px" />
      </div>
    );
  }

  if (propertyQuery.error || !propertyQuery.data) {
    return <NotFoundPage />;
  }

  const property = propertyQuery.data;

  if (!property.publishedAt) {
    return <NotFoundPage />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <img
          src={property.thumbnails?.[0]?.url ?? "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80"}
          alt={typeof property.thumbnails?.[0]?.altText === "string" ? property.thumbnails[0].altText : property.title}
          className="h-[420px] w-full rounded-card object-cover shadow-card"
          loading="lazy"
          decoding="async"
        />
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="Published" />
            <StatusBadge status={property.listingType} />
          </div>
          <h1 className="mt-4 font-display text-h2">{property.title}</h1>
          <p className="mt-2 text-body-lg text-[var(--color-text-secondary)]">
            {property.area}, {property.city}, {property.state}
          </p>
          <PropertyDescription description={property.description} />
        </div>
      </div>
      <div className="space-y-4">
        <RequestPropertyForm
          propertyId={property.id}
          propertyTitle={property.title}
          preferredLocation={`${property.area}, ${property.city}`}
          headline="Request this property"
          subheading="Share your details and we’ll respond with next steps within 24 hours."
          submitLabel="Send request"
        />
      </div>
    </div>
  );
}
