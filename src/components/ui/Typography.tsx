import type { ElementType, HTMLAttributes, ReactNode } from "react";

type Variant = "display" | "h1" | "h2" | "h3" | "h4" | "body-lg" | "body" | "caption" | "small";

const variantClasses: Record<Variant, string> = {
  display: "font-display text-display font-bold tracking-[-0.04em] leading-[0.96]",
  h1: "font-display text-h1 font-bold tracking-[-0.04em] leading-[1]",
  h2: "font-display text-h2 font-semibold tracking-[-0.03em] leading-[1.08]",
  h3: "font-display text-h3 font-semibold tracking-[-0.02em] leading-[1.12]",
  h4: "font-display text-h4 font-semibold tracking-[-0.01em] leading-[1.18]",
  "body-lg": "font-body text-body-lg font-normal leading-[1.7]",
  body: "font-body text-body font-normal leading-[1.65]",
  caption: "font-body text-caption font-normal leading-[1.5]",
  small: "font-body text-small font-normal leading-[1.4]",
};

type TypographyProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant: Variant;
  children: ReactNode;
};

export function Typography({ as: Component = "p", variant, className = "", children, ...props }: TypographyProps) {
  return (
    <Component className={`${variantClasses[variant]} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
