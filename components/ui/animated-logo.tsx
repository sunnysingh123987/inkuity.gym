import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  className?: string;
}

export function AnimatedLogo({ className = 'h-10 w-auto' }: AnimatedLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Inkuity"
      className={cn(className)}
    />
  );
}
