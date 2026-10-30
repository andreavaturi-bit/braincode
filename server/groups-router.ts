import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  addUsersToGroup,
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembersWithLatestResults,
  getGroupsByIds,
  getGroupsWithMemberCounts,
  getUserGroupMemberships,
  renameGroup,
  setUserGroups,
} from "./db";
import { isAdmin } from "./config/admins";
import { buildGroupOverview, slugifyGroupName } from "./groups";
import { protectedProcedure, router } from "./_core/trpc";

const groupIdSchema = z.string().min(1).max(64);
const userIdSchema = z.string().min(1).max(64);
const groupNameSchema = z.string().trim().min(1, "Inserisci un nome gruppo.").max(120, "Il nome può contenere al massimo 120 caratteri.");

function assertAdmin(email: string | null | undefined) {
  if (!isAdmin(email || undefined)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Non autorizzato" });
  }
}

async function requireGroup(groupId: string) {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Gruppo non trovato" });
  }
  return group;
}

async function getGroupAggregate(groupId: string) {
  const group = await requireGroup(groupId);
  const members = await getGroupMembersWithLatestResults(groupId);
  const completedResults = members.flatMap((member) => member.result ? [member.result] : []);
  return {
    group,
    overview: buildGroupOverview(members.length, completedResults),
    members,
  };
}

function normaliseUserIds(userIds: string[]) {
  return Array.from(new Set(userIds));
}

/** Tutte le procedure di questo router sono riservate agli amministratori. */
export const groupsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.user.email);
    return await getGroupsWithMemberCounts();
  }),

  create: protectedProcedure
    .input(z.object({ name: groupNameSchema }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      const slug = slugifyGroupName(input.name);
      if (!slug) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Il nome deve contenere almeno una lettera o un numero." });
      }
      try {
        return await createGroup({ id: nanoid(), name: input.name, slug });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "Esiste già un gruppo con questo nome o link." });
        }
        throw error;
      }
    }),

  rename: protectedProcedure
    .input(z.object({ groupId: groupIdSchema, name: groupNameSchema }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      await requireGroup(input.groupId);
      await renameGroup(input.groupId, input.name);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      await requireGroup(input.groupId);
      await deleteGroup(input.groupId);
      return { success: true };
    }),

  memberships: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.user.email);
    return await getUserGroupMemberships();
  }),

  setUserGroups: protectedProcedure
    .input(z.object({ userId: userIdSchema, groupIds: z.array(groupIdSchema).max(100) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      const groupIds = Array.from(new Set(input.groupIds));
      const foundGroups = await getGroupsByIds(groupIds);
      if (foundGroups.length !== groupIds.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Uno dei gruppi selezionati non esiste più." });
      }
      await setUserGroups(input.userId, groupIds);
      return { success: true };
    }),

  addUsers: protectedProcedure
    .input(z.object({ groupId: groupIdSchema, userIds: z.array(userIdSchema).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      await requireGroup(input.groupId);
      await addUsersToGroup(input.groupId, normaliseUserIds(input.userIds));
      return { success: true };
    }),

  /** Solo dati aggregati: è usato dalla modalità proiezione senza PII. */
  summary: protectedProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      const aggregate = await getGroupAggregate(input.groupId);
      return { group: aggregate.group, overview: aggregate.overview };
    }),

  detail: protectedProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.user.email);
      const { group, overview, members } = await getGroupAggregate(input.groupId);

      return {
        group,
        overview,
        members: members.map((member) => ({
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          result: member.result && {
            verdeScore: member.result.verdeScore,
            rossoScore: member.result.rossoScore,
            bluScore: member.result.bluScore,
            profileType: member.result.profileType,
            completedAt: member.result.completedAt,
          },
        })),
      };
    }),
});

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY";
}
