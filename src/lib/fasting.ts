/**
 * Fasting business logic utilities
 *
 * All time calculations happen in the frontend by computing the difference
 * between `startedAt` (from the DB) and `Date.now()`.  There is deliberately
 * NO background JS interval that counts up – this keeps the timer accurate
 * even after the phone screen wakes from sleep, because the elapsed time is
 * always re-derived from the system clock on every render.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FastingPhase {
  /** Minimum elapsed hours (inclusive) */
  minHours: number;
  /** Maximum elapsed hours (exclusive, Infinity for the last phase) */
  maxHours: number;
  /** Short label shown in the UI */
  label: string;
  /** Longer description of what happens biologically */
  description: string;
  /** Tailwind color class for the phase indicator */
  color: string;
  /** Emoji icon for the phase */
  icon: string;
}

// ---------------------------------------------------------------------------
// Biological fasting phases
// ---------------------------------------------------------------------------

export const FASTING_PHASES: FastingPhase[] = [
  {
    minHours: 0,
    maxHours: 4,
    label: "Blutzucker sinkt",
    description:
      "Dein Körper verarbeitet die letzte Mahlzeit. Insulin und Blutzucker beginnen zu sinken.",
    color: "text-blue-500",
    icon: "🍽️",
  },
  {
    minHours: 4,
    maxHours: 8,
    label: "Glykogenspeicher leeren sich",
    description:
      "Die Glykogenspeicher in Leber und Muskeln werden abgebaut, um Energie bereitzustellen.",
    color: "text-yellow-500",
    icon: "⚡",
  },
  {
    minHours: 8,
    maxHours: 12,
    label: "Fettstoffwechsel aktiviert",
    description:
      "Dein Körper wechselt zunehmend auf Fettverbrennung. Die Glykogenspeicher sind fast leer.",
    color: "text-orange-500",
    icon: "🔥",
  },
  {
    minHours: 12,
    maxHours: 16,
    label: "Ketose beginnt",
    description:
      "Die Leber produziert Ketonkörper als alternativen Brennstoff für Gehirn und Muskeln.",
    color: "text-green-500",
    icon: "✨",
  },
  {
    minHours: 16,
    maxHours: 24,
    label: "Tiefe Ketose",
    description:
      "Maximale Fettverbrennung. Autophagie (zelluläre Reinigung) läuft auf Hochtouren.",
    color: "text-purple-500",
    icon: "🌟",
  },
  {
    minHours: 24,
    maxHours: Infinity,
    label: "Verlängertes Fasten",
    description:
      "Tiefe Autophagie und Zellregeneration. Wachstumshormon-Ausschüttung erhöht.",
    color: "text-pink-500",
    icon: "💫",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns elapsed seconds since `startedAt` using the current system clock.
 * This is the core calculation – no background timer needed.
 */
export function getElapsedSeconds(startedAt: Date | string): number {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
}

/**
 * Returns elapsed hours (fractional) since `startedAt`.
 */
export function getElapsedHours(startedAt: Date | string): number {
  return getElapsedSeconds(startedAt) / 3600;
}

/**
 * Formats a duration given in seconds as "HH:MM:SS".
 */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/**
 * Returns the current biological fasting phase based on elapsed hours.
 */
export function getCurrentPhase(elapsedHours: number): FastingPhase {
  const found = FASTING_PHASES.find(
    (p) => elapsedHours >= p.minHours && elapsedHours < p.maxHours
  );
  return found ?? FASTING_PHASES[FASTING_PHASES.length - 1]!;
}

/**
 * Returns progress as a value between 0 and 1 towards the fasting goal.
 */
export function getFastingProgress(
  elapsedHours: number,
  goalHours: number
): number {
  if (goalHours <= 0) return 0;
  return Math.min(1, elapsedHours / goalHours);
}

// ---------------------------------------------------------------------------
// Fasting protocol definitions
// ---------------------------------------------------------------------------

export interface FastingProtocol {
  id: string;
  label: string;
  goalHours: number;
  description: string;
}

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  {
    id: "12:12",
    label: "12:12",
    goalHours: 12,
    description: "Einsteiger – 12 Stunden Fasten, 12 Stunden Essensfenster",
  },
  {
    id: "16:8",
    label: "16:8",
    goalHours: 16,
    description: "Beliebteste Methode – 16 Stunden Fasten, 8 Stunden Essen",
  },
  {
    id: "18:6",
    label: "18:6",
    goalHours: 18,
    description: "Fortgeschritten – 18 Stunden Fasten, 6 Stunden Essen",
  },
  {
    id: "20:4",
    label: "20:4",
    goalHours: 20,
    description: "Krieger-Diät – 20 Stunden Fasten, 4 Stunden Essen",
  },
  {
    id: "OMAD",
    label: "OMAD",
    goalHours: 23,
    description: "One Meal A Day – eine Mahlzeit pro Tag",
  },
  {
    id: "24h",
    label: "24h",
    goalHours: 24,
    description: "24-Stunden-Fasten",
  },
];

/**
 * Formats a completed fast duration for the history list.
 * Returns a human-readable string like "16h 32m".
 */
export function formatFastDuration(
  startedAt: Date | string,
  endedAt: Date | string | null
): string {
  const start =
    typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const end = endedAt
    ? typeof endedAt === "string"
      ? new Date(endedAt)
      : endedAt
    : new Date();

  const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
