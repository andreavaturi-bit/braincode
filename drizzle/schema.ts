import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, json, index, boolean } from "drizzle-orm/mysql-core";

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
 * Test results table - stores completed BrainCode tests with final scores.
 *
 * I tre punteggi rappresentano le ampiezze finali dei settori (scala 0-36)
 * dopo l'applicazione di tutti i differenziali degli esercizi. La somma è 36.
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
 * Test answers table - stores detailed answers for each exercise.
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
 * Scoring tables for ALL 10 exercises (1-7 and 8-10).
 *
 * - Esercizi 1-7: combinationKey nel formato "X+Y-" dove X è l'opzione
 *   segnata con + e Y con -. 6 righe per esercizio.
 * - Esercizi 8-10: combinationKey nel formato "A,B,C" con le tre affermazioni
 *   scelte ordinate numericamente. 12 righe esplicite + 1 riga "0,0" per default.
 *
 * Popolato da `pnpm seed` (scripts/seed-all.ts).
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
 * Notifiche in-app per gli utenti.
 * Usato per informare gli utenti quando il loro risultato viene corretto
 * da un ricalcolo automatico lato server.
 */
export const userNotifications = mysqlTable("userNotifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notification_userId_idx").on(table.userId),
}));

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;
