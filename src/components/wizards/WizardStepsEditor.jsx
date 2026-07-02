import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Image, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

export default function WizardStepsEditor({ steps, onChange }) {
  const [uploadingIndex, setUploadingIndex] = useState(-1);

  const updateStep = (i, patch) => {
    const next = steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange(next);
  };

  const move = (i, dir) => {
    const next = [...steps];
    const [item] = next.splice(i, 1);
    next.splice(i + dir, 0, item);
    onChange(next);
  };

  const handleImage = async (i, file) => {
    if (!file) return;
    setUploadingIndex(i);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateStep(i, { image_url: file_url });
    setUploadingIndex(-1);
  };

  return (
    <div className="space-y-3" dir="rtl">
      {steps.map((step, i) => (
        <div key={i} className="rounded-2xl border border-border/60 p-3 space-y-2 bg-background/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">שלב {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-muted-foreground disabled:opacity-30" aria-label="הזז למעלה">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="p-1 text-muted-foreground disabled:opacity-30" aria-label="הזז למטה">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => onChange(steps.filter((_, idx) => idx !== i))} className="p-1 text-destructive" aria-label="מחק שלב">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <Input
            placeholder="כותרת השלב"
            value={step.title || ''}
            onChange={(e) => updateStep(i, { title: e.target.value })}
          />
          <Textarea
            placeholder="תיאור השלב"
            rows={2}
            value={step.description || ''}
            onChange={(e) => updateStep(i, { description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer">
              {uploadingIndex === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
              {step.image_url ? 'החלף תמונה' : 'הוסף תמונה'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(i, e.target.files?.[0])} />
            </label>
            {step.image_url && (
              <>
                <img src={step.image_url} alt="" className="h-8 w-12 object-cover rounded-md" />
                <button type="button" onClick={() => updateStep(i, { image_url: '' })} className="text-xs text-destructive underline">
                  הסר
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-2xl"
        onClick={() => onChange([...steps, { title: '', description: '', image_url: '' }])}
      >
        <Plus className="w-4 h-4" />
        הוסף שלב
      </Button>
    </div>
  );
}