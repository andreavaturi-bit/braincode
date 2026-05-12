/**
 * Ricalcola TUTTI i testResults salvati a partire dalle risposte memorizzate
 * in testAnswers, usando le tabelle di scoring attualmente presenti in DB
 * (cioè quelle popolate dall'ultimo `pnpm seed`).
 *
 * Utile dopo aver corretto le tabelle di scoring: i test storici hanno i
 * punteggi vecchi salvati come numeri assoluti e non si aggiornano da soli.
 *
 * Uso:
 *   pnpm recalc-results --dry-run   (mostra cosa cambierebbe, non scrive)
 *   pnpm recalc-results             (scrive le modifiche)
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { scoringTables, testResults, testAnswers } from "../drizzle/schema";
import { computeScores, determineProfile, type ScoringRow } from "../server/scoring";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL non impostata");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);
const dryRun = process.argv.includes("--dry-run");

async function recalc() {
  console.log(dryRun ? "🔍 DRY RUN (nessuna scrittura)\n" : "🔄 Ricalcolo testResults\n");

  const tables = new Map<number, ScoringRow[]>();
  for (let ex = 1; ex <= 10; ex++) {
    const rows = await db
      .select()
      .from(scoringTables)
      .where(eq(scoringTables.exerciseNumber, ex));
    tables.set(ex, rows);
  }

  const results = await db.select().from(testResults);
  console.log(`Trovati ${results.length} testResults\n`);

  let unchanged = 0;
  let changed = 0;

  for (const result of results) {
    const answers = await db
      .select()
      .from(testAnswers)
      .where(eq(testAnswers.testResultId, result.id));

    const scores = computeScores(
      answers.map((a) => ({ exerciseNumber: a.exerciseNumber, answerData: a.answerData })),
      tables
    );
    const newProfile = determineProfile(scores.verde, scores.rosso, scores.blu);

    if (
      scores.verde === result.verdeScore &&
      scores.rosso === result.rossoScore &&
      scores.blu === result.bluScore &&
      newProfile === result.profileType
    ) {
      unchanged++;
      continue;
    }

    changed++;
    const completedAt =
      result.completedAt instanceof Date ? result.completedAt.toISOString().slice(0, 19) : String(result.completedAt);
    console.log(
      `${result.id}  ${completedAt}  ` +
        `V:${result.verdeScore}→${scores.verde}  R:${result.rossoScore}→${scores.rosso}  B:${result.bluScore}→${scores.blu}` +
        (newProfile !== result.profileType ? `  [${result.profileType} → ${newProfile}]` : "")
    );

    if (!dryRun) {
      await db
        .update(testResults)
        .set({
          verdeScore: scores.verde,
          rossoScore: scores.rosso,
          bluScore: scores.blu,
          profileType: newProfile,
        })
        .where(eq(testResults.id, result.id));
    }
  }

  console.log(`\n${dryRun ? "Sarebbero aggiornati" : "Aggiornati"}: ${changed}`);
  console.log(`Già corretti: ${unchanged}`);
}

recalc()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Errore:", err);
    process.exit(1);
  });
