CREATE TABLE `sops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`judul` text NOT NULL,
	`deskripsi` text DEFAULT '' NOT NULL,
	`file_path` text,
	`dropbox_path` text,
	`is_published` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
