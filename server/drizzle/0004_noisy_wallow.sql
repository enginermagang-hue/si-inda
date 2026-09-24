CREATE TABLE `breaking_news_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`news_id` integer NOT NULL,
	`file_path` text,
	`dropbox_path` text,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`news_id`) REFERENCES `breaking_news`(`id`) ON UPDATE no action ON DELETE cascade
);
