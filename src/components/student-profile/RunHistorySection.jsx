import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { measurementTypeLabel } from '@/lib/runMeasurementTypes';
import { formatLongTime, formatShortTime } from '@/lib/timeFormat';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatLocalDate } from '@/lib/dateTime';

export default function RunHistorySection({ measurements, loading }) {
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
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">אין מדידות ריצה רשומות</p>
      ) : (
        <>
          {chartData.length > 1 && (
            <div className="h-40" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" domain={['dataMin', 'dataMax']} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="seconds" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
