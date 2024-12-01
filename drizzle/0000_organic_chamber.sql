CREATE TABLE IF NOT EXISTS "feeding_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"is_eliminating" boolean DEFAULT false NOT NULL,
	"username" varchar(255) NOT NULL,
	"elimination_start_date" timestamp,
	"baseline_volume" numeric(3, 1),
	"current_group" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feeding_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feeding_time" timestamp with time zone NOT NULL,
	"volume_in_ounces" double precision,
	"completed" boolean DEFAULT false NOT NULL,
	"block_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"username" varchar(50) PRIMARY KEY NOT NULL,
	"password" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" text NOT NULL,
	"baby_name" varchar(100) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feeding_blocks" ADD CONSTRAINT "feeding_blocks_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feeding_entries" ADD CONSTRAINT "feeding_entries_block_id_feeding_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."feeding_blocks"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feeding_blocks_username" ON "feeding_blocks" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feeding_entries_block_id" ON "feeding_entries" USING btree ("block_id");