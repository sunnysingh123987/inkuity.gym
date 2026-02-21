import { cn } from "@/lib/utils"

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-brand-cyan-500/30 border-t-brand-cyan-500",
        sizes[size],
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loader size="md" />
    </div>
  )
}
