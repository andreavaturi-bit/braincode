import { describe, it, expect } from "vitest";
import {
  computeScores,
  formatCombinationKey,
  formatAffirmationKey,
  type ScoringRow,
} from "./scoring";

// Tabelle di riferimento estratte dal libro Structogram (IBSA).
// Sono le STESSE che vengono inserite in DB da scripts/seed-all.ts.
const tables: Map<number, ScoringRow[]> = new Map([
  [1, [
    { combinationKey: "1+2-", verdeScore: -1, rossoScore: -1 },
    { combinationKey: "1+3-", verdeScore: 0, rossoScore: -1 },
    { combinationKey: "2+3-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "2+1-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "3+1-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "3+2-", verdeScore: -1, rossoScore: 0 },
  ]],
  [2, [
    { combinationKey: "4+5-", verdeScore: -1, rossoScore: 0 },
    { combinationKey: "4+6-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "5+6-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "5+4-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "6+4-", verdeScore: 0, rossoScore: -1 },
    { combinationKey: "6+5-", verdeScore: -1, rossoScore: -1 },
  ]],
  [3, [
    { combinationKey: "7+8-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "7+9-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "8+9-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "8+7-", verdeScore: -1, rossoScore: 0 },
    { combinationKey: "9+7-", verdeScore: -1, rossoScore: -1 },
    { combinationKey: "9+8-", verdeScore: 0, rossoScore: -1 },
  ]],
  [4, [
    { combinationKey: "10+11-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "10+12-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "11+12-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "11+10-", verdeScore: -1, rossoScore: 0 },
    { combinationKey: "12+10-", verdeScore: -1, rossoScore: -1 },
    { combinationKey: "12+11-", verdeScore: 0, rossoScore: -1 },
  ]],
  [5, [
    { combinationKey: "13+14-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "13+15-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "14+15-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "14+13-", verdeScore: -1, rossoScore: 0 },
    { combinationKey: "15+13-", verdeScore: -1, rossoScore: -1 },
    { combinationKey: "15+14-", verdeScore: 0, rossoScore: -1 },
  ]],
  [6, [
    { combinationKey: "16+17-", verdeScore: -1, rossoScore: -1 },
    { combinationKey: "16+18-", verdeScore: 0, rossoScore: -1 },
    { combinationKey: "17+18-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "17+16-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "18+16-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "18+17-", verdeScore: -1, rossoScore: 0 },
  ]],
  [7, [
    { combinationKey: "19+20-", verdeScore: -1, rossoScore: 0 },
    { combinationKey: "19+21-", verdeScore: 0, rossoScore: 1 },
    { combinationKey: "20+21-", verdeScore: 1, rossoScore: 1 },
    { combinationKey: "20+19-", verdeScore: 1, rossoScore: 0 },
    { combinationKey: "21+19-", verdeScore: 0, rossoScore: -1 },
    { combinationKey: "21+20-", verdeScore: -1, rossoScore: -1 },
  ]],
  [8, [
    { combinationKey: "24,25,27", verdeScore: 2, rossoScore: 1 },
    { combinationKey: "0,0", verdeScore: 0, rossoScore: 0 },
  ]],
  [9, [
    { combinationKey: "28,30,33", verdeScore: 0, rossoScore: 0 },
    { combinationKey: "0,0", verdeScore: 0, rossoScore: 0 },
  ]],
  [10, [
    { combinationKey: "36,37,39", verdeScore: 2, rossoScore: 1 },
    { combinationKey: "0,0", verdeScore: 0, rossoScore: 0 },
  ]],
]);

describe("formatCombinationKey", () => {
  it("estrae plus e minus dal formato { 1: '-', 2: '+' }", () => {
    expect(formatCombinationKey({ "1": "-", "2": "+" })).toBe("2+1-");
  });
  it("supporta anche il formato { plus, minus }", () => {
    expect(formatCombinationKey({ plus: "2", minus: "1" })).toBe("2+1-");
  });
  it("torna stringa vuota se manca + o -", () => {
    expect(formatCombinationKey({ "1": "+" })).toBe("");
    expect(formatCombinationKey({})).toBe("");
    expect(formatCombinationKey(null)).toBe("");
  });
});

describe("formatAffirmationKey", () => {
  it("ordina numericamente le 3 affermazioni", () => {
    expect(formatAffirmationKey(["27", "22", "24"])).toBe("22,24,27");
  });
  it("torna stringa vuota se non sono esattamente 3 numeri", () => {
    expect(formatAffirmationKey(["22", "24"])).toBe("");
    expect(formatAffirmationKey(["22", "24", "27", "29"])).toBe("");
    expect(formatAffirmationKey(["a", "b", "c"])).toBe("");
  });
});

describe("computeScores", () => {
  it("nessuna risposta → posizioni iniziali 12/12/12", () => {
    expect(computeScores([], tables)).toEqual({ verde: 12, rosso: 12, blu: 12 });
  });

  it("risposte di Andrea producono V=22, R=11, B=3 (dal libro/verifica)", () => {
    const answers = [
      { exerciseNumber: 1, answerData: { "1": "-", "2": "+" } },
      { exerciseNumber: 2, answerData: { "5": "+", "6": "-" } },
      { exerciseNumber: 3, answerData: { "7": "+", "9": "-" } },
      { exerciseNumber: 4, answerData: { "10": "+", "12": "-" } },
      { exerciseNumber: 5, answerData: { "13": "+", "15": "-" } },
      { exerciseNumber: 6, answerData: { "16": "-", "18": "+" } },
      { exerciseNumber: 7, answerData: { "20": "+", "21": "-" } },
      { exerciseNumber: 8, answerData: ["24", "25", "27"] },
      { exerciseNumber: 9, answerData: ["28", "30", "33"] },
      { exerciseNumber: 10, answerData: ["36", "37", "39"] },
    ];
    expect(computeScores(answers, tables)).toEqual({ verde: 22, rosso: 11, blu: 3 });
  });

  // REGRESSION TEST per il bug sistemato sull'esercizio 2.
  it("Esercizio 2: '6+4-' (+blu,-rosso) → V=0, R=-1 (era V=-1, R=-1)", () => {
    const answers = [{ exerciseNumber: 2, answerData: { "4": "-", "6": "+" } }];
    // Solo ex 2 con +blu/-rosso: verde stay, rosso -1
    // Risultato atteso: verde index 12, rosso index 23 → settori 12, 11, 13
    expect(computeScores(answers, tables)).toEqual({ verde: 12, rosso: 11, blu: 13 });
  });

  it("Esercizio 2: '6+5-' (+blu,-verde) → V=-1, R=-1", () => {
    const answers = [{ exerciseNumber: 2, answerData: { "5": "-", "6": "+" } }];
    // verde -1 → verde index 11; rosso -1 → rosso index 23; settori 11, 12, 13
    expect(computeScores(answers, tables)).toEqual({ verde: 11, rosso: 12, blu: 13 });
  });

  it("combinazione non in tabella per ex 8-10 → 0,0 (default 'tutte le altre')", () => {
    const answers = [{ exerciseNumber: 9, answerData: ["28", "29", "31"] }];
    // 28,29,31 non è in tabella di test → nessuno spostamento
    expect(computeScores(answers, tables)).toEqual({ verde: 12, rosso: 12, blu: 12 });
  });

  it("input malformato non rompe il calcolo", () => {
    const answers = [
      { exerciseNumber: 1, answerData: { "1": "+" } }, // manca il -
      { exerciseNumber: 8, answerData: ["22"] }, // troppo poche
    ];
    expect(computeScores(answers, tables)).toEqual({ verde: 12, rosso: 12, blu: 12 });
  });

  it("clampa quando i differenziali sono estremi (no settori negativi)", () => {
    const t = new Map<number, ScoringRow[]>([
      [1, [{ combinationKey: "2+1-", verdeScore: 100, rossoScore: 100 }]],
    ]);
    const answers = [{ exerciseNumber: 1, answerData: { "1": "-", "2": "+" } }];
    const result = computeScores(answers, t);
    expect(result.verde).toBeGreaterThanOrEqual(0);
    expect(result.rosso).toBeGreaterThanOrEqual(0);
    expect(result.blu).toBeGreaterThanOrEqual(0);
    expect(result.verde + result.rosso + result.blu).toBe(36);
  });
});
