/**
 * Ricalcola tutti i test storici usando le tabelle di scoring attuali.
 * In aggiunta a punteggi e tipo, riallinea la descrizione del profilo dalla
 * stessa funzione condivisa usata dall'invio di un nuovo test.
 *
 * Uso:
 *   pnpm recalc-results --dry-run   (mostra cosa cambierebbe, non scrive)
 *   pnpm recalc-results             (applica in transazione)
 */

import { applyRecalculation, getRecalculationPreview } from "../server/recalculation";

const dryRun = process.argv.includes("--dry-run");

function formatCompletedAt(completedAt: Date | string): string {
  return completedAt instanceof Date
    ? completedAt.toISOString().slice(0, 19)
    : String(completedAt);
}

async function recalculate() {
  console.log(dryRun ? "🔍 DRY RUN (nessuna scrittura)\n" : "🔄 Ricalcolo testResults\n");

  const plan = await getRecalculationPreview();
  console.log(`Trovati ${plan.summary.totalResults} testResults\n`);

  for (const change of plan.changes) {
    const scoreDescription =
      `V:${change.before.verde}→${change.after.verde}  ` +
      `R:${change.before.rosso}→${change.after.rosso}  ` +
      `B:${change.before.blu}→${change.after.blu}`;
    const profileDescription = change.profileChanged
      ? `  [${change.before.profileType} → ${change.after.profileType}]`
      : "";
    const descriptionUpdate = change.descriptionChanged ? "  [descrizione aggiornata]" : "";

    console.log(
      `${change.testResultId}  ${formatCompletedAt(change.completedAt)}  ` +
      `${scoreDescription}${profileDescription}${descriptionUpdate}`
    );
  }

  console.log(`\n${dryRun ? "Sarebbero aggiornati" : "Da aggiornare"}: ${plan.summary.affectedResults}`);
  console.log(`Già corretti: ${plan.summary.unchangedResults}`);

  if (dryRun || plan.summary.affectedResults === 0) return;

  const result = await applyRecalculation(plan.previewHash);
  console.log(`\nAggiornati: ${result.affectedResults}`);
  console.log(`Notifiche inviate: ${result.notificationsCreated}`);
  console.log("\n🎉 Ricalcolo e notifiche completati!");
}

recalculate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore:", error);
    process.exit(1);
  });
