import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function generateVerificationTable() {
  console.log("# TABELLA DI VERIFICA COMPLETA - BRAINCODE\n");
  console.log("## Risposte di Andrea Vaturi\n");
  
  const answers: any = {
    1: { plus: '2', minus: '1' },
    2: { plus: '5', minus: '6' },
    3: { plus: '7', minus: '9' },
    4: { plus: '10', minus: '12' },
    5: { plus: '13', minus: '15' },
    6: { plus: '18', minus: '16' },
    7: { plus: '20', minus: '21' },
    8: [24, 25, 27],
    9: [28, 30, 33],
    10: [36, 37, 39],
  };
  
  let verdeDiff = 0;
  let rossoDiff = 0;
  
  console.log("| Esercizio | Risposta | Chiave DB | Trovata? | VERDE | ROSSO | Diff V | Diff R |");
  console.log("|-----------|----------|-----------|----------|-------|-------|--------|--------|");
  
  // Esercizi 1-7
  for (let ex = 1; ex <= 7; ex++) {
    const key = `${answers[ex].plus}+${answers[ex].minus}-`;
    const combinations = await db.select().from(scoringTables).where(eq(scoringTables.exerciseNumber, ex));
    const found = combinations.find(c => c.combinationKey === key);
    
    if (found) {
      verdeDiff += found.verdeScore;
      rossoDiff += found.rossoScore;
      console.log(`| ${ex} | ${answers[ex].plus}(+) ${answers[ex].minus}(-) | ${key} | ✅ | ${found.verdeScore >= 0 ? '+' : ''}${found.verdeScore} | ${found.rossoScore >= 0 ? '+' : ''}${found.rossoScore} | ${verdeDiff >= 0 ? '+' : ''}${verdeDiff} | ${rossoDiff >= 0 ? '+' : ''}${rossoDiff} |`);
    } else {
      console.log(`| ${ex} | ${answers[ex].plus}(+) ${answers[ex].minus}(-) | ${key} | ❌ | 0 | 0 | ${verdeDiff >= 0 ? '+' : ''}${verdeDiff} | ${rossoDiff >= 0 ? '+' : ''}${rossoDiff} |`);
    }
  }
  
  // Esercizi 8-10
  for (let ex = 8; ex <= 10; ex++) {
    const key = answers[ex].sort((a: number, b: number) => a - b).join(',');
    const combinations = await db.select().from(scoringTables).where(eq(scoringTables.exerciseNumber, ex));
    const found = combinations.find(c => c.combinationKey === key);
    
    if (found) {
      verdeDiff += found.verdeScore;
      rossoDiff += found.rossoScore;
      console.log(`| ${ex} | ${answers[ex].join(', ')} | ${key} | ✅ | ${found.verdeScore >= 0 ? '+' : ''}${found.verdeScore} | ${found.rossoScore >= 0 ? '+' : ''}${found.rossoScore} | ${verdeDiff >= 0 ? '+' : ''}${verdeDiff} | ${rossoDiff >= 0 ? '+' : ''}${rossoDiff} |`);
    } else {
      console.log(`| ${ex} | ${answers[ex].join(', ')} | ${key} | ❌ | 0 | 0 | ${verdeDiff >= 0 ? '+' : ''}${verdeDiff} | ${rossoDiff >= 0 ? '+' : ''}${rossoDiff} |`);
    }
  }
  
  console.log("\n## RISULTATO FINALE\n");
  console.log(`- **Differenziale VERDE:** ${verdeDiff >= 0 ? '+' : ''}${verdeDiff} (atteso: +10)`);
  console.log(`- **Differenziale ROSSO:** ${rossoDiff >= 0 ? '+' : ''}${rossoDiff} (atteso: +9)`);
  console.log();
  
  const verdeQty = 12 + verdeDiff;
  const rossoPos = 24 + rossoDiff;
  const rossoQty = rossoPos - verdeQty;
  const bluQty = 36 - rossoPos;
  
  console.log("### Quantità Finali\n");
  console.log(`- **VERDE:** ${verdeQty} (atteso: 22)`);
  console.log(`- **ROSSO:** ${rossoQty} (atteso: 11)`);
  console.log(`- **BLU:** ${bluQty} (atteso: 3)`);
  console.log();
  
  // Mostra tutte le combinazioni nel database
  console.log("\n## TUTTE LE COMBINAZIONI NEL DATABASE\n");
  
  for (let ex = 1; ex <= 10; ex++) {
    const combinations = await db.select().from(scoringTables).where(eq(scoringTables.exerciseNumber, ex));
    console.log(`\n### Esercizio ${ex} (${combinations.length} combinazioni)\n`);
    console.log("| # | Chiave | VERDE | ROSSO |");
    console.log("|---|--------|-------|-------|");
    combinations.forEach((c, i) => {
      console.log(`| ${i + 1} | ${c.combinationKey} | ${c.verdeScore >= 0 ? '+' : ''}${c.verdeScore} | ${c.rossoScore >= 0 ? '+' : ''}${c.rossoScore} |`);
    });
  }
}

generateVerificationTable().then(() => process.exit(0)).catch(console.error);

