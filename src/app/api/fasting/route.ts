/**
 * /api/fasting
 *
 * GET  – Returns the currently active fasting session (if any) and the last
 *         10 completed sessions for the authenticated user.
 * POST – Starts a new fasting session.  Cancels any previously active session
 *         so there is never more than one active session per user.
 */

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fastingSession } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/fasting
// ---------------------------------------------------------------------------

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Active session (there should be at most one)
  const [activeFast] = await db
    .select()
    .from(fastingSession)
    .where(
      and(
        eq(fastingSession.userId, userId),
        eq(fastingSession.status, "active")
      )
    )
    .limit(1);

  // Last 10 completed / cancelled sessions (most recent first)
  const history = await db
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

  return NextResponse.json({
    activeFast: activeFast ?? null,
    history,
  });
}

// ---------------------------------------------------------------------------
// POST /api/fasting  – Start a new fast
// ---------------------------------------------------------------------------

const startFastSchema = z.object({
  fastType: z.string().min(1).max(20).default("16:8"),
  goalHours: z.string().min(1).max(5).default("16"),
});

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = startFastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fastType, goalHours } = parsed.data;

  // Cancel any existing active session before starting a new one
  await db
    .update(fastingSession)
    .set({ status: "cancelled", endedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(fastingSession.userId, userId),
        eq(fastingSession.status, "active")
      )
    );

  // Create the new session – startedAt defaults to NOW() in the DB
  const [newFast] = await db
    .insert(fastingSession)
    .values({
      userId,
      fastType,
      goalHours,
      status: "active",
    })
    .returning();

  return NextResponse.json({ fast: newFast }, { status: 201 });
}
