import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, json, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Test results table - stores completed BrainCode tests with final scores
 */
export const testResults = mysqlTable("testResults", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  verdeScore: int("verdeScore").notNull(),
  rossoScore: int("rossoScore").notNull(),
  bluScore: int("bluScore").notNull(),
  profileType: varchar("profileType", { length: 100 }).notNull(),
  profileDescription: text("profileDescription"),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = typeof testResults.$inferInsert;

/**
 * Test answers table - stores detailed answers for each exercise
 */
export const testAnswers = mysqlTable("testAnswers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  testResultId: varchar("testResultId", { length: 64 }).notNull().references(() => testResults.id),
  exerciseNumber: int("exerciseNumber").notNull(),
  answerData: json("answerData").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  testResultIdIdx: index("testResultId_idx").on(table.testResultId),
}));

export type TestAnswer = typeof testAnswers.$inferSelect;
export type InsertTestAnswer = typeof testAnswers.$inferInsert;

/**
 * Scoring tables for exercises 1-7
 * Stores the mapping from answer combinations to VERDE/ROSSO scores
 */
export const scoringTables = mysqlTable("scoringTables", {
  id: varchar("id", { length: 64 }).primaryKey(),
  exerciseNumber: int("exerciseNumber").notNull(),
  combinationKey: varchar("combinationKey", { length: 20 }).notNull(),
  verdeScore: int("verdeScore").notNull(),
  rossoScore: int("rossoScore").notNull(),
}, (table) => ({
  exerciseNumberIdx: index("exerciseNumber_idx").on(table.exerciseNumber),
}));

export type ScoringTable = typeof scoringTables.$inferSelect;
export type InsertScoringTable = typeof scoringTables.$inferInsert;

/**
 * Affirmation scoring for exercises 8-10
 * Stores the lookup table for combinations of 3 affirmations
 */
export const affirmationScoring = mysqlTable("affirmationScoring", {
  id: varchar("id", { length: 64 }).primaryKey(),
  exerciseNumber: int("exerciseNumber").notNull(),
  selectedAffirmations: varchar("selectedAffirmations", { length: 30 }).notNull(),
  verdeAdjustment: int("verdeAdjustment").default(0),
  rossoAdjustment: int("rossoAdjustment").default(0),
  bluAdjustment: int("bluAdjustment").default(0),
}, (table) => ({
  exerciseNumberIdx: index("exerciseNumber_idx").on(table.exerciseNumber),
}));

export type AffirmationScoring = typeof affirmationScoring.$inferSelect;
export type InsertAffirmationScoring = typeof affirmationScoring.$inferInsert;

