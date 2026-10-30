import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  getUserTestResults: vi.fn(),
  getTestResultWithAnswers: vi.fn(),
  getTestResultById: vi.fn(),
  getAllTestResults: vi.fn(),
  getAdminParticipants: vi.fn(),
  saveTestResult: vi.fn(),
  saveTestAnswers: vi.fn(),
  saveCompletedTest: vi.fn(),
  getScoringTable: vi.fn(),
  getUserNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  getGroupsWithMemberCounts: vi.fn(),
  getUserGroupMemberships: vi.fn(),
  createGroup: vi.fn(),
  renameGroup: vi.fn(),
  deleteGroup: vi.fn(),
  getGroupById: vi.fn(),
  getGroupsByIds: vi.fn(),
  setUserGroups: vi.fn(),
  addUsersToGroup: vi.fn(),
  getGroupMembersWithLatestResults: vi.fn(),
}));

const recalculation = vi.hoisted(() => ({
  getRecalculationPreview: vi.fn(),
  applyRecalculation: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./recalculation", () => recalculation);

import { appRouter } from "./routers";

function createContext(id: string, email: string) {
  return {
    user: {
      id,
      name: "Utente di test",
      email,
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn() },
  } as any;
}

function validSubmission() {
  const plusMinusAnswers = [
    ["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["10", "11", "12"],
    ["13", "14", "15"], ["16", "17", "18"], ["19", "20", "21"],
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

describe("sicurezza router BrainCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocca un utente che tenta di leggere il risultato di un'altra persona", async () => {
    db.getTestResultById.mockResolvedValue({ id: "result-owner", userId: "owner" });
    const caller = appRouter.createCaller(createContext("other-user", "utente@example.com"));

    await expect(caller.test.getResult({ testResultId: "result-owner" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Non autorizzato",
    });
    expect(db.getTestResultWithAnswers).not.toHaveBeenCalled();
  });

  it("permette il dettaglio al proprietario e a un admin della whitelist", async () => {
    const result = { id: "result-owner", userId: "owner", answers: [] };
    db.getTestResultById.mockResolvedValue({ id: "result-owner", userId: "owner" });
    db.getTestResultWithAnswers.mockResolvedValue(result);

    const ownerCaller = appRouter.createCaller(createContext("owner", "owner@example.com"));
    await expect(ownerCaller.test.getResult({ testResultId: "result-owner" })).resolves.toEqual(result);

    const adminCaller = appRouter.createCaller(createContext("admin", "andrea.vaturi@gmail.com"));
    await expect(adminCaller.test.getResult({ testResultId: "result-owner" })).resolves.toEqual(result);
  });

  it("rifiuta un invio non valido prima di leggere tabelle o salvare dati", async () => {
    const invalidSubmission = validSubmission();
    invalidSubmission.answers.pop();
    const caller = appRouter.createCaller(createContext("user", "utente@example.com"));

    await expect(caller.test.submit(invalidSubmission)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.getScoringTable).not.toHaveBeenCalled();
    expect(db.saveTestResult).not.toHaveBeenCalled();
    expect(db.saveTestAnswers).not.toHaveBeenCalled();
  });

  it("riserva anteprima e applicazione del ricalcolo agli amministratori", async () => {
    const plan = {
      summary: { totalResults: 1, affectedResults: 1, unchangedResults: 0, affectedUsers: 1 },
      changes: [],
      previewHash: "hash-confermato",
    };
    recalculation.getRecalculationPreview.mockResolvedValue(plan);
    recalculation.applyRecalculation.mockResolvedValue({ ...plan.summary, notificationsCreated: 0, previewHash: plan.previewHash });

    const regularCaller = appRouter.createCaller(createContext("user", "utente@example.com"));
    await expect(regularCaller.admin.recalculatePreview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(recalculation.getRecalculationPreview).not.toHaveBeenCalled();

    const adminCaller = appRouter.createCaller(createContext("admin", "andrea.vaturi@gmail.com"));
    await expect(adminCaller.admin.recalculatePreview()).resolves.toEqual(plan);
    await expect(adminCaller.admin.recalculateApply({ previewHash: "hash-confermato" })).resolves.toMatchObject({
      affectedResults: 1,
      notificationsCreated: 0,
    });
    expect(recalculation.applyRecalculation).toHaveBeenCalledWith("hash-confermato");
  });

  it("riserva tutte le letture dei gruppi agli amministratori", async () => {
    const regularCaller = appRouter.createCaller(createContext("user", "utente@example.com"));
    await expect(regularCaller.admin.groups.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(regularCaller.admin.groups.memberships()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(regularCaller.admin.groups.summary({ groupId: "group-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.getGroupsWithMemberCounts).not.toHaveBeenCalled();
    expect(db.getUserGroupMemberships).not.toHaveBeenCalled();
    expect(db.getGroupById).not.toHaveBeenCalled();

    db.getGroupsWithMemberCounts.mockResolvedValue([{ id: "g1", name: "Eicon", slug: "eicon", memberCount: 0 }]);
    const adminCaller = appRouter.createCaller(createContext("admin", "andrea.vaturi@gmail.com"));
    await expect(adminCaller.admin.groups.list()).resolves.toHaveLength(1);
  });
});
