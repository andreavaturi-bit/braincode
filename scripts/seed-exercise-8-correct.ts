import { getDb } from "../server/db";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

// Esercizio 8: 12 combinazioni esplicite + 1 default (0,0)
// Estratte dall'immagine della tabella del libro

const exercise8Data = [
  // Dalla tabella dell'esercizio 8 (immagine 32)
  // Leggendo le colonne da sinistra a destra:
  
  // Colonna 1: 22+23+24
  { combinationKey: "22,23,24", verdeScore: -1, rossoScore: +1 },
  
  // Colonna 2: 22+23+25
  { combinationKey: "22,23,25", verdeScore: -1, rossoScore: -2 },
  
  // Colonna 3: 22+24+25
  { combinationKey: "22,24,25", verdeScore: -1, rossoScore: +1 },
  
  // Colonna 4: 23+24+25
  { combinationKey: "23,24,25", verdeScore: +2, rossoScore: +1 },
  
  // Colonna 5: 22+23+26
  { combinationKey: "22,23,26", verdeScore: -1, rossoScore: +1 },
  
  // Colonna 6: 22+24+26
  { combinationKey: "22,24,26", verdeScore: -1, rossoScore: +1 },
  
  // Colonna 7: 22+25+26
  { combinationKey: "22,25,26", verdeScore: -1, rossoScore: -2 },
  
  // Colonna 8: 23+24+26
  { combinationKey: "23,24,26", verdeScore: +2, rossoScore: +1 },
  
  // Colonna 9: 22+25+27
  { combinationKey: "22,25,27", verdeScore: -1, rossoScore: -2 },
  
  // Colonna 10: 24+25+27
  { combinationKey: "24,25,27", verdeScore: -1, rossoScore: -2 },
  
  // Colonna 11: 23+26+27
  { combinationKey: "23,26,27", verdeScore: +2, rossoScore: +1 },
  
  // Colonna 12: 25+26+27
  { combinationKey: "25,26,27", verdeScore: +2, rossoScore: +1 },
  
  // Colonna 13: Tutte le altre possibilità
  { combinationKey: "default", verdeScore: 0, rossoScore: 0 },
];

async function seedExercise8() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Seeding Exercise 8 scoring tables...");

  for (const data of exercise8Data) {
    await db.insert(scoringTables).values({
      id: nanoid(),
      exerciseNumber: 8,
      combinationKey: data.combinationKey,
      verdeScore: data.verdeScore,
      rossoScore: data.rossoScore,
    });
  }

  console.log(`✅ Seeded ${exercise8Data.length} combinations for Exercise 8`);
}

seedExercise8()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

