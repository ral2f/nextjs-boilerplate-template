import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFastDuration } from "@/lib/fasting";
import type { FastingSession } from "@/lib/schema";

interface FastingHistoryProps {
  history: FastingSession[];
}

/**
 * Displays the last N completed fasting sessions in a simple list.
 */
export function FastingHistory({ history }: FastingHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Verlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine abgeschlossenen Fastenzyklen. Starte dein erstes Fasten!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Verlauf</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {history.map((fast) => (
          <FastingHistoryItem key={fast.id} fast={fast} />
        ))}
      </CardContent>
    </Card>
  );
}

function FastingHistoryItem({ fast }: { fast: FastingSession }) {
  const duration = formatFastDuration(fast.startedAt, fast.endedAt);
  const goalHours = parseFloat(fast.goalHours) || 16;
  const startDate = new Date(fast.startedAt);

  const isCompleted = fast.status === "completed";
  const isCancelled = fast.status === "cancelled";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      {/* Status icon */}
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : isCancelled ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Date + protocol */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {startDate.toLocaleDateString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {startDate.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          Uhr · {fast.fastType}
        </p>
      </div>

      {/* Duration + badge */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-mono font-semibold">{duration}</span>
        <Badge
          variant={
            isCompleted
              ? "default"
              : isCancelled
                ? "destructive"
                : "secondary"
          }
          className="text-xs px-1.5 py-0"
        >
          {isCompleted
            ? `Ziel: ${goalHours}h`
            : isCancelled
              ? "Abgebrochen"
              : "Aktiv"}
        </Badge>
      </div>
    </div>
  );
}
