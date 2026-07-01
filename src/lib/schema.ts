import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

// IMPORTANT! ID fields should ALWAYS use UUID types, EXCEPT the BetterAuth tables.

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ---------------------------------------------------------------------------
// Fasting feature
// ---------------------------------------------------------------------------

/**
 * Supported fasting protocols.
 * The value is stored as text so it is human-readable in the DB and easy to
 * extend without a migration.
 */
export const fastingStatusEnum = pgEnum("fasting_status", [
  "active",
  "completed",
  "cancelled",
]);

/**
 * One row per fasting window.
 *
 * Design notes:
 * - `started_at` is the authoritative start timestamp stored in the DB.
 *   The frontend NEVER runs a background JS counter; it computes elapsed time
 *   as `Date.now() - startedAt` on every render tick so the timer stays
 *   accurate even after the phone screen wakes up from sleep.
 * - `ended_at` is NULL while the fast is active and set when the user stops.
 * - `goal_hours` is the planned duration in hours (e.g. 16 for "16:8").
 */
export const fastingSession = pgTable(
  "fasting_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Human-readable protocol label, e.g. "16:8", "18:6", "24h", "OMAD" */
    fastType: text("fast_type").notNull().default("16:8"),
    /** Planned fasting duration in hours */
    goalHours: text("goal_hours").notNull().default("16"),
    /** UTC timestamp when the user pressed "Start Fast" */
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** UTC timestamp when the user pressed "End Fast" – NULL while active */
    endedAt: timestamp("ended_at", { withTimezone: true }),
    status: fastingStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("fasting_session_user_id_idx").on(table.userId),
    index("fasting_session_status_idx").on(table.status),
    index("fasting_session_started_at_idx").on(table.startedAt),
  ]
);

// TypeScript types inferred from the schema
export type FastingSession = typeof fastingSession.$inferSelect;
export type NewFastingSession = typeof fastingSession.$inferInsert;
