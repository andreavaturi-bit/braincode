import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  testResults,
  testAnswers,
  scoringTables,
  userNotifications,
  groups,
  groupMembers,
  InsertTestResult,
  InsertTestAnswer,
  InsertScoringTable,
  InsertUserNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';
import type { GroupResultForAnalytics } from "./groups";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Save a completed test result
 */
export async function saveTestResult(result: InsertTestResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(testResults).values(result);
  return result;
}

/**
 * Save test answers for a specific test result
 */
export async function saveTestAnswers(answers: InsertTestAnswer[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(testAnswers).values(answers);
}

/**
 * Get all test results for a user
 */
export async function getUserTestResults(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(testResults)
    .where(eq(testResults.userId, userId))
    .orderBy(desc(testResults.completedAt));
}

/**
 * Get all test results (admin only)
 */
export async function getAllTestResults() {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: testResults.id,
      userId: testResults.userId,
      userName: users.name,
      userEmail: users.email,
      verdeScore: testResults.verdeScore,
      rossoScore: testResults.rossoScore,
      bluScore: testResults.bluScore,
      profileType: testResults.profileType,
      completedAt: testResults.completedAt,
    })
    .from(testResults)
    .leftJoin(users, eq(testResults.userId, users.id))
    .orderBy(desc(testResults.completedAt));

  return results;
}

/**
 * Get a test result without its detailed answers.
 * Used to authorize access before loading personal answer data.
 */
export async function getTestResultById(testResultId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(testResults)
    .where(eq(testResults.id, testResultId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get a specific test result with its answers
 */
export async function getTestResultWithAnswers(testResultId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(testResults)
    .where(eq(testResults.id, testResultId))
    .limit(1);

  if (result.length === 0) return null;

  const answers = await db
    .select()
    .from(testAnswers)
    .where(eq(testAnswers.testResultId, testResultId))
    .orderBy(testAnswers.exerciseNumber);

  return {
    ...result[0],
    answers,
  };
}

/**
 * Get scoring table for a specific exercise
 */
export async function getScoringTable(exerciseNumber: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(scoringTables)
    .where(eq(scoringTables.exerciseNumber, exerciseNumber));
}

/**
 * Seed scoring tables (to be called during initialization)
 */
export async function seedScoringTables(tables: InsertScoringTable[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(scoringTables).values(tables);
}

/**
 * Create a notification for a user
 */
export async function createUserNotification(notification: InsertUserNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userNotifications).values(notification);
}

/**
 * Get all unread notifications for a user
 */
export async function getUserNotifications(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt));
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userNotifications)
    .set({ read: true })
    .where(eq(userNotifications.id, notificationId));
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userNotifications)
    .set({ read: true })
    .where(eq(userNotifications.userId, userId));
}

export class GroupNotFoundError extends Error {
  constructor() {
    super("Il link del gruppo non è più disponibile.");
    this.name = "GroupNotFoundError";
  }
}

/**
 * Salva un completamento e, quando presente, l'appartenenza al gruppo invito
 * nella stessa transazione. Un link non valido non salva alcun risultato.
 */
export async function saveCompletedTest({
  result,
  answers,
  groupSlug,
}: {
  result: InsertTestResult;
  answers: InsertTestAnswer[];
  groupSlug?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    let groupId: string | undefined;
    if (groupSlug) {
      const group = await tx
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.slug, groupSlug))
        .limit(1);
      if (!group[0]) throw new GroupNotFoundError();
      groupId = group[0].id;
    }

    await tx.insert(testResults).values(result);
    await tx.insert(testAnswers).values(answers);

    if (groupId) {
      await tx
        .insert(groupMembers)
        .values({ groupId, userId: result.userId })
        .onDuplicateKeyUpdate({ set: { groupId } });
    }
  });

  return result;
}

export async function getGroupsWithMemberCounts() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      createdAt: groups.createdAt,
      memberCount: sql<number>`count(${groupMembers.userId})`,
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .groupBy(groups.id, groups.name, groups.slug, groups.createdAt)
    .orderBy(asc(groups.name));
}

export async function getGroupById(groupId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  return result[0] ?? null;
}

export async function getGroupsByIds(groupIds: string[]) {
  const requested = new Set(groupIds);
  const allGroups = await getGroupsWithMemberCounts();
  return allGroups.filter((group) => requested.has(group.id));
}

export async function createGroup(group: { id: string; name: string; slug: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(groups).values(group);
  return group;
}

export async function renameGroup(groupId: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(groups).set({ name }).where(eq(groups.id, groupId));
}

/** Cancellare un gruppo rimuove soltanto le appartenenze, mai persone o risultati. */
export async function deleteGroup(groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async (tx) => {
    await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    await tx.delete(groups).where(eq(groups.id, groupId));
  });
}

export async function setUserGroups(userId: string, groupIds: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async (tx) => {
    await tx.delete(groupMembers).where(eq(groupMembers.userId, userId));
    if (groupIds.length > 0) {
      await tx.insert(groupMembers).values(groupIds.map((groupId) => ({ groupId, userId })));
    }
  });
}

export async function addUsersToGroup(groupId: string, userIds: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (userIds.length === 0) return;
  await db
    .insert(groupMembers)
    .values(userIds.map((userId) => ({ groupId, userId })))
    .onDuplicateKeyUpdate({ set: { groupId } });
}

export async function getUserGroupMemberships() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      userId: groupMembers.userId,
      groupId: groups.id,
      groupName: groups.name,
      groupSlug: groups.slug,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .orderBy(asc(groups.name));
}

export async function getGroupMembersWithLatestResults(groupId: string) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      verdeScore: testResults.verdeScore,
      rossoScore: testResults.rossoScore,
      bluScore: testResults.bluScore,
      profileType: testResults.profileType,
      completedAt: testResults.completedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .leftJoin(testResults, eq(users.id, testResults.userId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(desc(testResults.completedAt));

  const members = new Map<string, { userId: string; userName: string | null; userEmail: string | null; result: GroupResultForAnalytics | null }>();
  for (const row of rows) {
    if (!members.has(row.userId)) {
      members.set(row.userId, {
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        result: row.completedAt && row.profileType !== null && row.verdeScore !== null && row.rossoScore !== null && row.bluScore !== null
          ? {
              userId: row.userId,
              userName: row.userName,
              userEmail: row.userEmail,
              completedAt: row.completedAt,
              verdeScore: row.verdeScore,
              rossoScore: row.rossoScore,
              bluScore: row.bluScore,
              profileType: row.profileType,
            }
          : null,
      });
    }
  }

  return Array.from(members.values());
}
