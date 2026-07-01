"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FASTING_PROTOCOLS } from "@/lib/fasting";
import type { FastingSession } from "@/lib/schema";

interface FastingControlsProps {
  activeFast: FastingSession | null;
}

/**
 * Start / End / Cancel controls for a fasting session.
 */
export function FastingControls({ activeFast }: FastingControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Start a new fast
  // -------------------------------------------------------------------------
  async function handleStart(fastType: string, goalHours: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/fasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fastType,
          goalHours: String(goalHours),
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Starten");
      toast.success(`${fastType}-Fasten gestartet! Viel Erfolg 💪`);
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Fasten konnte nicht gestartet werden.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // End (complete) the active fast
  // -------------------------------------------------------------------------
  async function handleEnd() {
    if (!activeFast) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fasting/${activeFast.id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Fehler beim Beenden");
      toast.success("Fasten erfolgreich abgeschlossen! 🎉");
      router.refresh();
    } catch {
      toast.error("Fasten konnte nicht beendet werden.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Cancel the active fast
  // -------------------------------------------------------------------------
  async function handleCancel() {
    if (!activeFast) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fasting/${activeFast.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Fehler beim Abbrechen");
      toast.info("Fasten abgebrochen.");
      router.refresh();
    } catch {
      toast.error("Fasten konnte nicht abgebrochen werden.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (activeFast) {
    return (
      <div className="flex gap-3 justify-center">
        <Button
          size="lg"
          onClick={handleEnd}
          disabled={loading}
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Fasten beenden
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleCancel}
          disabled={loading}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Abbrechen
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 px-8">
          <Play className="h-4 w-4" />
          Fasten starten
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fastenprotokoll wählen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {FASTING_PROTOCOLS.map((protocol) => (
            <button
              key={protocol.id}
              onClick={() =>
                handleStart(protocol.label, protocol.goalHours)
              }
              disabled={loading}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left hover:bg-accent transition-colors disabled:opacity-50"
            >
              <div>
                <p className="font-semibold text-sm">{protocol.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {protocol.description}
                </p>
              </div>
              <span className="text-muted-foreground text-xs ml-4 shrink-0">
                {protocol.goalHours}h
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
