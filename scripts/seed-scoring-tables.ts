import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

// Tabelle di scoring estratte dalle immagini del libro
const scoringData = [
  // Esercizio 1: Comportamento in gruppo con estranei
  { exerciseNumber: 1, combinationKey: "1+2-", verdeScore: -1, rossoScore: -1 },
  { exerciseNumber: 1, combinationKey: "1+3-", verdeScore: 0, rossoScore: -1 },
  { exerciseNumber: 1, combinationKey: "2+3-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 1, combinationKey: "2+1-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 1, combinationKey: "3+2-", verdeScore: -1, rossoScore: 0 },
  { exerciseNumber: 1, combinationKey: "3+1-", verdeScore: 0, rossoScore: 1 },

  // Esercizio 2: Reazione alle contrarietà
  { exerciseNumber: 2, combinationKey: "4+5-", verdeScore: -1, rossoScore: 0 },
  { exerciseNumber: 2, combinationKey: "4+6-", verdeScore: 0, rossoScore: 1 },
  { exerciseNumber: 2, combinationKey: "5+6-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 2, combinationKey: "5+4-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 2, combinationKey: "6+4-", verdeScore: -1, rossoScore: -1 },
  { exerciseNumber: 2, combinationKey: "6+5-", verdeScore: 0, rossoScore: -1 },

  // Esercizio 3: Periodo della vita preferito
  { exerciseNumber: 3, combinationKey: "7+8-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 3, combinationKey: "7+9-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 3, combinationKey: "8+9-", verdeScore: 0, rossoScore: 1 },
  { exerciseNumber: 3, combinationKey: "8+7-", verdeScore: -1, rossoScore: 0 },
  { exerciseNumber: 3, combinationKey: "9+7-", verdeScore: -1, rossoScore: -1 },
  { exerciseNumber: 3, combinationKey: "9+8-", verdeScore: 0, rossoScore: -1 },

  // Esercizio 4: Prima impressione
  { exerciseNumber: 4, combinationKey: "10+11-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 4, combinationKey: "10+12-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 4, combinationKey: "11+12-", verdeScore: 0, rossoScore: 1 },
  { exerciseNumber: 4, combinationKey: "11+10-", verdeScore: -1, rossoScore: 0 },
  { exerciseNumber: 4, combinationKey: "12+10-", verdeScore: -1, rossoScore: -1 },
  { exerciseNumber: 4, combinationKey: "12+11-", verdeScore: 0, rossoScore: -1 },

  // Esercizio 5: Rapporto con il tempo
  { exerciseNumber: 5, combinationKey: "13+14-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 5, combinationKey: "13+15-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 5, combinationKey: "14+15-", verdeScore: 0, rossoScore: 1 },
  { exerciseNumber: 5, combinationKey: "14+13-", verdeScore: -1, rossoScore: 0 },
  { exerciseNumber: 5, combinationKey: "15+13-", verdeScore: -1, rossoScore: -1 },
  { exerciseNumber: 5, combinationKey: "15+14-", verdeScore: 0, rossoScore: -1 },

  // Esercizio 6: Tempo libero
  { exerciseNumber: 6, combinationKey: "16+17-", verdeScore: -1, rossoScore: -1 },
  { exerciseNumber: 6, combinationKey: "16+18-", verdeScore: 0, rossoScore: -1 },
  { exerciseNumber: 6, combinationKey: "17+18-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 6, combinationKey: "17+16-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 6, combinationKey: "18+16-", verdeScore: 0, rossoScore: 1 },
  { exerciseNumber: 6, combinationKey: "18+17-", verdeScore: -1, rossoScore: 0 },

  // Esercizio 7: Importanza vitale
  { exerciseNumber: 7, combinationKey: "19+20-", verdeScore: -1, rossoScore: 0 },
  { exerciseNumber: 7, combinationKey: "19+21-", verdeScore: 0, rossoScore: 1 },
  { exerciseNumber: 7, combinationKey: "20+21-", verdeScore: 1, rossoScore: 1 },
  { exerciseNumber: 7, combinationKey: "20+19-", verdeScore: 1, rossoScore: 0 },
  { exerciseNumber: 7, combinationKey: "21+19-", verdeScore: 0, rossoScore: -1 },
  { exerciseNumber: 7, combinationKey: "21+20-", verdeScore: -1, rossoScore: -1 },
];

async function seedScoringTables() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding scoring tables...");

  for (const data of scoringData) {
    await db.insert(scoringTables).values({
      id: nanoid(),
      ...data,
    });
  }

  console.log(`✓ Inserted ${scoringData.length} scoring table entries`);
  process.exit(0);
}

seedScoringTables().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});

