/**
 * Test finale con formula corretta
 */

import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const testAnswers = [
  { exerciseNumber: 1, answerData: { plus: "2", minus: "1" } },
  { exerciseNumber: 2, answerData: { plus: "5", minus: "4" } },
  { exerciseNumber: 3, answerData: { plus: "8", minus: "7" } },
  { exerciseNumber: 4, answerData: { plus: "10", minus: "12" } },
  { exerciseNumber: 5, answerData: { plus: "15", minus: "13" } },
  { exerciseNumber: 6, answerData: { plus: "17", minus: "16" } },
  { exerciseNumber: 7, answerData: { plus: "20", minus: "19" } },
  { exerciseNumber: 8, answerData: ["22", "23", "24"] },
  { exerciseNumber: 9, answerData: ["28", "29", "32"] },
  { exerciseNumber: 10, answerData: ["34", "35", "36"] },
];

async function testScoring() {
  console.log("=".repeat(70));
  console.log("TEST CALCOLO FINALE - FORMULA CORRETTA");
  console.log("=".repeat(70));
  console.log();
  
  let verdeDiff = 0;
  let rossoDiff = 0;
  
  for (const answer of testAnswers) {
    if (answer.exerciseNumber <= 7) {
      const combinationKey = `${answer.answerData.plus}+${answer.answerData.minus}-`;
      const scoring = await db
        .select()
        .from(scoringTables)
        .where(eq(scoringTables.exerciseNumber, answer.exerciseNumber))
        .then(results => results.find(s => s.combinationKey === combinationKey));
      
      if (scoring) {
        verdeDiff += scoring.verdeScore;
        rossoDiff += scoring.rossoScore;
      }
    } else {
      const selectedKey = answer.answerData.map((s: string) => parseInt(s)).sort((a: number, b: number) => a - b).join(',');
      const scoring = await db
        .select()
        .from(scoringTables)
        .where(eq(scoringTables.exerciseNumber, answer.exerciseNumber))
        .then(results => results.find(s => s.combinationKey === selectedKey));
      
      if (scoring) {
        verdeDiff += scoring.verdeScore;
        rossoDiff += scoring.rossoScore;
      }
    }
  }
  
  console.log("📊 DIFFERENZIALI ACCUMULATI:");
  console.log(`   VERDE: ${verdeDiff >= 0 ? '+' : ''}${verdeDiff}`);
  console.log(`   ROSSO: ${rossoDiff >= 0 ? '+' : ''}${rossoDiff}`);
  console.log();
  
  // Formula corretta
  const verdeQuantity = 12 + verdeDiff;
  const rossoPosition = 24 + rossoDiff;
  const rossoQuantity = rossoPosition - verdeQuantity;
  const bluQuantity = 36 - rossoPosition;
  
  console.log("🎯 CALCOLO FINALE:");
  console.log(`   VERDE quantity = 12 + (${verdeDiff}) = ${verdeQuantity}`);
  console.log(`   ROSSO position = 24 + (${rossoDiff}) = ${rossoPosition}`);
  console.log(`   ROSSO quantity = ${rossoPosition} - ${verdeQuantity} = ${rossoQuantity}`);
  console.log(`   BLU quantity = 36 - ${rossoPosition} = ${bluQuantity}`);
  console.log();
  console.log("📊 QUANTITÀ PER LA BARRA:");
  console.log(`   VERDE: ${verdeQuantity} unità (posizioni 1-${verdeQuantity})`);
  console.log(`   ROSSO: ${rossoQuantity} unità (posizioni ${verdeQuantity + 1}-${rossoPosition})`);
  console.log(`   BLU:   ${bluQuantity} unità (posizioni ${rossoPosition + 1}-36)`);
  console.log(`   TOTALE: ${verdeQuantity + rossoQuantity + bluQuantity} (deve essere 36)`);
  console.log();
  
  const total = verdeQuantity + rossoQuantity + bluQuantity;
  const verdePercent = (verdeQuantity / total) * 100;
  const rossoPercent = (rossoQuantity / total) * 100;
  const bluPercent = (bluQuantity / total) * 100;
  
  console.log("📈 PERCENTUALI:");
  console.log(`   VERDE: ${verdePercent.toFixed(1)}%`);
  console.log(`   ROSSO: ${rossoPercent.toFixed(1)}%`);
  console.log(`   BLU:   ${bluPercent.toFixed(1)}%`);
  console.log();
  console.log("=".repeat(70));
}

testScoring().then(() => process.exit(0)).catch((error) => {
  console.error("❌ Errore:", error);
  process.exit(1);
});
