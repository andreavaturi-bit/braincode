import { drizzle } from "drizzle-orm/mysql2";
import { testResults, testAnswers } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function checkLastTest() {
  const lastTest = await db
    .select()
    .from(testResults)
    .orderBy(desc(testResults.completedAt))
    .limit(1);
  
  if (lastTest.length === 0) {
    console.log("Nessun test trovato");
    return;
  }
  
  console.log("=== ULTIMO TEST ===\n");
  console.log(`ID: ${lastTest[0].id}`);
  console.log(`Completato: ${lastTest[0].completedAt}`);
  console.log(`VERDE: ${lastTest[0].verdeScore}`);
  console.log(`ROSSO: ${lastTest[0].rossoScore}`);
  console.log(`BLU: ${lastTest[0].bluScore}`);
  console.log();
  
  const answers = await db
    .select()
    .from(testAnswers)
    .where(eq(testAnswers.testResultId, lastTest[0].id))
    .orderBy(testAnswers.exerciseNumber);
  
  console.log("=== RISPOSTE SALVATE ===\n");
  for (const answer of answers) {
    console.log(`Esercizio ${answer.exerciseNumber}:`);
    console.log(`  ${JSON.stringify(answer.answerData)}`);
  }
}

checkLastTest().then(() => process.exit(0)).catch(console.error);

