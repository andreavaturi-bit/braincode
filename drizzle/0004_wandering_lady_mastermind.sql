CREATE TABLE `groupMembers` (
	`groupId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupMembers_groupId_userId_pk` PRIMARY KEY(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `groups_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `groupMembers` ADD CONSTRAINT `groupMembers_groupId_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `groupMembers` ADD CONSTRAINT `groupMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `groupMembers_groupId_idx` ON `groupMembers` (`groupId`);--> statement-breakpoint
CREATE INDEX `groupMembers_userId_idx` ON `groupMembers` (`userId`);