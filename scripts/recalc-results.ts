/**
 * Ricalcola TUTTI i testResults salvati a partire dalle risposte memorizzate
 * in testAnswers, usando le tabelle di scoring attualmente presenti in DB
 * (cioè quelle popolate dall'ultimo `pnpm seed`).
 *
 * Utile dopo aver corretto le tabelle di scoring: i test storici hanno i
 * punteggi vecchi salvati come numeri assoluti e non si aggiornano da soli.
 *
 * Dopo il ricalcolo, invia una notifica in-app a ogni utente il cui risultato
 * è cambiato, informandolo che il suo profilo è stato aggiornato.
 *
 * Uso:
 *   pnpm recalc-results --dry-run   (mostra cosa cambierebbe, non scrive)
 *   pnpm recalc-results             (scrive le modifiche e invia notifiche)
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { scoringTables, testResults, testAnswers, userNotifications, users } from "../drizzle/schema";
import { computeScores, determineProfile, type ScoringRow } from "../server/scoring";
import { nanoid } from "nanoid";

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

  // Mappa userId → lista di test aggiornati per raggruppare le notifiche
  const userChanges = new Map<string, Array<{
    oldVerde: number; oldRosso: number; oldBlu: number;
    newVerde: number; newRosso: number; newBlu: number;
    oldProfile: string; newProfile: string;
    profileChanged: boolean;
  }>>();

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

      // Accumula le modifiche per questo utente
      if (!userChanges.has(result.userId)) {
        userChanges.set(result.userId, []);
      }
      userChanges.get(result.userId)!.push({
        oldVerde: result.verdeScore,
        oldRosso: result.rossoScore,
        oldBlu: result.bluScore,
        newVerde: scores.verde,
        newRosso: scores.rosso,
        newBlu: scores.blu,
        oldProfile: result.profileType,
        newProfile,
        profileChanged: newProfile !== result.profileType,
      });
    }
  }

  console.log(`\n${dryRun ? "Sarebbero aggiornati" : "Aggiornati"}: ${changed}`);
  console.log(`Già corretti: ${unchanged}`);

  if (!dryRun && userChanges.size > 0) {
    console.log(`\n📬 Invio notifiche a ${userChanges.size} utenti...`);

    for (const [userId, changes] of userChanges.entries()) {
      // Verifica che l'utente esista
      const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRows.length === 0) {
        console.warn(`  ⚠️  Utente ${userId} non trovato, notifica saltata`);
        continue;
      }

      const userName = userRows[0].name || "Utente";
      const profileChanged = changes.some(c => c.profileChanged);
      const testCount = changes.length;

      // Costruisce il messaggio di notifica
      const title = "Il tuo profilo BrainCode è stato aggiornato";
      
      let message: string;
      if (testCount === 1) {
        const c = changes[0];
        if (c.profileChanged) {
          message = `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
            `Il tuo profilo aggiornato è: ${c.newProfile} ` +
            `(Verde: ${c.newVerde}, Rosso: ${c.newRosso}, Blu: ${c.newBlu}). ` +
            `Il precedente risultato era: ${c.oldProfile} ` +
            `(Verde: ${c.oldVerde}, Rosso: ${c.oldRosso}, Blu: ${c.oldBlu}).`;
        } else {
          message = `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
            `Il tuo profilo rimane ${c.newProfile}, ma i punteggi sono stati aggiornati: ` +
            `Verde: ${c.oldVerde}→${c.newVerde}, Rosso: ${c.oldRosso}→${c.newRosso}, Blu: ${c.oldBlu}→${c.newBlu}.`;
        }
      } else {
        message = `Abbiamo corretto un errore nel calcolo del tuo profilo BrainCode. ` +
          `${testCount} dei tuoi test sono stati aggiornati con i punteggi corretti. ` +
          `Accedi alla tua dashboard per vedere i risultati aggiornati.`;
      }

      await db.insert(userNotifications).values({
        id: nanoid(),
        userId,
        title,
        message,
        read: false,
      });

      console.log(`  ✅ Notifica inviata a ${userName} (${userId}) — ${testCount} test aggiornati`);
    }

    console.log(`\n🎉 Ricalcolo e notifiche completati!`);
  }
}

recalc()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Errore:", err);
    process.exit(1);
  });
