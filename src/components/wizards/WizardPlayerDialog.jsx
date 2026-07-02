import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function WizardPlayerDialog({ wizard, open, onOpenChange, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open, wizard?.id]);

  if (!wizard) return null;
  const steps = wizard.steps || [];
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const finish = () => {
    onComplete?.(wizard);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-[28px] border-0 shadow-2xl max-w-md p-0 overflow-hidden" dir="rtl">
        {step?.image_url && (
          <img src={step.image_url} alt={step.title || ''} className="w-full h-44 object-cover" />
        )}
        <div className="p-6 pt-4 space-y-4 text-right">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              שלב {stepIndex + 1} מתוך {steps.length || 1}
            </span>
            <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground underline">
              דלג על הסיור
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">{step?.title || wizard.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {step?.description || wizard.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
              />
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-2xl font-semibold bg-background"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex(i => i - 1)}
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>
            {isLast ? (
              <Button className="flex-1 h-11 rounded-2xl font-semibold" onClick={finish}>
                <Check className="w-4 h-4" />
                סיום
              </Button>
            ) : (
              <Button className="flex-1 h-11 rounded-2xl font-semibold" onClick={() => setStepIndex(i => i + 1)}>
                הבא
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}