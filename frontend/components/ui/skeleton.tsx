
// Added React import
import React from 'react';
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-bg-tertiary via-white/5 to-bg-tertiary bg-[length:200%_100%] transition-colors",
        className
      )}
      style={{
        animationDuration: '2s'
      }}
      {...props}
    />
  )
}

export { Skeleton }