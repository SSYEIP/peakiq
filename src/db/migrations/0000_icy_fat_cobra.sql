CREATE TABLE `leaderboard_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`total_score` integer NOT NULL,
	`round_scores` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboard_entries_session_id_unique` ON `leaderboard_entries` (`session_id`);--> statement-breakpoint
CREATE TABLE `session_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`round_index` integer NOT NULL,
	`location_id` text NOT NULL,
	`guess` integer,
	`score` integer,
	`submitted_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer
);
