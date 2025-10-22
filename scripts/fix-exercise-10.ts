/**
 * Script per correggere le combinazioni dell'esercizio 10
 * Tutte le 13 combinazioni corrette dall'Excel
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

const db = drizzle(process.env.DATABASE_URL!);

async function fixExercise10() {
  console.log("🔄 Correzione esercizio 10...\n");

  // Elimina le combinazioni esistenti per esercizio 10
  await db.delete(scoringTables).where(eq(scoringTables.exerciseNumber, 10));
  console.log("✅ Eliminate combinazioni esistenti\n");

  // ESERCIZIO 10: 13 combinazioni corrette (affermazioni 34-39)
  const exercise10: Array<{ key: string; verde: number; rosso: number }> = [
    { key: "34,35,36", verde: -1, rosso: 1 },
    { key: "34,35,38", verde: -1, rosso: -2 },
    { key: "34,36,38", verde: -1, rosso: -2 },
    { key: "34,37,38", verde: -1, rosso: -2 },
    { key: "34,37", verde: 2, rosso: 1 },
    { key: "34,38", verde: -1, rosso: -2 },
    { key: "35,36,37", verde: -1, rosso: 1 },
    { key: "35,36,38", verde: -1, rosso: 1 },
    { key: "35,36", verde: -1, rosso: 1 },
    { key: "35,37", verde: 2, rosso: 1 },
    { key: "36,37", verde: 2, rosso: 1 },
    { key: "37,38", verde: 2, rosso: 1 },
    { key: "0,0", verde: 0, rosso: 0 }, // Default
  ];

  for (const combo of exercise10) {
    await db.insert(scoringTables).values({
      id: nanoid(),
      exerciseNumber: 10,
      combinationKey: combo.key,
      verdeScore: combo.verde,
      rossoScore: combo.rosso,
    });
  }
  
  console.log(`✅ Esercizio 10: ${exercise10.length} combinazioni inserite`);
  console.log("\n✅ Correzione completata!");
}

fixExercise10()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore:", error);
    process.exit(1);
  });

