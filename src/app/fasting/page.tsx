import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { FastingControls } from "@/components/fasting/fasting-controls";
import { FastingHistory } from "@/components/fasting/fasting-history";
import { FastingPhaseInfo } from "@/components/fasting/fasting-phase-info";
import { FastingTimer } from "@/components/fasting/fasting-timer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fastingSession } from "@/lib/schema";
import type { FastingSession } from "@/lib/schema";

/**
 * Fasting dashboard – Server Component.
 *
 * Data is fetched server-side on every request so the page always shows the
 * latest state.  The client components (Timer, Controls) handle interactivity.
 */
export default async function FastingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Active session (at most one)
  const [activeFast] = await db
    .select()
    .from(fastingSession)
    .where(
      and(eq(fastingSession.userId, userId), eq(fastingSession.status, "active"))
    )
    .limit(1);

  // Last 10 completed sessions
  const history: FastingSession[] = await db
    .select()
    .from(fastingSession)
    .where(
      and(
        eq(fastingSession.userId, userId),
        eq(fastingSession.status, "completed")
      )
    )
    .orderBy(desc(fastingSession.startedAt))
    .limit(10);

  return (
    <main className="container mx-auto max-w-lg px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Fastic</h1>
        <p className="text-muted-foreground text-sm">
          Hallo, {session.user.name?.split(" ")[0] ?? "du"} 👋
        </p>
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <FastingTimer activeFast={activeFast ?? null} />
      </div>

      {/* Start / End controls */}
      <div className="flex justify-center">
        <FastingControls activeFast={activeFast ?? null} />
      </div>

      {/* Biological phase info */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Biologische Phase
        </h2>
        <FastingPhaseInfo activeFast={activeFast ?? null} />
      </section>

      {/* History */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Verlauf
        </h2>
        <FastingHistory history={history} />
      </section>
    </main>
  );
}
