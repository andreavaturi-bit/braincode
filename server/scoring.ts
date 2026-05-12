/**
 * Logica di calcolo del profilo BrainCode, isolata in un modulo puro per
 * essere testata senza dipendenze dal database.
 *
 * Le funzioni qui sono usate sia da server/routers.ts (in produzione) sia
 * da scripts/recalc-results.ts (per ricalcolare i test storici).
 */

export type ScoringRow = {
  combinationKey: string;
  verdeScore: number;
  rossoScore: number;
};

export type Answer = {
  exerciseNumber: number;
  answerData: any;
};

export function formatCombinationKey(answerData: any): string {
  if (!answerData || typeof answerData !== "object") return "";
  let plus = "";
  let minus = "";
  if (typeof answerData.plus === "string" || typeof answerData.minus === "string") {
    plus = String(answerData.plus ?? "");
    minus = String(answerData.minus ?? "");
  } else {
    for (const [key, value] of Object.entries(answerData)) {
      if (value === "+") plus = key;
      else if (value === "-") minus = key;
    }
  }
  if (!plus || !minus) return "";
  return `${plus}+${minus}-`;
}

export function formatAffirmationKey(answerData: any): string {
  if (!Array.isArray(answerData) || answerData.length !== 3) return "";
  const nums = answerData
    .map((s) => parseInt(String(s), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  if (nums.length !== 3) return "";
  return nums.join(",");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calcola le ampiezze finali dei settori VERDE/ROSSO/BLU sulla scala 0-36.
 *
 * @param answers - risposte del test
 * @param tables - mappa esercizio → righe della tabella di scoring per quell'esercizio
 */
export function computeScores(
  answers: Answer[],
  tables: Map<number, ScoringRow[]>
): { verde: number; rosso: number; blu: number } {
  let verdeDiff = 0;
  let rossoDiff = 0;

  for (const a of answers) {
    const table = tables.get(a.exerciseNumber) ?? [];
    let key = "";
    if (a.exerciseNumber >= 1 && a.exerciseNumber <= 7) key = formatCombinationKey(a.answerData);
    else if (a.exerciseNumber >= 8 && a.exerciseNumber <= 10) key = formatAffirmationKey(a.answerData);
    const match = table.find((r) => r.combinationKey === key);
    if (match) {
      verdeDiff += match.verdeScore;
      rossoDiff += match.rossoScore;
    }
  }

  const verdeIndex = clamp(12 + verdeDiff, 0, 36);
  const rossoIndex = clamp(24 + rossoDiff, verdeIndex, 36);
  return {
    verde: verdeIndex,
    rosso: rossoIndex - verdeIndex,
    blu: 36 - rossoIndex,
  };
}

export function determineProfile(verde: number, rosso: number, blu: number): string {
  const total = verde + rosso + blu;
  if (total === 0) return "Profilo indeterminato";
  const verdePercent = (verde / total) * 100;
  const rossoPercent = (rosso / total) * 100;
  const bluPercent = (blu / total) * 100;
  const max = Math.max(verdePercent, rossoPercent, bluPercent);

  if (max === verdePercent) {
    if (rossoPercent > bluPercent && rossoPercent > 25)
      return "Dominante VERDE con seconda componente ROSSO";
    if (bluPercent > rossoPercent && bluPercent > 25)
      return "Dominante VERDE con seconda componente BLU";
    return "Dominante VERDE";
  }
  if (max === rossoPercent) {
    if (verdePercent > bluPercent && verdePercent > 25)
      return "Dominante ROSSO con seconda componente VERDE";
    if (bluPercent > verdePercent && bluPercent > 25)
      return "Dominante ROSSO con seconda componente BLU";
    return "Dominante ROSSO";
  }
  if (verdePercent > rossoPercent && verdePercent > 25)
    return "Dominante BLU con seconda componente VERDE";
  if (rossoPercent > verdePercent && rossoPercent > 25)
    return "Dominante BLU con seconda componente ROSSO";
  return "Dominante BLU";
}
