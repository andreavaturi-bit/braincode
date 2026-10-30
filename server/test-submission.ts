import { z } from "zod";

const PLUS_MINUS_OPTION_IDS: Record<number, readonly string[]> = {
  1: ["1", "2", "3"],
  2: ["4", "5", "6"],
  3: ["7", "8", "9"],
  4: ["10", "11", "12"],
  5: ["13", "14", "15"],
  6: ["16", "17", "18"],
  7: ["19", "20", "21"],
};

const AFFIRMATION_OPTION_IDS: Record<number, readonly string[]> = {
  8: ["22", "23", "24", "25", "26", "27"],
  9: ["28", "29", "30", "31", "32", "33"],
  10: ["34", "35", "36", "37", "38", "39"],
};

const responseValueSchema = z.enum(["+", "-", ""]);

function plusMinusAnswerSchema(exerciseNumber: number) {
  const allowedIds = new Set(PLUS_MINUS_OPTION_IDS[exerciseNumber]);

  return z.record(z.string(), responseValueSchema).superRefine((answerData, ctx) => {
    const entries = Object.entries(answerData);
    const invalidEntry = entries.find(([optionId]) => !allowedIds.has(optionId));
    if (invalidEntry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'esercizio ${exerciseNumber} contiene un'opzione non valida.`,
      });
      return;
    }

    const plusIds = entries.filter(([, value]) => value === "+").map(([optionId]) => optionId);
    const minusIds = entries.filter(([, value]) => value === "-").map(([optionId]) => optionId);

    if (plusIds.length !== 1 || minusIds.length !== 1 || plusIds[0] === minusIds[0]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Nell'esercizio ${exerciseNumber} devi selezionare esattamente un "+" e un "-" su due opzioni diverse.`,
      });
    }
  });
}

function affirmationAnswerSchema(exerciseNumber: number) {
  const allowedIds = new Set(AFFIRMATION_OPTION_IDS[exerciseNumber]);

  return z.array(z.string()).length(3, {
    message: `Nell'esercizio ${exerciseNumber} devi selezionare esattamente 3 affermazioni.`,
  }).superRefine((answerData, ctx) => {
    if (new Set(answerData).size !== answerData.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Nell'esercizio ${exerciseNumber} le 3 affermazioni devono essere diverse.`,
      });
    }

    const invalidId = answerData.find((optionId) => !allowedIds.has(optionId));
    if (invalidId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'esercizio ${exerciseNumber} contiene un'affermazione non valida.`,
      });
    }
  });
}

const answerSchemas = [
  ...Array.from({ length: 7 }, (_, index) => {
    const exerciseNumber = index + 1;
    return z.object({
      exerciseNumber: z.literal(exerciseNumber),
      answerData: plusMinusAnswerSchema(exerciseNumber),
    });
  }),
  ...Array.from({ length: 3 }, (_, index) => {
    const exerciseNumber = index + 8;
    return z.object({
      exerciseNumber: z.literal(exerciseNumber),
      answerData: affirmationAnswerSchema(exerciseNumber),
    });
  }),
] as const;

/**
 * Contratto lato server per un test BrainCode completo.
 * Accetta esclusivamente le risposte prodotte dal flusso dell'interfaccia
 * e impedisce che esercizi ripetuti, mancanti o estranei alterino il calcolo.
 */
export const testSubmissionSchema = z.object({
  answers: z.array(z.union(answerSchemas)).length(10, {
    message: "Il test deve contenere esattamente 10 esercizi.",
  }).superRefine((answers, ctx) => {
    const exerciseNumbers = answers.map((answer) => answer.exerciseNumber);
    const uniqueExerciseNumbers = new Set(exerciseNumbers);

    if (uniqueExerciseNumbers.size !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ogni esercizio da 1 a 10 deve essere presente una sola volta.",
      });
      return;
    }

    for (let exerciseNumber = 1; exerciseNumber <= 10; exerciseNumber++) {
      if (!uniqueExerciseNumbers.has(exerciseNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Devono essere presenti tutti gli esercizi da 1 a 10.",
        });
        return;
      }
    }
  }),
  groupSlug: z.string()
    .trim()
    .min(1, "Il codice gruppo non è valido.")
    .max(64, "Il codice gruppo non è valido.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Il codice gruppo non è valido.")
    .optional(),
});

export type TestSubmission = z.infer<typeof testSubmissionSchema>;
