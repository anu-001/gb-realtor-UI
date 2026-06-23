import type { ElementType, HTMLAttributes, ReactNode } from "react";

type Variant = "display" | "h1" | "h2" | "h3" | "h4" | "body-lg" | "body" | "caption" | "small";

const variantClasses: Record<Variant, string> = {
  display: "font-display text-display font-bold",
  h1: "font-display text-h1 font-bold",
  h2: "font-display text-h2 font-semibold",
  h3: "font-display text-h3 font-semibold",
  h4: "font-display text-h4 font-semibold",
  "body-lg": "font-body text-body-lg font-normal",
  body: "font-body text-body font-normal",
  caption: "font-body text-caption font-normal",
  small: "font-body text-small font-normal",
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
