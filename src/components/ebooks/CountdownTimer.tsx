import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 12,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset to 24 hours when it reaches 0
          return { hours: 23, minutes: 59, seconds: 59 };
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
      <Clock className="w-5 h-5 text-destructive animate-pulse" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Oferta termina em:</span>
        <span className="text-lg font-bold text-destructive font-mono">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
};
