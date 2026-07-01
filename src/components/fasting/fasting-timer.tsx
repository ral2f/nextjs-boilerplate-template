"use client";

import { useEffect, useState, useCallback } from "react";
import {
  formatDuration,
  getElapsedSeconds,
  getFastingProgress,
  getCurrentPhase,
  getElapsedHours,
} from "@/lib/fasting";
import type { FastingSession } from "@/lib/schema";

interface FastingTimerProps {
  activeFast: FastingSession | null;
}

/**
 * Circular fasting timer.
 *
 * The timer does NOT use a background JS counter that accumulates a value.
 * Instead, on every tick it re-computes:
 *   elapsed = Date.now() - startedAt
 *
 * This means the display is always accurate even after the phone screen
 * wakes up from sleep – there is nothing to "catch up" on.
 */
export function FastingTimer({ activeFast }: FastingTimerProps) {
  // We only store the current timestamp to force a re-render each second.
  // The actual elapsed time is always derived fresh from startedAt.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  if (!activeFast) {
    return <IdleTimer />;
  }

  const elapsedSeconds = getElapsedSeconds(activeFast.startedAt);
  const elapsedHours = getElapsedHours(activeFast.startedAt);
  const goalHours = parseFloat(activeFast.goalHours) || 16;
  const progress = getFastingProgress(elapsedHours, goalHours);
  const phase = getCurrentPhase(elapsedHours);

  // SVG circle parameters
  const size = 280;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Ensure at least 1% is shown so the arc is always visible
  const clampedProgress = Math.max(0.01, progress);
  const dashOffset = circumference * (1 - clampedProgress);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular progress ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-4xl font-mono font-bold tabular-nums tracking-tight">
            {formatDuration(elapsedSeconds)}
          </span>
          <span className="text-sm text-muted-foreground">
            Ziel: {goalHours}h ({activeFast.fastType})
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(progress * 100)}% erreicht
          </span>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xl">{phase.icon}</span>
        <span className={`text-sm font-semibold ${phase.color}`}>
          {phase.label}
        </span>
      </div>
    </div>
  );
}

/** Shown when no fast is active */
function IdleTimer() {
  const size = 280;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-5xl">🍽️</span>
          <span className="text-lg font-semibold text-muted-foreground mt-1">
            Kein aktives Fasten
          </span>
          <span className="text-xs text-muted-foreground">
            Wähle ein Protokoll und starte
          </span>
        </div>
      </div>
    </div>
  );
}

// Re-export for convenience
export { useCallback };
