/**
 * Script di test finale per verificare il calcolo corretto
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
  console.log("TEST CALCOLO PUNTEGGI BRAINCODE - FORMULA CORRETTA");
  console.log("=".repeat(70));
  console.log();
  
  let verdeDiff = 0;
  let rossoDiff = 0;
  
  console.log("📍 POSIZIONI INIZIALI SUL DISCO:");
  console.log(`   VERDE: 12`);
  console.log(`   ROSSO: 24`);
  console.log(`   BLU:   0`);
  console.log();
  console.log("-".repeat(70));
  console.log();
  
  for (const answer of testAnswers) {
    console.log(`ESERCIZIO ${answer.exerciseNumber}:`);
    
    if (answer.exerciseNumber <= 7) {
      const combinationKey = `${answer.answerData.plus}+${answer.answerData.minus}-`;
      console.log(`   Risposta: opzione ${answer.answerData.plus} (+), opzione ${answer.answerData.minus} (-)`);
      console.log(`   Chiave: ${combinationKey}`);
      
      const scoring = await db
        .select()
        .from(scoringTables)
        .where(eq(scoringTables.exerciseNumber, answer.exerciseNumber))
        .then(results => results.find(s => s.combinationKey === combinationKey));
      
      if (scoring) {
        console.log(`   Differenziale: VERDE ${scoring.verdeScore >= 0 ? '+' : ''}${scoring.verdeScore}, ROSSO ${scoring.rossoScore >= 0 ? '+' : ''}${scoring.rossoScore}`);
        verdeDiff += scoring.verdeScore;
        rossoDiff += scoring.rossoScore;
        console.log(`   Differenziali accumulati: VERDE=${verdeDiff >= 0 ? '+' : ''}${verdeDiff}, ROSSO=${rossoDiff >= 0 ? '+' : ''}${rossoDiff}`);
      } else {
        console.log(`   ⚠️  Combinazione non trovata!`);
      }
    } else {
      const selectedKey = answer.answerData.map((s: string) => parseInt(s)).sort((a: number, b: number) => a - b).join(',');
      console.log(`   Affermazioni: ${answer.answerData.join(', ')}`);
      console.log(`   Chiave: ${selectedKey}`);
      
      const scoring = await db
        .select()
        .from(scoringTables)
        .where(eq(scoringTables.exerciseNumber, answer.exerciseNumber))
        .then(results => results.find(s => s.combinationKey === selectedKey));
      
      if (scoring) {
        console.log(`   Differenziale: VERDE ${scoring.verdeScore >= 0 ? '+' : ''}${scoring.verdeScore}, ROSSO ${scoring.rossoScore >= 0 ? '+' : ''}${scoring.rossoScore}`);
        verdeDiff += scoring.verdeScore;
        rossoDiff += scoring.rossoScore;
        console.log(`   Differenziali accumulati: VERDE=${verdeDiff >= 0 ? '+' : ''}${verdeDiff}, ROSSO=${rossoDiff >= 0 ? '+' : ''}${rossoDiff}`);
      } else {
        console.log(`   ⚠️  Combinazione non trovata!`);
      }
    }
    
    console.log();
  }
  
  console.log("-".repeat(70));
  console.log();
  
  // Calcolo finale
  const verdeFinal = 12 + verdeDiff;
  const rossoFinal = 24 + rossoDiff;
  const bluFinal = 36 - rossoFinal;
  
  console.log("📊 CALCOLO FINALE:");
  console.log(`   Differenziale VERDE: ${verdeDiff >= 0 ? '+' : ''}${verdeDiff}`);
  console.log(`   Differenziale ROSSO: ${rossoDiff >= 0 ? '+' : ''}${rossoDiff}`);
  console.log();
  console.log(`   VERDE finale = 12 + (${verdeDiff}) = ${verdeFinal}`);
  console.log(`   ROSSO finale = 24 + (${rossoDiff}) = ${rossoFinal}`);
  console.log(`   BLU finale = 36 - ${rossoFinal} = ${bluFinal}`);
  console.log();
  console.log("🎯 QUANTITÀ (per la barra):");
  console.log(`   VERDE: ${verdeFinal} unità`);
  console.log(`   BLU:   ${bluFinal} unità`);
  console.log(`   ROSSO: ${36 - verdeFinal - bluFinal} unità`);
  console.log(`   TOTALE: ${verdeFinal + bluFinal + (36 - verdeFinal - bluFinal)} (deve essere 36)`);
  console.log();
  console.log("=".repeat(70));
}

testScoring().then(() => process.exit(0)).catch((error) => {
  console.error("❌ Errore:", error);
  process.exit(1);
});
