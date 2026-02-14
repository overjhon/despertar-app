import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-white hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-white hover:bg-destructive/80",
        outline: "text-foreground border-border",
        discount: "border-transparent bg-gradient-to-r from-tertiary to-accent text-tertiary-foreground font-bold",
        verified: "border-transparent bg-primary text-white",
        new: "border-transparent bg-gradient-primary text-white animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
