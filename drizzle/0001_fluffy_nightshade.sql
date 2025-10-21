CREATE TABLE `affirmationScoring` (
	`id` varchar(64) NOT NULL,
	`exerciseNumber` int NOT NULL,
	`selectedAffirmations` varchar(30) NOT NULL,
	`verdeAdjustment` int DEFAULT 0,
	`rossoAdjustment` int DEFAULT 0,
	`bluAdjustment` int DEFAULT 0,
	CONSTRAINT `affirmationScoring_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scoringTables` (
	`id` varchar(64) NOT NULL,
	`exerciseNumber` int NOT NULL,
	`combinationKey` varchar(20) NOT NULL,
	`verdeScore` int NOT NULL,
	`rossoScore` int NOT NULL,
	CONSTRAINT `scoringTables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testAnswers` (
	`id` varchar(64) NOT NULL,
	`testResultId` varchar(64) NOT NULL,
	`exerciseNumber` int NOT NULL,
	`answerData` json NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `testAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testResults` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`verdeScore` int NOT NULL,
	`rossoScore` int NOT NULL,
	`bluScore` int NOT NULL,
	`profileType` varchar(100) NOT NULL,
	`profileDescription` text,
	CONSTRAINT `testResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `testAnswers` ADD CONSTRAINT `testAnswers_testResultId_testResults_id_fk` FOREIGN KEY (`testResultId`) REFERENCES `testResults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testResults` ADD CONSTRAINT `testResults_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `exerciseNumber_idx` ON `affirmationScoring` (`exerciseNumber`);--> statement-breakpoint
CREATE INDEX `exerciseNumber_idx` ON `scoringTables` (`exerciseNumber`);--> statement-breakpoint
CREATE INDEX `testResultId_idx` ON `testAnswers` (`testResultId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `testResults` (`userId`);