ALTER TABLE `storekeepers` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `storekeepers` ADD `role` enum('admin','operator') DEFAULT 'operator' NOT NULL;