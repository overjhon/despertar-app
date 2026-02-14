import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress = ({ currentStep, totalSteps }: StepProgressProps) => {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 border-2
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isCurrent ? 'bg-primary/20 border-primary text-primary scale-110' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted border-muted-foreground/20 text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                <span className="text-xs mt-2 text-muted-foreground">
                  {step === 1 && "Conta"}
                  {step === 2 && "Instalar"}
                  {step === 3 && "Pronto!"}
                </span>
              </div>
              {step < totalSteps && (
                <div className="flex-1 h-0.5 mx-2 -mt-6">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
