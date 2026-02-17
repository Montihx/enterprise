
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent-primary text-white hover:bg-accent-primary/80",
        secondary: "border-transparent bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80",
        destructive: "border-transparent bg-accent-danger text-white hover:bg-accent-danger/80",
        outline: "text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /* Added explicit className to fix 'Property className does not exist on type BadgeProps' */
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | null
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }