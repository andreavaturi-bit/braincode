import { drizzle } from "drizzle-orm/mysql2";
import { affirmationScoring } from "../drizzle/schema";
import { nanoid } from "nanoid";

// Affermazioni estratte dalle immagini del libro

// Esercizio 8: Affermazioni 22-27
const exercise8Affirmations = [
  {
    id: 22,
    text: 'Ho pochi "peli sulla lingua", non sempre sono diplomatico.',
  },
  {
    id: 23,
    text: "Non riesco a comunicare bene i miei sentimenti e spesso vengo giudicato in maniera errata.",
  },
  {
    id: 24,
    text: "Mi interesso molto alle persone e alle loro condizioni di vita.",
  },
  {
    id: 25,
    text: 'Amo il rischio e l\'avventura. Il mio motto è: "Chi non risica non rosica".',
  },
  {
    id: 26,
    text: "Sono molto sensibile ai rumori, io stesso il più delle volte mi muovo silenziosamente.",
  },
  {
    id: 27,
    text: "Sono fondamentalmente un buongustaio, amo la buona cucina.",
  },
];

// Esercizio 9: Affermazioni 28-33
const exercise9Affirmations = [
  {
    id: 28,
    text: "Tendo a rimandare le decisioni, preferisco aspettare e vedere come si sviluppano le cose.",
  },
  {
    id: 29,
    text: "Sono una persona spontanea e diretta, dico quello che penso.",
  },
  {
    id: 30,
    text: "Mi piace pianificare tutto nei minimi dettagli prima di agire.",
  },
  {
    id: 31,
    text: "Preferisco lavorare da solo piuttosto che in gruppo.",
  },
  {
    id: 32,
    text: "Sono molto attento ai sentimenti degli altri e cerco di non ferirli.",
  },
  {
    id: 33,
    text: "Mi annoio facilmente se le cose procedono troppo lentamente.",
  },
];

// Esercizio 10: Affermazioni 34-39
const exercise10Affirmations = [
  {
    id: 34,
    text: "Tendo ad essere critico verso me stesso e verso gli altri.",
  },
  {
    id: 35,
    text: "Preferisco ascoltare piuttosto che parlare.",
  },
  {
    id: 36,
    text: "Mi piace essere al centro dell'attenzione.",
  },
  {
    id: 37,
    text: "Sono una persona metodica e precisa nel mio lavoro.",
  },
  {
    id: 38,
    text: "Mi adatto facilmente ai cambiamenti e alle nuove situazioni.",
  },
  {
    id: 39,
    text: "Tendo a preoccuparmi molto per il futuro.",
  },
];

// Tabella di scoring per l'esercizio 8 (dalla immagine)
// Ogni riga rappresenta una possibile combinazione di 3 affermazioni selezionate
const exercise8Scoring = [
  // Riga 1: 22, 23, 24, 25, 26, 27
  { combination: "22,23,24", verde: -1, rosso: 1 },
  { combination: "22,23,25", verde: -1, rosso: -2 },
  { combination: "22,23,26", verde: -1, rosso: 1 },
  { combination: "22,23,27", verde: 2, rosso: 1 },
  { combination: "22,24,25", verde: -1, rosso: 1 },
  { combination: "22,24,26", verde: -1, rosso: 1 },
  { combination: "22,24,27", verde: -1, rosso: -2 },
  { combination: "22,25,26", verde: 2, rosso: 1 },
  { combination: "22,25,27", verde: -1, rosso: -2 },
  { combination: "22,26,27", verde: -1, rosso: -2 },
  { combination: "23,24,25", verde: 2, rosso: 1 },
  { combination: "23,24,26", verde: 2, rosso: 1 },
  { combination: "23,24,27", verde: 0, rosso: 0 },
  // Riga 2
  { combination: "22,23,24", verde: -1, rosso: 1 },
  { combination: "22,24,25", verde: -1, rosso: 1 },
  { combination: "23,24,25", verde: 2, rosso: 1 },
  { combination: "23,24,26", verde: 2, rosso: 1 },
  { combination: "24,25,26", verde: -1, rosso: -2 },
  { combination: "24,25,27", verde: -1, rosso: -2 },
  // Riga 3
  { combination: "22,25,26", verde: 2, rosso: 1 },
  { combination: "23,25,26", verde: 2, rosso: 1 },
  { combination: "24,26,27", verde: 2, rosso: 1 },
  { combination: "25,26,27", verde: 2, rosso: 1 },
  // Riga 4
  { combination: "22,24,27", verde: -1, rosso: -2 },
  { combination: "23,26,27", verde: 2, rosso: 1 },
  { combination: "24,25,27", verde: -1, rosso: -2 },
  { combination: "25,26,27", verde: 2, rosso: 1 },
  // Riga 5
  { combination: "22,26,27", verde: -1, rosso: -2 },
  { combination: "23,25,27", verde: 2, rosso: 1 },
  { combination: "24,26,27", verde: 2, rosso: 1 },
  { combination: "25,26,27", verde: 2, rosso: 1 },
  // Riga 6
  { combination: "22,25,27", verde: -1, rosso: -2 },
  { combination: "23,26,27", verde: 2, rosso: 1 },
  { combination: "24,25,26", verde: -1, rosso: -2 },
  { combination: "25,26,27", verde: 2, rosso: 1 },
  { combination: "23,25,26", verde: 2, rosso: 1 },
  { combination: "24,26,27", verde: 2, rosso: 1 },
];

// Per gli esercizi 9 e 10, la logica è simile
// TODO: Estrarre le tabelle complete dalle immagini

async function seedAffirmations() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding affirmation scoring tables...");

  // Seed exercise 8 scoring
  for (const data of exercise8Scoring) {
    await db.insert(affirmationScoring).values({
      id: nanoid(),
      exerciseNumber: 8,
      selectedAffirmations: data.combination,
      verdeScore: data.verde,
      rossoScore: data.rosso,
    });
  }

  console.log(`✓ Inserted ${exercise8Scoring.length} affirmation scoring entries for exercise 8`);
  
  // TODO: Add exercises 9 and 10 when tables are extracted
  
  process.exit(0);
}

seedAffirmations().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});

