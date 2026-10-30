import { describe, expect, it } from "vitest";
import {
  buildGroupOverview,
  getProfileDistributionKey,
  normalizeGroupSlug,
  roundScoresTo36,
  slugifyGroupName,
} from "./groups";

describe("logica gruppi BrainCode", () => {
  it("genera slug leggibili e normalizza gli accenti", () => {
    expect(slugifyGroupName("  Còrdùa & Partners  ")).toBe("cordua-partners");
    expect(normalizeGroupSlug("cordua-2026")).toBe("cordua-2026");
    expect(normalizeGroupSlug("Cordua")).toBeNull();
    expect(normalizeGroupSlug("cordua/altro")).toBeNull();
  });

  it("arrotonda le medie mantenendo sempre la somma 36", () => {
    expect(roundScoresTo36(12.4, 11.4, 12.2)).toEqual({ verde: 13, rosso: 11, blu: 12 });
    expect(roundScoresTo36(12, 12, 12)).toEqual({ verde: 12, rosso: 12, blu: 12 });
  });

  it("classifica doppie dominanti ed equilibrio senza confonderli con i colori singoli", () => {
    expect(getProfileDistributionKey("Doppia dominante VERDE/BLU")).toBe("doppia");
    expect(getProfileDistributionKey("Ripartizione equilibrata")).toBe("equilibrata");
    expect(getProfileDistributionKey("Dominante ROSSO con seconda componente VERDE")).toBe("rosso");
  });

  it("calcola una panoramica con media, conteggi e percentuali", () => {
    const overview = buildGroupOverview(3, [
      { userId: "u1", userName: "A", userEmail: null, completedAt: new Date(), verdeScore: 18, rossoScore: 10, bluScore: 8, profileType: "Dominante VERDE" },
      { userId: "u2", userName: "B", userEmail: null, completedAt: new Date(), verdeScore: 12, rossoScore: 14, bluScore: 10, profileType: "Dominante ROSSO" },
    ]);

    expect(overview.memberCount).toBe(3);
    expect(overview.completedCount).toBe(2);
    expect(overview.average.verde + overview.average.rosso + overview.average.blu).toBe(36);
    expect(overview.distribution).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "verde", count: 1, percent: 50 }),
      expect.objectContaining({ key: "rosso", count: 1, percent: 50 }),
    ]));
  });
});
