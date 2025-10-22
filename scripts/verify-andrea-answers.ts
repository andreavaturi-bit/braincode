/**
 * Verifica le risposte di Andrea Vaturi
 */

import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// Risposte di Andrea dal file
const andreaAnswers = [
  { ex: 1, plus: "2", minus: "1" },  // Es 1: opzione 2 (+), opzione 1 (-)
  { ex: 2, plus: "5", minus: "6" },  // Es 2: opzione 5 (+), opzione 6 (-)
  { ex: 3, plus: "7", minus: "9" },  // Es 3: opzione 7 (+), opzione 9 (-)
  { ex: 4, plus: "10", minus: "12" }, // Es 4: opzione 10 (+), opzione 12 (-)
  { ex: 5, plus: "13", minus: "15" }, // Es 5: opzione 13 (+), opzione 15 (-)
  { ex: 6, plus: "18", minus: "16" }, // Es 6: opzione 18 (+), opzione 16 (-)
  { ex: 7, plus: "20", minus: "21" }, // Es 7: opzione 20 (+), opzione 21 (-)
  { ex: 8, affermazioni: [24, 25, 27] }, // Es 8
  { ex: 9, affermazioni: [28, 30, 33] }, // Es 9
  { ex: 10, affermazioni: [36, 37, 39] }, // Es 10
];

async function verifyAnswers() {
  console.log("=".repeat(70));
  console.log("VERIFICA RISPOSTE ANDREA VATURI");
  console.log("=".repeat(70));
  console.log();
  
  let verdeDiff = 0;
  let rossoDiff = 0;
  
  // Esercizi 1-7
  for (let i = 0; i < 7; i++) {
    const answer = andreaAnswers[i];
    const key = `${answer.plus}+${answer.minus}-`;
    
    console.log(`ESERCIZIO ${answer.ex}:`);
    console.log(`   Risposta: ${answer.plus}(+) ${answer.minus}(-)`);
    console.log(`   Chiave cercata: "${key}"`);
    
    const combinations = await db
      .select()
      .from(scoringTables)
      .where(eq(scoringTables.exerciseNumber, answer.ex));
    
    console.log(`   Combinazioni in DB: ${combinations.length}`);
    
    const scoring = combinations.find(s => s.combinationKey === key);
    
    if (scoring) {
      console.log(`   ✅ TROVATA! VERDE: ${scoring.verdeScore >= 0 ? '+' : ''}${scoring.verdeScore}, ROSSO: ${scoring.rossoScore >= 0 ? '+' : ''}${scoring.rossoScore}`);
      verdeDiff += scoring.verdeScore;
      rossoDiff += scoring.rossoScore;
    } else {
      console.log(`   ❌ NON TROVATA!`);
      console.log(`   Combinazioni disponibili:`);
      combinations.forEach(c => {
        console.log(`      - "${c.combinationKey}" → V:${c.verdeScore} R:${c.rossoScore}`);
      });
    }
    console.log(`   Differenziali: VERDE=${verdeDiff}, ROSSO=${rossoDiff}`);
    console.log();
  }
  
  // Esercizi 8-10
  for (let i = 7; i < 10; i++) {
    const answer = andreaAnswers[i];
    const key = answer.affermazioni!.sort((a, b) => a - b).join(',');
    
    console.log(`ESERCIZIO ${answer.ex}:`);
    console.log(`   Affermazioni: ${answer.affermazioni!.join(', ')}`);
    console.log(`   Chiave cercata: "${key}"`);
    
    const combinations = await db
      .select()
      .from(scoringTables)
      .where(eq(scoringTables.exerciseNumber, answer.ex));
    
    console.log(`   Combinazioni in DB: ${combinations.length}`);
    
    const scoring = combinations.find(s => s.combinationKey === key);
    
    if (scoring) {
      console.log(`   ✅ TROVATA! VERDE: ${scoring.verdeScore >= 0 ? '+' : ''}${scoring.verdeScore}, ROSSO: ${scoring.rossoScore >= 0 ? '+' : ''}${scoring.rossoScore}`);
      verdeDiff += scoring.verdeScore;
      rossoDiff += scoring.rossoScore;
    } else {
      console.log(`   ❌ NON TROVATA!`);
      console.log(`   Prime 5 combinazioni disponibili:`);
      combinations.slice(0, 5).forEach(c => {
        console.log(`      - "${c.combinationKey}" → V:${c.verdeScore} R:${c.rossoScore}`);
      });
    }
    console.log(`   Differenziali: VERDE=${verdeDiff}, ROSSO=${rossoDiff}`);
    console.log();
  }
  
  console.log("=".repeat(70));
  console.log("RISULTATO FINALE:");
  console.log(`   Differenziale VERDE: ${verdeDiff >= 0 ? '+' : ''}${verdeDiff}`);
  console.log(`   Differenziale ROSSO: ${rossoDiff >= 0 ? '+' : ''}${rossoDiff}`);
  console.log();
  
  const verdeQty = 12 + verdeDiff;
  const rossoPos = 24 + rossoDiff;
  const rossoQty = rossoPos - verdeQty;
  const bluQty = 36 - rossoPos;
  
  console.log(`   VERDE: ${verdeQty} (atteso: 22)`);
  console.log(`   ROSSO: ${rossoQty} (atteso: 11)`);
  console.log(`   BLU:   ${bluQty} (atteso: 3)`);
  console.log("=".repeat(70));
}

verifyAnswers().then(() => process.exit(0)).catch((error) => {
  console.error("❌ Errore:", error);
  process.exit(1);
});
