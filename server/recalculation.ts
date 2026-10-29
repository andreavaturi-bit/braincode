import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { scoringTables, testAnswers, testResults, userNotifications } from "../drizzle/schema";
import { getDb } from "./db";
import { computeScores, determineProfile, getProfileDescription, type Answer, type ScoringRow } from "./scoring";

export type RecalculationResult = {
  id: string;
  userId: string;
  completedAt: Date | string;
  verdeScore: number;
  rossoScore: number;
  bluScore: number;
  profileType: string;
  profileDescription: string | null;
};

export type RecalculationChange = {
  testResultId: string;
  userId: string;
  completedAt: Date | string;
  before: {
    verde: number;
    rosso: number;
    blu: number;
    profileType: string;
    profileDescription: string | null;
  };
  after: {
    verde: number;
    rosso: number;
    blu: number;
    profileType: string;
    profileDescription: string;
  };
  scoresChanged: boolean;
  profileChanged: boolean;
  descriptionChanged: boolean;
};

export type RecalculationPlan = {
  summary: {
    totalResults: number;
    affectedResults: number;
    unchangedResults: number;
    affectedUsers: number;
  };
  changes: RecalculationChange[];
  previewHash: string;
};

export type RecalculationInput = {
  results: RecalculationResult[];
  answersByResultId: Map<string, Answer[]>;
  tables: Map<number, ScoringRow[]>;
};

/**
 * Calcola tutte le differenze possibili, senza scrivere nel database.
 * È usato sia dall'anteprima amministrativa sia dallo script di ricalcolo.
 */
export function buildRecalculationPlan({ results, answersByResultId, tables }: RecalculationInput): RecalculationPlan {
  const changes: RecalculationChange[] = [];

  for (const result of results) {
    const scores = computeScores(answersByResultId.get(result.id) ?? [], tables);
    const profileType = determineProfile(scores.verde, scores.rosso, scores.blu);
    const profileDescription = getProfileDescription(profileType);
    const scoresChanged =
      scores.verde !== result.verdeScore ||
      scores.rosso !== result.rossoScore ||
      scores.blu !== result.bluScore;
    const profileChanged = profileType !== result.profileType;
    const descriptionChanged = profileDescription !== (result.profileDescription ?? null);

    if (!scoresChanged && !profileChanged && !descriptionChanged) {
      continue;
    }

    changes.push({
      testResultId: result.id,
      userId: result.userId,
      completedAt: result.completedAt,
      before: {
        verde: result.verdeScore,
        rosso: result.rossoScore,
        blu: result.bluScore,
        profileType: result.profileType,
        profileDescription: result.profileDescription,
      },
      after: {
        verde: scores.verde,
        rosso: scores.rosso,
        blu: scores.blu,
        profileType,
        profileDescription,
      },
      scoresChanged,
      profileChanged,
      descriptionChanged,
    });
  }

  const affectedUsers = new Set(changes.map((change) => change.userId)).size;
  const summary = {
    totalResults: results.length,
    affectedResults: changes.length,
    unchangedResults: results.length - changes.length,
    affectedUsers,
  };

  return {
    summary,
    changes,
    previewHash: createPreviewHash(changes),
  };
}

/**
 * Impronta deterministica della preview mostrata all'amministratore.
 * L'applicazione la ricontrolla prima di scrivere per evitare di applicare
 * una conferma ormai superata da dati cambiati nel frattempo.
 */
export function createPreviewHash(changes: RecalculationChange[]): string {
  const serializedChanges = changes
    .map((change) => ({
      testResultId: change.testResultId,
      userId: change.userId,
      before: change.before,
      after: change.after,
    }))
    .sort((a, b) => a.testResultId.localeCompare(b.testResultId));

  return createHash("sha256").update(JSON.stringify(serializedChanges)).digest("hex");
}

/** Legge i dati correnti e genera l'anteprima senza scrivere nel database. */
export async function getRecalculationPreview(): Promise<RecalculationPlan> {
  const db = await getDb();
  if (!db) throw new Error("Database non disponibile");

  const [results, answers, scoringRows] = await Promise.all([
    db.select().from(testResults),
    db.select().from(testAnswers),
    db.select().from(scoringTables),
  ]);

  const answersByResultId = new Map<string, Answer[]>();
  for (const answer of answers) {
    const existingAnswers = answersByResultId.get(answer.testResultId) ?? [];
    existingAnswers.push({
      exerciseNumber: answer.exerciseNumber,
      answerData: answer.answerData,
    });
    answersByResultId.set(answer.testResultId, existingAnswers);
  }

  const tables = new Map<number, ScoringRow[]>();
  for (let exerciseNumber = 1; exerciseNumber <= 10; exerciseNumber++) {
    tables.set(exerciseNumber, []);
  }
  for (const scoringRow of scoringRows) {
    tables.get(scoringRow.exerciseNumber)?.push(scoringRow);
  }

  return buildRecalculationPlan({
    results,
    answersByResultId,
    tables,
  });
}

function buildNotificationMessage(changes: RecalculationChange[]): { title: string; message: string } {
  const title = "Il tuo profilo BrainCode è stato aggiornato";

  if (changes.length === 1) {
    const change = changes[0];
    if (change.profileChanged) {
      return {
        title,
        message: `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
          `Il tuo profilo aggiornato è: ${change.after.profileType} ` +
          `(Verde: ${change.after.verde}, Rosso: ${change.after.rosso}, Blu: ${change.after.blu}). ` +
          `Il precedente risultato era: ${change.before.profileType} ` +
          `(Verde: ${change.before.verde}, Rosso: ${change.before.rosso}, Blu: ${change.before.blu}).`,
      };
    }

    return {
      title,
      message: `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
        `Il tuo profilo rimane ${change.after.profileType}, ma i punteggi sono stati aggiornati: ` +
        `Verde: ${change.before.verde}→${change.after.verde}, Rosso: ${change.before.rosso}→${change.after.rosso}, Blu: ${change.before.blu}→${change.after.blu}.`,
    };
  }

  return {
    title,
    message: `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
      `${changes.length} dei tuoi test sono stati aggiornati con i punteggi corretti. ` +
      `Accedi alla tua dashboard per vedere i risultati aggiornati.`,
  };
}

/**
 * Ricrea l'anteprima lato server e applica esclusivamente i dati approvati.
 * Se l'impronta non coincide, nessuna scrittura viene eseguita.
 */
export async function applyRecalculation(expectedPreviewHash: string) {
  const plan = await getRecalculationPreview();
  if (plan.previewHash !== expectedPreviewHash) {
    const error = new Error("L'anteprima non è più aggiornata. Generane una nuova prima di applicare il ricalcolo.");
    error.name = "RecalculationConflictError";
    throw error;
  }

  if (plan.changes.length === 0) {
    return {
      ...plan.summary,
      notificationsCreated: 0,
      previewHash: plan.previewHash,
    };
  }

  const db = await getDb();
  if (!db) throw new Error("Database non disponibile");

  const changesByUser = new Map<string, RecalculationChange[]>();
  for (const change of plan.changes) {
    // Una descrizione riallineata da sola non altera il risultato percepito:
    // viene salvata ma non genera una notifica fuorviante sui punteggi.
    if (!change.scoresChanged && !change.profileChanged) continue;
    const userChanges = changesByUser.get(change.userId) ?? [];
    userChanges.push(change);
    changesByUser.set(change.userId, userChanges);
  }

  await db.transaction(async (tx) => {
    for (const change of plan.changes) {
      await tx
        .update(testResults)
        .set({
          verdeScore: change.after.verde,
          rossoScore: change.after.rosso,
          bluScore: change.after.blu,
          profileType: change.after.profileType,
          profileDescription: change.after.profileDescription,
        })
        .where(eq(testResults.id, change.testResultId));
    }

    for (const [userId, changes] of Array.from(changesByUser.entries())) {
      const notification = buildNotificationMessage(changes);
      await tx.insert(userNotifications).values({
        id: nanoid(),
        userId,
        title: notification.title,
        message: notification.message,
        read: false,
      });
    }
  });

  return {
    ...plan.summary,
    notificationsCreated: changesByUser.size,
    previewHash: plan.previewHash,
  };
}
