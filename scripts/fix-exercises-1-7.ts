/**
 * Script per correggere le combinazioni degli esercizi 1-7
 * Estratte dalle immagini delle tabelle del libro originale
 * Ogni esercizio ha esattamente 6 combinazioni
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

const db = drizzle(process.env.DATABASE_URL!);

async function fixExercises1to7() {
  console.log("🔄 Correzione esercizi 1-7...\n");

  // Elimina tutte le combinazioni esistenti per esercizi 1-7
  await db.delete(scoringTables).where(
    inArray(scoringTables.exerciseNumber, [1, 2, 3, 4, 5, 6, 7])
  );
  console.log("✅ Eliminate combinazioni esistenti\n");

  // ESERCIZIO 1: 6 combinazioni
  // Opzioni: 1, 2, 3
  // Riga 1: + + - - (opzione 1 e 2 con +, opzione 3 con -)
  // Riga 2: - + + - (opzione 2 e 3 con +, opzione 1 con -)
  // Riga 3: - - + + (opzione 3 con +, opzione 1 e 2 con -)
  const exercise1 = [
    { key: "1+2-", verde: -1, rosso: -1 },  // Col 1: opz 1(+), opz 2(-) → V:-1 R:-1
    { key: "1+3-", verde: 0, rosso: -1 },   // Col 2: opz 1(+), opz 3(-) → V:0 R:-1
    { key: "2+3-", verde: 1, rosso: 0 },    // Col 3: opz 2(+), opz 3(-) → V:+1 R:0
    { key: "2+1-", verde: 1, rosso: 1 },    // Col 4: opz 2(+), opz 1(-) → V:+1 R:+1
    { key: "3+1-", verde: 0, rosso: 1 },    // Col 5: opz 3(+), opz 1(-) → V:0 R:+1
    { key: "3+2-", verde: -1, rosso: 0 },   // Col 6: opz 3(+), opz 2(-) → V:-1 R:0
  ];

  // ESERCIZIO 2: 6 combinazioni
  // Opzioni: 4, 5, 6
  const exercise2 = [
    { key: "4+5-", verde: -1, rosso: 0 },   // Col 1
    { key: "4+6-", verde: 0, rosso: 1 },    // Col 2
    { key: "5+6-", verde: 1, rosso: 1 },    // Col 3
    { key: "5+4-", verde: 1, rosso: 0 },    // Col 4
    { key: "6+4-", verde: -1, rosso: -1 },  // Col 5
    { key: "6+5-", verde: 0, rosso: -1 },   // Col 6
  ];

  // ESERCIZIO 3: 6 combinazioni
  // Opzioni: 7, 8, 9
  const exercise3 = [
    { key: "7+8-", verde: 1, rosso: 0 },    // Col 1
    { key: "7+9-", verde: 1, rosso: 1 },    // Col 2
    { key: "8+9-", verde: 0, rosso: 1 },    // Col 3
    { key: "8+7-", verde: -1, rosso: 0 },   // Col 4
    { key: "9+7-", verde: -1, rosso: -1 },  // Col 5
    { key: "9+8-", verde: 0, rosso: -1 },   // Col 6
  ];

  // ESERCIZIO 4: 6 combinazioni
  // Opzioni: 10, 11, 12
  const exercise4 = [
    { key: "10+11-", verde: 1, rosso: 0 },  // Col 1
    { key: "10+12-", verde: 1, rosso: 1 },  // Col 2
    { key: "11+12-", verde: 0, rosso: 1 },  // Col 3
    { key: "11+10-", verde: -1, rosso: 0 }, // Col 4
    { key: "12+10-", verde: -1, rosso: -1 },// Col 5
    { key: "12+11-", verde: 0, rosso: -1 }, // Col 6
  ];

  // ESERCIZIO 5: 6 combinazioni
  // Opzioni: 13, 14, 15
  const exercise5 = [
    { key: "13+14-", verde: 1, rosso: 0 },  // Col 1
    { key: "13+15-", verde: 1, rosso: 1 },  // Col 2
    { key: "14+15-", verde: 0, rosso: 1 },  // Col 3
    { key: "14+13-", verde: -1, rosso: 0 }, // Col 4
    { key: "15+13-", verde: -1, rosso: -1 },// Col 5
    { key: "15+14-", verde: 0, rosso: -1 }, // Col 6
  ];

  // ESERCIZIO 6: 6 combinazioni
  // Opzioni: 16, 17, 18
  const exercise6 = [
    { key: "16+17-", verde: -1, rosso: -1 },// Col 1
    { key: "16+18-", verde: 0, rosso: -1 }, // Col 2
    { key: "17+18-", verde: 1, rosso: 0 },  // Col 3
    { key: "17+16-", verde: 1, rosso: 1 },  // Col 4
    { key: "18+16-", verde: 0, rosso: 1 },  // Col 5
    { key: "18+17-", verde: -1, rosso: 0 }, // Col 6
  ];

  // ESERCIZIO 7: 6 combinazioni
  // Opzioni: 19, 20, 21
  const exercise7 = [
    { key: "19+20-", verde: -1, rosso: 0 },  // Col 1
    { key: "19+21-", verde: 0, rosso: 1 },   // Col 2
    { key: "20+21-", verde: 1, rosso: 1 },   // Col 3
    { key: "20+19-", verde: 1, rosso: 0 },   // Col 4
    { key: "21+19-", verde: 0, rosso: -1 },  // Col 5
    { key: "21+20-", verde: -1, rosso: -1 }, // Col 6
  ];

  const exercises = [
    { num: 1, data: exercise1 },
    { num: 2, data: exercise2 },
    { num: 3, data: exercise3 },
    { num: 4, data: exercise4 },
    { num: 5, data: exercise5 },
    { num: 6, data: exercise6 },
    { num: 7, data: exercise7 },
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

  console.log("\n✅ Correzione completata!");
  console.log(`📊 Totale combinazioni inserite: ${exercises.reduce((sum, ex) => sum + ex.data.length, 0)}`);
}

fixExercises1to7()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore:", error);
    process.exit(1);
  });

