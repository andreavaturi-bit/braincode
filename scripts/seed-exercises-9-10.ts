import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { randomUUID } from "crypto";

const db = drizzle(process.env.DATABASE_URL!);

async function seedExercises9And10() {
  console.log("🌱 Seeding scoring tables for exercises 9 and 10...");

  // Esercizio 9: Affermazioni 28-33
  const exercise9Data = [
    { combination: "28,29,30", verde: 2, rosso: 1 },
    { combination: "28,29,31", verde: -1, rosso: 1 },
    { combination: "28,29,32", verde: -1, rosso: -2 },
    { combination: "28,29,33", verde: 2, rosso: 1 },
    { combination: "28,30,31", verde: 2, rosso: 1 },
    { combination: "28,30,32", verde: 2, rosso: 1 },
    { combination: "28,30,33", verde: -1, rosso: -2 },
    { combination: "28,31,32", verde: -1, rosso: 1 },
    { combination: "28,31,33", verde: -1, rosso: 1 },
    { combination: "28,32,33", verde: -1, rosso: 1 },
    { combination: "29,30,31", verde: -1, rosso: -2 },
    { combination: "29,30,32", verde: -1, rosso: -2 },
    { combination: "29,30,33", verde: 0, rosso: 0 },
  ];

  // Esercizio 10: Affermazioni 34-39
  const exercise10Data = [
    { combination: "34,35,36", verde: -1, rosso: 1 },
    { combination: "34,35,37", verde: -1, rosso: -2 },
    { combination: "34,35,38", verde: -1, rosso: -2 },
    { combination: "34,35,39", verde: -1, rosso: -2 },
    { combination: "34,36,37", verde: 2, rosso: 1 },
    { combination: "34,36,38", verde: -1, rosso: -2 },
    { combination: "34,37,38", verde: -1, rosso: 1 },
    { combination: "34,37,39", verde: -1, rosso: 1 },
    { combination: "34,38,39", verde: -1, rosso: 1 },
    { combination: "35,36,37", verde: 2, rosso: 1 },
    { combination: "35,36,38", verde: 2, rosso: 1 },
    { combination: "35,36,39", verde: 2, rosso: 1 },
  ];

  try {
    // Insert exercise 9 data
    for (const data of exercise9Data) {
      await db.insert(scoringTables).values({
        id: randomUUID(),
        exerciseNumber: 9,
        combinationKey: data.combination,
        verdeScore: data.verde,
        rossoScore: data.rosso,
      });
    }
    console.log(`✅ Inserted ${exercise9Data.length} combinations for Exercise 9`);

    // Insert exercise 10 data
    for (const data of exercise10Data) {
      await db.insert(scoringTables).values({
        id: randomUUID(),
        exerciseNumber: 10,
        combinationKey: data.combination,
        verdeScore: data.verde,
        rossoScore: data.rosso,
      });
    }
    console.log(`✅ Inserted ${exercise10Data.length} combinations for Exercise 10`);

    console.log("🎉 Seeding completed successfully!");
    console.log(`📊 Total combinations: ${exercise9Data.length + exercise10Data.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seedExercises9And10()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

