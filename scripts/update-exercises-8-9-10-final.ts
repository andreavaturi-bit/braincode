/**
 * Aggiornamento FINALE con TUTTE le 39 combinazioni corrette dall'Excel
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

const db = drizzle(process.env.DATABASE_URL!);

async function updateExercises() {
  console.log("🔄 Aggiornamento FINALE esercizi 8-9-10...\n");

  await db.delete(scoringTables).where(
    inArray(scoringTables.exerciseNumber, [8, 9, 10])
  );
  console.log("✅ Eliminate combinazioni esistenti\n");

  // ESERCIZIO 8: 13 combinazioni
  const exercise8 = [
    { key: "22,23,25", verde: -1, rosso: 1 },
    { key: "22,23,26", verde: -1, rosso: -2 },
    { key: "22,24,25", verde: -1, rosso: 1 },
    { key: "22,24,27", verde: 2, rosso: 1 },
    { key: "22,25,26", verde: -1, rosso: 1 },
    { key: "22,25,27", verde: -1, rosso: 1 },
    { key: "23,24,26", verde: -1, rosso: -2 },
    { key: "23,24,27", verde: 2, rosso: 1 },
    { key: "23,25,26", verde: -1, rosso: -2 },
    { key: "23,26,27", verde: -1, rosso: -2 },
    { key: "24,25,27", verde: 2, rosso: 1 },
    { key: "24,26,27", verde: 2, rosso: 1 },
    { key: "0,0", verde: 0, rosso: 0 },
  ];

  // ESERCIZIO 9: 13 combinazioni (CORRETTE!)
  const exercise9 = [
    { key: "28,29,32", verde: 2, rosso: 1 },
    { key: "28,29,33", verde: -1, rosso: 1 },
    { key: "28,30,31", verde: -1, rosso: -2 },
    { key: "28,30,32", verde: 2, rosso: 1 },
    { key: "28,31,32", verde: 2, rosso: 1 },
    { key: "28,32,33", verde: 2, rosso: 1 },
    { key: "29,30,31", verde: -1, rosso: -2 },
    { key: "29,30,33", verde: -1, rosso: 1 },
    { key: "29,31,33", verde: -1, rosso: 1 },
    { key: "29,32,33", verde: -1, rosso: 1 },
    { key: "30,31,32", verde: -1, rosso: -2 },
    { key: "30,31,33", verde: -1, rosso: -2 },
    { key: "0,0", verde: 0, rosso: 0 },
  ];

  // ESERCIZIO 10: 13 combinazioni (CORRETTE!)
  const exercise10 = [
    { key: "34,35,36", verde: -1, rosso: 1 },
    { key: "34,35,38", verde: -1, rosso: -2 },
    { key: "34,36,38", verde: -1, rosso: -2 },
    { key: "34,37,38", verde: -1, rosso: -2 },
    { key: "34,37,39", verde: 2, rosso: 1 },
    { key: "34,38,39", verde: -1, rosso: -2 },
    { key: "35,36,37", verde: -1, rosso: 1 },
    { key: "35,36,38", verde: -1, rosso: 1 },
    { key: "35,36,39", verde: -1, rosso: 1 },
    { key: "35,37,39", verde: 2, rosso: 1 },
    { key: "36,37,39", verde: 2, rosso: 1 },
    { key: "37,38,39", verde: 2, rosso: 1 },
    { key: "0,0", verde: 0, rosso: 0 },
  ];

  const exercises = [
    { num: 8, data: exercise8 },
    { num: 9, data: exercise9 },
    { num: 10, data: exercise10 },
  ];

  for (const ex of exercises) {
    for (const combo of ex.data) {
      await db.insert(scoringTables).values({
        id: nanoid(),
        exerciseNumber: ex.num,
        combinationKey: combo.key,
        verdeScore: combo.verde,
        rossoScore: combo.rosso,
      });
    }
    console.log(`✅ Esercizio ${ex.num}: ${ex.data.length} combinazioni inserite`);
  }

  console.log("\n✅ Aggiornamento completato!");
  console.log(`📊 Totale: 39 combinazioni`);
}

updateExercises()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore:", error);
    process.exit(1);
  });

