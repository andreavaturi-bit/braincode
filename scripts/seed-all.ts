/**
 * Script di seed CONSOLIDATO per BrainCode.
 *
 * Unica fonte di verità per le tabelle di scoring di tutti i 10 esercizi.
 * Cancella e ripopola completamente la tabella `scoringTables`.
 *
 * Eseguito automaticamente dal comando `pnpm seed`.
 *
 * Dati estratti letteralmente dalle tabelle del libro Structogram (IBSA),
 * dalla foto di ciascuna tabella (immagini 4, 8, 12, 16, 20, 24, 28, 32, 36, 40).
 *
 * Convenzioni:
 * - Esercizi 1-7: chiave nel formato "X+Y-" dove X è l'opzione segnata con +
 *   e Y l'opzione segnata con -. 6 combinazioni per esercizio.
 * - Esercizi 8-10: chiave nel formato "A,B,C" con le tre affermazioni scelte
 *   ordinate numericamente. 12 combinazioni esplicite + 1 default "0,0".
 *
 * Logica del calcolo (vedi `server/routers.ts`, funzione calculateScores):
 * - Posizioni iniziali: indice verde su 12, indice rosso su 24 (scala 0-36).
 * - Per ogni esercizio si aggiunge il differenziale verde/rosso letto dalla
 *   tabella; se la combinazione non è in tabella si aggiunge 0,0.
 * - Output finale: verde = 12 + diff_verde; rossoPos = 24 + diff_rosso;
 *   rosso = rossoPos - verde; blu = 36 - rossoPos.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { inArray } from "drizzle-orm";
import { scoringTables } from "../drizzle/schema";
import { nanoid } from "nanoid";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL non impostata");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

// =============================================================================
// ESERCIZI 1-7
// =============================================================================
// Mappatura opzione → colore per ciascun esercizio (per riferimento):
// Es 1: 1=blu, 2=verde, 3=rosso
// Es 2: 4=rosso, 5=verde, 6=blu
// Es 3: 7=verde, 8=rosso, 9=blu
// Es 4: 10=verde, 11=rosso, 12=blu
// Es 5: 13=verde, 14=rosso, 15=blu
// Es 6: 16=blu, 17=verde, 18=rosso
// Es 7: 19=rosso, 20=verde, 21=blu

const exercise1 = [
  { key: "1+2-", verde: -1, rosso: -1 }, // +blu, -verde
  { key: "1+3-", verde: 0, rosso: -1 },  // +blu, -rosso
  { key: "2+3-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "2+1-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "3+1-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "3+2-", verde: -1, rosso: 0 },  // +rosso, -verde
];

const exercise2 = [
  { key: "4+5-", verde: -1, rosso: 0 },  // +rosso, -verde
  { key: "4+6-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "5+6-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "5+4-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "6+4-", verde: 0, rosso: -1 },  // +blu, -rosso
  { key: "6+5-", verde: -1, rosso: -1 }, // +blu, -verde
];

const exercise3 = [
  { key: "7+8-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "7+9-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "8+9-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "8+7-", verde: -1, rosso: 0 },  // +rosso, -verde
  { key: "9+7-", verde: -1, rosso: -1 }, // +blu, -verde
  { key: "9+8-", verde: 0, rosso: -1 },  // +blu, -rosso
];

const exercise4 = [
  { key: "10+11-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "10+12-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "11+12-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "11+10-", verde: -1, rosso: 0 },  // +rosso, -verde
  { key: "12+10-", verde: -1, rosso: -1 }, // +blu, -verde
  { key: "12+11-", verde: 0, rosso: -1 },  // +blu, -rosso
];

const exercise5 = [
  { key: "13+14-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "13+15-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "14+15-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "14+13-", verde: -1, rosso: 0 },  // +rosso, -verde
  { key: "15+13-", verde: -1, rosso: -1 }, // +blu, -verde
  { key: "15+14-", verde: 0, rosso: -1 },  // +blu, -rosso
];

const exercise6 = [
  { key: "16+17-", verde: -1, rosso: -1 }, // +blu, -verde
  { key: "16+18-", verde: 0, rosso: -1 },  // +blu, -rosso
  { key: "17+18-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "17+16-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "18+16-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "18+17-", verde: -1, rosso: 0 },  // +rosso, -verde
];

const exercise7 = [
  { key: "19+20-", verde: -1, rosso: 0 },  // +rosso, -verde
  { key: "19+21-", verde: 0, rosso: 1 },   // +rosso, -blu
  { key: "20+21-", verde: 1, rosso: 1 },   // +verde, -blu
  { key: "20+19-", verde: 1, rosso: 0 },   // +verde, -rosso
  { key: "21+19-", verde: 0, rosso: -1 },  // +blu, -rosso
  { key: "21+20-", verde: -1, rosso: -1 }, // +blu, -verde
];

// =============================================================================
// ESERCIZI 8-10
// =============================================================================
// 12 combinazioni esplicite + 1 default "0,0" per "tutte le altre possibilità"
// (cioè le combinazioni non presenti in tabella → indici non si muovono).

const exercise8 = [
  { key: "22,23,25", verde: -1, rosso: 1 },
  { key: "22,23,26", verde: -1, rosso: -2 },
  { key: "22,24,25", verde: -1, rosso: 1 },
  { key: "22,24,27", verde: 2, rosso: 1 },
  { key: "22,25,26", verde: -1, rosso: 1 },
  { key: "22,25,27", verde: -1, rosso: 1 },
  { key: "23,24,26", verde: -1, rosso: -2 },
  { key: "23,24,27", verde: 2, rosso: 1 },
  { key: "23,25,26", verde: -1, rosso: -2 },
  { key: "23,26,27", verde: -1, rosso: -2 },
  { key: "24,25,27", verde: 2, rosso: 1 },
  { key: "24,26,27", verde: 2, rosso: 1 },
  { key: "0,0", verde: 0, rosso: 0 },
];

const exercise9 = [
  { key: "28,29,32", verde: 2, rosso: 1 },
  { key: "28,29,33", verde: -1, rosso: 1 },
  { key: "28,30,31", verde: -1, rosso: -2 },
  { key: "28,30,32", verde: 2, rosso: 1 },
  { key: "28,31,32", verde: 2, rosso: 1 },
  { key: "28,32,33", verde: 2, rosso: 1 },
  { key: "29,30,31", verde: -1, rosso: -2 },
  { key: "29,30,33", verde: -1, rosso: 1 },
  { key: "29,31,33", verde: -1, rosso: 1 },
  { key: "29,32,33", verde: -1, rosso: 1 },
  { key: "30,31,32", verde: -1, rosso: -2 },
  { key: "30,31,33", verde: -1, rosso: -2 },
  { key: "0,0", verde: 0, rosso: 0 },
];

const exercise10 = [
  { key: "34,35,36", verde: -1, rosso: 1 },
  { key: "34,35,38", verde: -1, rosso: -2 },
  { key: "34,36,38", verde: -1, rosso: -2 },
  { key: "34,37,38", verde: -1, rosso: -2 },
  { key: "34,37,39", verde: 2, rosso: 1 },
  { key: "34,38,39", verde: -1, rosso: -2 },
  { key: "35,36,37", verde: -1, rosso: 1 },
  { key: "35,36,38", verde: -1, rosso: 1 },
  { key: "35,36,39", verde: -1, rosso: 1 },
  { key: "35,37,39", verde: 2, rosso: 1 },
  { key: "36,37,39", verde: 2, rosso: 1 },
  { key: "37,38,39", verde: 2, rosso: 1 },
  { key: "0,0", verde: 0, rosso: 0 },
];

// =============================================================================
// VALIDAZIONE
// =============================================================================

function validateExercise17Key(key: string, exerciseNum: number): boolean {
  // Formato richiesto: "X+Y-" dove X e Y sono numeri di opzione
  if (!/^\d+\+\d+-$/.test(key)) {
    console.error(`❌ Esercizio ${exerciseNum}: chiave malformata "${key}"`);
    return false;
  }
  return true;
}

function validateExercise810Key(key: string, exerciseNum: number): boolean {
  // Formato richiesto: "A,B,C" con 3 numeri ordinati, OPPURE "0,0" per default
  if (key === "0,0") return true;
  const parts = key.split(",");
  if (parts.length !== 3) {
    console.error(`❌ Esercizio ${exerciseNum}: chiave "${key}" non ha 3 affermazioni`);
    return false;
  }
  const nums = parts.map((p) => parseInt(p));
  if (nums.some(isNaN)) {
    console.error(`❌ Esercizio ${exerciseNum}: chiave "${key}" contiene non-numeri`);
    return false;
  }
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] >= nums[i + 1]) {
      console.error(`❌ Esercizio ${exerciseNum}: chiave "${key}" non è ordinata`);
      return false;
    }
  }
  return true;
}

// =============================================================================
// SEEDING
// =============================================================================

async function seedAll() {
  console.log("🌱 Seed BrainCode: pulizia tabella scoringTables...\n");

  await db
    .delete(scoringTables)
    .where(inArray(scoringTables.exerciseNumber, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));

  const exercises17 = [
    { num: 1, data: exercise1 },
    { num: 2, data: exercise2 },
    { num: 3, data: exercise3 },
    { num: 4, data: exercise4 },
    { num: 5, data: exercise5 },
    { num: 6, data: exercise6 },
    { num: 7, data: exercise7 },
  ];

  const exercises810 = [
    { num: 8, data: exercise8 },
    { num: 9, data: exercise9 },
    { num: 10, data: exercise10 },
  ];

  let totalInserted = 0;
  let hasErrors = false;

  for (const ex of exercises17) {
    for (const combo of ex.data) {
      if (!validateExercise17Key(combo.key, ex.num)) {
        hasErrors = true;
        continue;
      }
    }
    if (ex.data.length !== 6) {
      console.error(`❌ Esercizio ${ex.num}: previste 6 combinazioni, trovate ${ex.data.length}`);
      hasErrors = true;
    }
  }

  for (const ex of exercises810) {
    for (const combo of ex.data) {
      if (!validateExercise810Key(combo.key, ex.num)) {
        hasErrors = true;
        continue;
      }
    }
    if (ex.data.length !== 13) {
      console.error(`❌ Esercizio ${ex.num}: previste 13 combinazioni (12 + default), trovate ${ex.data.length}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\n❌ Validazione fallita: nessun dato inserito.");
    process.exit(1);
  }

  for (const ex of [...exercises17, ...exercises810]) {
    for (const combo of ex.data) {
      await db.insert(scoringTables).values({
        id: nanoid(),
        exerciseNumber: ex.num,
        combinationKey: combo.key,
        verdeScore: combo.verde,
        rossoScore: combo.rosso,
      });
      totalInserted++;
    }
    console.log(`✅ Esercizio ${ex.num}: ${ex.data.length} combinazioni inserite`);
  }

  console.log(`\n🎉 Seed completato: ${totalInserted} righe totali inserite.`);
}

seedAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore durante il seed:", error);
    process.exit(1);
  });
