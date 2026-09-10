CREATE TABLE `mining_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`company` varchar(160),
	`site` varchar(160),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mining_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `mining_units_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`toolId` int NOT NULL,
	`workerId` int NOT NULL,
	`storekeeperId` int NOT NULL,
	`type` enum('dispatch','return','transfer') NOT NULL,
	`quantity` int NOT NULL,
	`occurredAt` bigint NOT NULL,
	`destination` varchar(160),
	`condition` varchar(120),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storekeepers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`employeeId` varchar(80),
	`phone` varchar(50),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storekeepers_id` PRIMARY KEY(`id`),
	CONSTRAINT `storekeepers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`locationId` int,
	`code` varchar(60) NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(100),
	`brand` varchar(120),
	`model` varchar(120),
	`serialNumber` varchar(120),
	`quantity` int NOT NULL DEFAULT 1,
	`availableQuantity` int NOT NULL DEFAULT 1,
	`status` enum('available','borrowed','maintenance','lost','retired') NOT NULL DEFAULT 'available',
	`imageUrl` text,
	`imageKey` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `warehouse_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`code` varchar(60) NOT NULL,
	`name` varchar(160) NOT NULL,
	`zone` varchar(120),
	`description` text,
	`photoUrl` text,
	`photoKey` text,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouse_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_locations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`code` varchar(40) NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`area` varchar(160),
	`company` varchar(160),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workers_code_unique` UNIQUE(`code`)
);
