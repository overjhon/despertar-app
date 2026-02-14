import { Badge } from '@/components/ui/badge';

interface PriceTagProps {
  originalPrice: number;
  currentPrice: number;
  discountPercentage: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PriceTag = ({
  originalPrice,
  currentPrice,
  discountPercentage,
  size = 'md',
}: PriceTagProps) => {
  const sizeClasses = {
    sm: {
      original: 'text-xs',
      current: 'text-lg',
      badge: 'text-xs',
    },
    md: {
      original: 'text-sm',
      current: 'text-2xl',
      badge: 'text-sm',
    },
    lg: {
      original: 'text-base',
      current: 'text-3xl',
      badge: 'text-base',
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <Badge 
        variant="destructive" 
        className={`${sizeClasses[size].badge} w-fit animate-pulse`}
      >
        -{discountPercentage}% OFF 🔥
      </Badge>
      <div className="flex items-center gap-3">
        <span className={`${sizeClasses[size].original} line-through text-muted-foreground`}>
          R$ {originalPrice.toFixed(2)}
        </span>
        <span className={`${sizeClasses[size].current} font-bold text-primary`}>
          R$ {currentPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
