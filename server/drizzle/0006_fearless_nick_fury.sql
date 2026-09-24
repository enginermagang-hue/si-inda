CREATE TABLE `visit_daily` (
	`date` text PRIMARY KEY NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`uniques` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`ip` text,
	`visitor_id` text,
	`user_agent` text,
	`referer` text,
	`country` text,
	`created_at` text NOT NULL
);
