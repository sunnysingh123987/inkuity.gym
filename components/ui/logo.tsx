import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-9',
}

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
}

export function Logo({ href = '/dashboard', size = 'md', showText = true, className }: LogoProps) {
  const content = (
    <span className={cn('flex items-center gap-2', className)}>
      <img
        src="/logo.png"
        alt="Inkuity"
        className={cn(sizes[size], 'w-auto')}
      />
      {showText && (
        <span className={cn('font-bold text-foreground', textSizes[size])}>
          Inkuity
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center rounded-lg transition-opacity hover:opacity-90">
        {content}
      </Link>
    )
  }

  return content
}
