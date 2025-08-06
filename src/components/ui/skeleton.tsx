// src/components/ui/skeleton.tsx

import { cn } from "../../lib/utils" // <-- CORREÇÃO AQUI

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
