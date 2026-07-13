import { lazy, Suspense, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { measurementTypeLabel } from '@/lib/runMeasurementTypes';
import { formatLongTime, formatShortTime } from '@/lib/timeFormat';
import { formatLocalDate } from '@/lib/dateTime';

const RunHistoryChart = lazy(() => import('./RunHistoryChart'));

export default function RunHistorySection({ measurements, loading, error, onRetry }) {
  const sorted = useMemo(
    () => [...measurements].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [measurements]
  );

  const chartData = useMemo(
    () => sorted
      .filter(m => m.measurement_type?.startsWith('distance_') && m.result_seconds != null)
      .map(m => ({
        date: formatLocalDate(m.date),
        seconds: m.result_seconds,
        type: measurementTypeLabel(m.measurement_type),
      })),
    [sorted]
  );

  const isSprint = (type) => type?.startsWith('sprint_');

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-sm">היסטוריית ריצות</div>
        <Badge variant="secondary" className="text-[10px]">{sorted.length} מדידות</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-4" role="status" aria-live="polite">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">טוען היסטוריית ריצות</span>
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
          <p className="text-xs font-semibold">לא ניתן לטעון את היסטוריית הריצות.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-1.5 rounded-xl">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            נסו שוב
          </Button>
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">אין מדידות ריצה רשומות</p>
      ) : (
        <>
          {chartData.length > 1 && (
            <Suspense fallback={(
              <div className="h-40 flex items-center justify-center" role="status" aria-live="polite">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">טוען גרף התקדמות</span>
              </div>
            )}>
              <RunHistoryChart data={chartData} />
            </Suspense>
          )}

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {sorted.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-xs">
                <div className="min-w-0">
                  <div className="font-medium truncate">{measurementTypeLabel(m.measurement_type)}</div>
                  <div className="text-muted-foreground">{formatLocalDate(m.date)}</div>
                </div>
                <div className="shrink-0 text-left">
                  {m.result_seconds != null && (
                    <div className="font-bold text-primary">
                      {isSprint(m.measurement_type) ? formatShortTime(m.result_seconds) : formatLongTime(m.result_seconds)}
                    </div>
                  )}
                  {m.result_distance != null && <div className="text-muted-foreground">{m.result_distance} מ׳</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
