/**
 * Script di test per verificare il calcolo dei punteggi
 * Simula un test completo e mostra i calcoli passo-passo
 */

import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// Esempio di risposte al test
const testAnswers = [
  // Esercizi 1-7: formato { plus: "X", minus: "Y" }
  { exerciseNumber: 1, answerData: { plus: "2", minus: "1" } }, // Es. 1
  { exerciseNumber: 2, answerData: { plus: "5", minus: "4" } }, // Es. 2
  { exerciseNumber: 3, answerData: { plus: "8", minus: "7" } }, // Es. 3
  { exerciseNumber: 4, answerData: { plus: "10", minus: "12" } }, // Es. 4
  { exerciseNumber: 5, answerData: { plus: "15", minus: "13" } }, // Es. 5
  { exerciseNumber: 6, answerData: { plus: "17", minus: "16" } }, // Es. 6
  { exerciseNumber: 7, answerData: { plus: "20", minus: "19" } }, // Es. 7
  
  // Esercizi 8-10: formato ["aff1", "aff2", ...]
  { exerciseNumber: 8, answerData: ["22", "23", "24"] }, // Es. 8
  { exerciseNumber: 9, answerData: ["28", "29", "32"] }, // Es. 9
  { exerciseNumber: 10, answerData: ["34", "35", "36"] }, // Es. 10
];

async function testScoring() {
  console.log("=".repeat(70));
  console.log("TEST CALCOLO PUNTEGGI BRAINCODE");
  console.log("=".repeat(70));
  console.log();
  
  // Posizioni iniziali sul disco circolare
  let verde = 12;
  let rosso = 24;
  
  console.log("📍 POSIZIONI INIZIALI:");
  console.log(`   VERDE: ${verde}`);
  console.log(`   ROSSO: ${rosso}`);
  console.log(`   BLU:   ${36 - verde - rosso}`);
  console.log();
  console.log("-".repeat(70));
  console.log();
  
  // Processa ogni esercizio
  for (const answer of testAnswers) {
    console.log(`ESERCIZIO ${answer.exerciseNumber}:`);
    
    if (answer.exerciseNumber <= 7) {
      // Formato plus/minus
      const combinationKey = `${answer.answerData.plus}+${answer.answerData.minus}-`;
      console.log(`   Risposta: opzione ${answer.answerData.plus} (+), opzione ${answer.answerData.minus} (-)`);
      console.log(`   Chiave: ${combinationKey}`);
      
      const scoring = await db
        .select()
        .from(scoringTables)
        .where(eq(scoringTables.exerciseNumber, answer.exerciseNumber))
        .then(results => results.find(s => s.combinationKey === combinationKey));
      
      if (scoring) {
        console.log(`   Punteggio trovato: VERDE ${scoring.verdeScore >= 0 ? '+' : ''}${scoring.verdeScore}, ROSSO ${scoring.rossoScore >= 0 ? '+' : ''}${scoring.rossoScore}`);
        verde += scoring.verdeScore;
        rosso += scoring.rossoScore;
        console.log(`   Nuove posizioni: VERDE=${verde}, ROSSO=${rosso}, BLU=${36 - verde - rosso}`);
      } else {
        console.log(`   ⚠️  Combinazione non trovata in tabella!`);
      }
    } else {
      // Formato affermazioni
      const selectedKey = answer.answerData.map((s: string) => parseInt(s)).sort((a: number, b: number) => a - b).join(',');
      console.log(`   Affermazioni selezionate: ${answer.answerData.join(', ')}`);
      console.log(`   Chiave: ${selectedKey}`);
      
      const scoring = await db
        .select()
        .from(scoringTables)
        .where(eq(scoringTables.exerciseNumber, answer.exerciseNumber))
        .then(results => results.find(s => s.combinationKey === selectedKey));
      
      if (scoring) {
        console.log(`   Punteggio trovato: VERDE ${scoring.verdeScore >= 0 ? '+' : ''}${scoring.verdeScore}, ROSSO ${scoring.rossoScore >= 0 ? '+' : ''}${scoring.rossoScore}`);
        verde += scoring.verdeScore;
        rosso += scoring.rossoScore;
        console.log(`   Nuove posizioni: VERDE=${verde}, ROSSO=${rosso}, BLU=${36 - verde - rosso}`);
      } else {
        console.log(`   ⚠️  Combinazione non trovata in tabella! Usando default (0,0)`);
      }
    }
    
    console.log();
  }
  
  console.log("-".repeat(70));
  console.log();
  
  const blu = 36 - verde - rosso;
  
  console.log("📊 PUNTEGGI FINALI:");
  console.log(`   VERDE: ${verde}/36 (${((verde/36)*100).toFixed(1)}%)`);
  console.log(`   ROSSO: ${rosso}/36 (${((rosso/36)*100).toFixed(1)}%)`);
  console.log(`   BLU:   ${blu}/36 (${((blu/36)*100).toFixed(1)}%)`);
  console.log(`   TOTALE: ${verde + rosso + blu} (deve essere 36)`);
  console.log();
  
  // Determina profilo
  const max = Math.max(verde, rosso, blu);
  let profileType = "";
  
  if (max === verde) {
    profileType = "Dominante VERDE";
    if (rosso > blu && rosso > 9) profileType += " con seconda componente ROSSO";
    else if (blu > rosso && blu > 9) profileType += " con seconda componente BLU";
  } else if (max === rosso) {
    profileType = "Dominante ROSSO";
    if (verde > blu && verde > 9) profileType += " con seconda componente VERDE";
    else if (blu > verde && blu > 9) profileType += " con seconda componente BLU";
  } else {
    profileType = "Dominante BLU";
    if (verde > rosso && verde > 9) profileType += " con seconda componente VERDE";
    else if (rosso > verde && rosso > 9) profileType += " con seconda componente ROSSO";
  }
  
  console.log("🎯 PROFILO:");
  console.log(`   ${profileType}`);
  console.log();
  console.log("=".repeat(70));
}

testScoring()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore:", error);
    process.exit(1);
  });

