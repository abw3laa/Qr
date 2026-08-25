CREATE TABLE `card_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`platform` varchar(32) NOT NULL,
	`label` varchar(120) NOT NULL,
	`url` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` boolean NOT NULL DEFAULT true,
	CONSTRAINT `card_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`publicSlug` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`jobTitle` varchar(180),
	`company` varchar(180),
	`bio` text,
	`phone` varchar(40),
	`email` varchar(320),
	`location` varchar(180),
	`avatarUrl` text,
	`theme` json,
	`isPublished` boolean NOT NULL DEFAULT true,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `cards_public_slug_idx` UNIQUE(`publicSlug`)
);
--> statement-breakpoint
CREATE TABLE `sync_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` int NOT NULL,
	`clientMutationId` varchar(96) NOT NULL,
	`payload` json NOT NULL,
	`baseVersion` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_changes_id` PRIMARY KEY(`id`),
	CONSTRAINT `sync_mutation_idx` UNIQUE(`clientMutationId`)
);
--> statement-breakpoint
CREATE INDEX `card_links_card_idx` ON `card_links` (`cardId`);--> statement-breakpoint
CREATE INDEX `cards_user_idx` ON `cards` (`userId`);--> statement-breakpoint
CREATE INDEX `sync_user_idx` ON `sync_changes` (`userId`);