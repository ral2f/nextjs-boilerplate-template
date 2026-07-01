/**
 * /api/fasting/[id]
 *
 * PATCH  – Ends (completes) the active fasting session with the given id.
 * DELETE – Cancels the active fasting session with the given id.
 */

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
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

type RouteParams = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// PATCH /api/fasting/[id]  – Complete (end) a fast
// ---------------------------------------------------------------------------

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [updated] = await db
    .update(fastingSession)
    .set({
      status: "completed",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(fastingSession.id, id),
        eq(fastingSession.userId, userId),
        eq(fastingSession.status, "active")
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Active fasting session not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ fast: updated });
}

// ---------------------------------------------------------------------------
// DELETE /api/fasting/[id]  – Cancel a fast
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [updated] = await db
    .update(fastingSession)
    .set({
      status: "cancelled",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(fastingSession.id, id),
        eq(fastingSession.userId, userId),
        eq(fastingSession.status, "active")
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Active fasting session not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ fast: updated });
}
