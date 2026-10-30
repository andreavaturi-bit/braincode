import { describe, expect, it } from "vitest";
import { testSubmissionSchema } from "./test-submission";

function validSubmission() {
  const plusMinusAnswers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["10", "11", "12"],
    ["13", "14", "15"],
    ["16", "17", "18"],
    ["19", "20", "21"],
  ].map((ids, index) => ({
    exerciseNumber: index + 1,
    answerData: { [ids[0]]: "+", [ids[1]]: "-", [ids[2]]: "" },
  }));

  return {
    answers: [
      ...plusMinusAnswers,
      { exerciseNumber: 8, answerData: ["22", "24", "27"] },
      { exerciseNumber: 9, answerData: ["28", "30", "33"] },
      { exerciseNumber: 10, answerData: ["36", "37", "39"] },
    ],
  };
}

describe("testSubmissionSchema", () => {
  it("accetta un test completo con 10 esercizi validi", () => {
    expect(testSubmissionSchema.safeParse(validSubmission()).success).toBe(true);
  });

  it("accetta uno slug gruppo sicuro e rifiuta codici manipolati", () => {
    expect(testSubmissionSchema.safeParse({ ...validSubmission(), groupSlug: "cordua-2026" }).success).toBe(true);
    expect(testSubmissionSchema.safeParse({ ...validSubmission(), groupSlug: "Cordua" }).success).toBe(false);
    expect(testSubmissionSchema.safeParse({ ...validSubmission(), groupSlug: "cordua/altro" }).success).toBe(false);
  });

  it("rifiuta esercizi mancanti o ripetuti", () => {
    const missingExercise = validSubmission();
    missingExercise.answers.pop();
    expect(testSubmissionSchema.safeParse(missingExercise).success).toBe(false);

    const duplicateExercise = validSubmission();
    duplicateExercise.answers[9] = {
      exerciseNumber: 9,
      answerData: ["28", "30", "33"],
    };
    expect(testSubmissionSchema.safeParse(duplicateExercise).success).toBe(false);
  });

  it("rifiuta più segni uguali, segni sulla stessa opzione e ID estranei negli esercizi 1-7", () => {
    const twoPluses = validSubmission();
    twoPluses.answers[0] = {
      exerciseNumber: 1,
      answerData: { "1": "+", "2": "+", "3": "-" },
    };
    expect(testSubmissionSchema.safeParse(twoPluses).success).toBe(false);

    const invalidOption = validSubmission();
    invalidOption.answers[1] = {
      exerciseNumber: 2,
      answerData: { "1": "+", "4": "-" },
    };
    expect(testSubmissionSchema.safeParse(invalidOption).success).toBe(false);
  });

  it("rifiuta affermazioni duplicate o appartenenti a un altro esercizio", () => {
    const duplicateAffirmation = validSubmission();
    duplicateAffirmation.answers[7] = {
      exerciseNumber: 8,
      answerData: ["22", "22", "24"],
    };
    expect(testSubmissionSchema.safeParse(duplicateAffirmation).success).toBe(false);

    const foreignAffirmation = validSubmission();
    foreignAffirmation.answers[8] = {
      exerciseNumber: 9,
      answerData: ["22", "30", "33"],
    };
    expect(testSubmissionSchema.safeParse(foreignAffirmation).success).toBe(false);
  });
});
