"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FASTING_PHASES,
  getCurrentPhase,
  getElapsedHours,
} from "@/lib/fasting";
import type { FastingSession } from "@/lib/schema";

interface FastingPhaseInfoProps {
  activeFast: FastingSession | null;
}

/**
 * Shows the current biological fasting phase and a mini-timeline of all
 * phases, highlighting the active one.
 */
export function FastingPhaseInfo({ activeFast }: FastingPhaseInfoProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [activeFast]);

  if (!activeFast) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Starte ein Fasten, um deine biologischen Phasen zu verfolgen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const elapsedHours = getElapsedHours(activeFast.startedAt);
  const currentPhase = getCurrentPhase(elapsedHours);

  return (
    <div className="space-y-3">
      {/* Current phase highlight */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{currentPhase.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${currentPhase.color}`}>
                {currentPhase.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentPhase.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase timeline */}
      <div className="space-y-1.5">
        {FASTING_PHASES.filter((p) => p.maxHours !== Infinity).map((phase) => {
          const isActive =
            elapsedHours >= phase.minHours && elapsedHours < phase.maxHours;
          const isPast = elapsedHours >= phase.maxHours;

          return (
            <div
              key={phase.label}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
                isActive
                  ? "bg-primary/10 border border-primary/30"
                  : isPast
                    ? "opacity-50"
                    : "opacity-30"
              }`}
            >
              <span>{phase.icon}</span>
              <span className="font-medium">
                {phase.minHours}–{phase.maxHours}h
              </span>
              <span className="text-muted-foreground">{phase.label}</span>
              {isActive && (
                <span className="ml-auto text-primary font-semibold">
                  ← jetzt
                </span>
              )}
              {isPast && (
                <span className="ml-auto text-green-500 font-semibold">✓</span>
              )}
            </div>
          );
        })}
        {/* Last phase (no upper bound) */}
        {(() => {
          const lastPhase = FASTING_PHASES[FASTING_PHASES.length - 1]!;
          const isActive = elapsedHours >= lastPhase.minHours;
          return (
            <div
              key={lastPhase.label}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
                isActive
                  ? "bg-primary/10 border border-primary/30"
                  : "opacity-30"
              }`}
            >
              <span>{lastPhase.icon}</span>
              <span className="font-medium">{lastPhase.minHours}h+</span>
              <span className="text-muted-foreground">{lastPhase.label}</span>
              {isActive && (
                <span className="ml-auto text-primary font-semibold">
                  ← jetzt
                </span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
