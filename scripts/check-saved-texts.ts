import { getDb } from "../server/db";

async function checkSavedTexts() {
  const db = await getDb();
  if (!db) {
    console.log("Database non disponibile");
    return;
  }
  
  // Prendi l'ultimo test completato
  const tests = await db.query.testResults.findMany({
    orderBy: (testResults, { desc }) => [desc(testResults.completedAt)],
    limit: 1,
  });

  if (tests.length === 0) {
    console.log("Nessun test trovato");
    return;
  }

  const test = tests[0];
  console.log("\n=== TESTI SALVATI NEL DATABASE ===\n");
  console.log("Test ID:", test.id);
  console.log("User:", test.userName);
  console.log("\nRisposte:");
  
  const answers = JSON.parse(test.answers);
  
  for (let i = 1; i <= 10; i++) {
    const answer = answers[i];
    if (answer) {
      console.log(`\n--- ESERCIZIO ${i} ---`);
      console.log("Context:", answer.context);
      console.log("Options:", JSON.stringify(answer.options, null, 2));
      console.log("Selected:", JSON.stringify(answer.selected, null, 2));
    }
  }
}

checkSavedTexts().then(() => process.exit(0)).catch(console.error);

