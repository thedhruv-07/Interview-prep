import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Consolidates what used to be 7 independently hand-rolled button
// classNames across the app into one variant system. Plain inline text
// actions (nav "Sign in", footer nav links) are deliberately left out —
// those are text links, not buttons, and forcing them into pill styling
// would be a UX regression, not a consistency fix.
// Shared hover:scale + text-sm live on the BASE string, not per-variant/size,
// so every button gets the same tactile hover feel and font size regardless
// of which variant/size it uses — the previous version left "lg" without an
// explicit text-sm and only gave "inverse" a hover:scale, which meant
// individual call sites (MagneticButton's own shadow, dashboard's own
// hover:scale) had to bolt extras back on to compensate, quietly
// reintroducing distinct per-instance styles.
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-gradient-brand text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:opacity-90",
        outline: "border border-border text-foreground hover:bg-muted",
        inverse: "bg-background text-foreground",
      },
      size: {
        sm: "px-4 py-1.5",
        md: "px-4 py-2",
        lg: "px-6 py-3",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
