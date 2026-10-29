import { describe, expect, it } from "vitest";
import { buildRecalculationPlan, createPreviewHash } from "./recalculation";
import type { ScoringRow } from "./scoring";

const emptyTables = new Map<number, ScoringRow[]>(
  Array.from({ length: 10 }, (_, index) => [index + 1, []])
);

describe("buildRecalculationPlan", () => {
  it("segnala e prepara l'aggiornamento quando solo la descrizione è assente o non allineata", () => {
    const plan = buildRecalculationPlan({
      results: [{
        id: "result-1",
        userId: "user-1",
        completedAt: new Date("2026-05-12T12:00:00Z"),
        verdeScore: 12,
        rossoScore: 12,
        bluScore: 12,
        profileType: "Dominante VERDE",
        profileDescription: null,
      }],
      answersByResultId: new Map([["result-1", []]]),
      tables: emptyTables,
    });

    expect(plan.summary).toEqual({
      totalResults: 1,
      affectedResults: 1,
      unchangedResults: 0,
      affectedUsers: 1,
    });
    expect(plan.changes[0]).toMatchObject({
      scoresChanged: false,
      profileChanged: false,
      descriptionChanged: true,
      after: {
        profileType: "Dominante VERDE",
        profileDescription: "Persona sociale, armoniosa e orientata alle relazioni. Eccellente nelle relazioni interpersonali con capacità di mediazione e costruzione del consenso.",
      },
    });
  });

  it("produce la stessa impronta solo per la stessa anteprima", () => {
    const oneChange = [{
      testResultId: "result-1",
      userId: "user-1",
      completedAt: "2026-05-12T12:00:00Z",
      before: { verde: 12, rosso: 12, blu: 12, profileType: "A", profileDescription: null },
      after: { verde: 13, rosso: 11, blu: 12, profileType: "B", profileDescription: "Descrizione B" },
      scoresChanged: true,
      profileChanged: true,
      descriptionChanged: true,
    }];

    expect(createPreviewHash(oneChange)).toBe(createPreviewHash([...oneChange]));
    expect(createPreviewHash(oneChange)).not.toBe(createPreviewHash([{ ...oneChange[0], after: { ...oneChange[0].after, verde: 14 } }]));
  });
});
