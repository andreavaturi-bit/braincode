/**
 * Script per aggiornare le combinazioni di scoring per esercizi 8, 9, 10
 * Basato sui dati estratti dal file Excel Esercizio8-9-10.xlsx
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

const db = drizzle(process.env.DATABASE_URL!);

async function updateExercises() {
  console.log("🔄 Aggiornamento combinazioni esercizi 8-10...\n");

  // Elimina le combinazioni esistenti per esercizi 8-10
  await db.delete(scoringTables).where(eq(scoringTables.exerciseNumber, 8));
  await db.delete(scoringTables).where(eq(scoringTables.exerciseNumber, 9));
  await db.delete(scoringTables).where(eq(scoringTables.exerciseNumber, 10));
  console.log("✅ Eliminate combinazioni esistenti\n");

  // ESERCIZIO 8: 13 combinazioni (affermazioni 22-27)
  const exercise8: Array<{ key: string; verde: number; rosso: number }> = [
    { key: "22,23,24,25,26,27", verde: 2, rosso: -2 },
    { key: "22,23,24,25,26", verde: 2, rosso: -2 },
    { key: "22,23,24,25,27", verde: 2, rosso: -2 },
    { key: "22,23,24,25", verde: 2, rosso: -2 },
    { key: "22,23,24,26,27", verde: 2, rosso: -2 },
    { key: "22,23,24,26", verde: 2, rosso: -2 },
    { key: "22,23,24,27", verde: 2, rosso: -2 },
    { key: "22,23,24", verde: 2, rosso: -2 },
    { key: "22,23,25,26,27", verde: 2, rosso: -2 },
    { key: "22,23,25,26", verde: 2, rosso: -2 },
    { key: "22,23,25,27", verde: 2, rosso: -2 },
    { key: "22,23,25", verde: 2, rosso: -2 },
    { key: "0,0", verde: 0, rosso: 0 }, // Default per tutte le altre combinazioni
  ];

  for (const combo of exercise8) {
    await db.insert(scoringTables).values({
      id: nanoid(),
      exerciseNumber: 8,
      combinationKey: combo.key,
      verdeScore: combo.verde,
      rossoScore: combo.rosso,
    });
  }
  console.log(`✅ Esercizio 8: ${exercise8.length} combinazioni inserite`);

  // ESERCIZIO 9: 13 combinazioni (affermazioni 28-33)
  const exercise9: Array<{ key: string; verde: number; rosso: number }> = [
    { key: "28,29,32", verde: 2, rosso: 1 },
    { key: "28,30,33", verde: -1, rosso: 1 },
    { key: "28,30,31", verde: -1, rosso: -2 },
    { key: "29,30,32", verde: 2, rosso: 1 },
    { key: "29,30,31,32", verde: 2, rosso: 1 },
    { key: "29,32,33", verde: 2, rosso: 1 },
    { key: "29,31,33", verde: -1, rosso: -2 },
    { key: "30,33", verde: -1, rosso: 1 },
    { key: "31,33", verde: -1, rosso: 1 },
    { key: "32,33", verde: -1, rosso: 1 },
    { key: "31,32", verde: -1, rosso: -2 },
    { key: "31,32,33", verde: -1, rosso: -2 },
    { key: "0,0", verde: 0, rosso: 0 }, // Default
  ];

  for (const combo of exercise9) {
    await db.insert(scoringTables).values({
      id: nanoid(),
      exerciseNumber: 9,
      combinationKey: combo.key,
      verdeScore: combo.verde,
      rossoScore: combo.rosso,
    });
  }
  console.log(`✅ Esercizio 9: ${exercise9.length} combinazioni inserite`);

  // ESERCIZIO 10: 13 combinazioni (affermazioni 34-39)
  const exercise10: Array<{ key: string; verde: number; rosso: number }> = [
    { key: "34,35,36", verde: -1, rosso: 1 },
    { key: "34,35,38", verde: -1, rosso: -2 },
    { key: "34,36,38", verde: -1, rosso: -2 },
    { key: "34,37,38", verde: -1, rosso: -2 },
    { key: "35,36", verde: 2, rosso: 1 },
    { key: "35,37,39", verde: -1, rosso: -2 },
    { key: "36,37", verde: -1, rosso: 1 },
    { key: "37,38", verde: -1, rosso: 1 },
    { key: "39", verde: -1, rosso: 1 },
    { key: "38,39", verde: 2, rosso: 1 },
    { key: "38,39", verde: 2, rosso: 1 }, // Duplicato nell'Excel
    { key: "38,39", verde: 2, rosso: 1 }, // Duplicato nell'Excel
    { key: "0,0", verde: 0, rosso: 0 }, // Default
  ];

  // Rimuovo duplicati
  const exercise10Unique = Array.from(
    new Map(exercise10.map(item => [item.key, item])).values()
  );

  for (const combo of exercise10Unique) {
    await db.insert(scoringTables).values({
      id: nanoid(),
      exerciseNumber: 10,
      combinationKey: combo.key,
      verdeScore: combo.verde,
      rossoScore: combo.rosso,
    });
  }
  console.log(`✅ Esercizio 10: ${exercise10Unique.length} combinazioni inserite (duplicati rimossi)`);

  console.log("\n✅ Aggiornamento completato!");
  console.log(`📊 Totale combinazioni: ${exercise8.length + exercise9.length + exercise10Unique.length}`);
}

updateExercises()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore:", error);
    process.exit(1);
  });

