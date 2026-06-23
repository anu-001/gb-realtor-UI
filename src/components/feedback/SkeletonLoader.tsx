import { cn } from "@/utils/cn";

type SkeletonLoaderProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
};

export function SkeletonLoader({
  width = "100%",
  height = "1rem",
  borderRadius = "12px",
  className,
}: SkeletonLoaderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-surface", className)}
      style={{ width, height, borderRadius }}
    />
  );
}
