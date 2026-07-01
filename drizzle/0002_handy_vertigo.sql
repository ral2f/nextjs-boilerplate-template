CREATE TYPE "public"."fasting_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "fasting_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"fast_type" text DEFAULT '16:8' NOT NULL,
	"goal_hours" text DEFAULT '16' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"status" "fasting_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fasting_session" ADD CONSTRAINT "fasting_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fasting_session_user_id_idx" ON "fasting_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fasting_session_status_idx" ON "fasting_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fasting_session_started_at_idx" ON "fasting_session" USING btree ("started_at");