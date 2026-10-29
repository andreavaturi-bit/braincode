import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { 
  getUserTestResults, 
  getTestResultWithAnswers,
  getTestResultById,
  getAllTestResults,
  saveTestResult,
  saveTestAnswers,
  getScoringTable,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./db";
import { isAdmin } from "./config/admins";
import { nanoid } from "nanoid";
import { computeScores, determineProfile, getProfileDescription, type ScoringRow } from "./scoring";
import { testSubmissionSchema } from "./test-submission";
import { applyRecalculation, getRecalculationPreview } from "./recalculation";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  test: router({
    /**
     * Submit a completed test and calculate the profile
     */
    submit: protectedProcedure
      .input(testSubmissionSchema)
      .mutation(async ({ ctx, input }) => {
        // Calculate scores based on answers
        const scores = await calculateScores(input.answers);
        
        // Determine profile type
        const profileType = determineProfile(scores.verde, scores.rosso, scores.blu);
        const profileDescription = getProfileDescription(profileType);

        // Save test result
        const testResultId = nanoid();
        await saveTestResult({
          id: testResultId,
          userId: ctx.user.id,
          verdeScore: scores.verde,
          rossoScore: scores.rosso,
          bluScore: scores.blu,
          profileType,
          profileDescription,
        });

        // Save individual answers
        const answersToSave = input.answers.map(answer => ({
          id: nanoid(),
          testResultId,
          exerciseNumber: answer.exerciseNumber,
          answerData: answer.answerData,
        }));
        await saveTestAnswers(answersToSave);

        return {
          testResultId,
          scores,
          profileType,
          profileDescription,
        };
      }),

    /**
     * Get all test results for the current user
     */
    myResults: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTestResults(ctx.user.id);
    }),

    /**
     * Get a specific test result with answers
     */
    getResult: protectedProcedure
      .input(z.object({ testResultId: z.string() }))
      .query(async ({ ctx, input }) => {
        const result = await getTestResultById(input.testResultId);
        if (!result) return null;

        const userIsAdmin = isAdmin(ctx.user.email || undefined);
        if (result.userId !== ctx.user.id && !userIsAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Non autorizzato",
          });
        }

        return await getTestResultWithAnswers(input.testResultId);
      }),
  }),

  admin: router({
    /**
     * Check if current user is admin
     */
    isAdmin: protectedProcedure.query(({ ctx }) => {
      return isAdmin(ctx.user.email || undefined);
    }),

    /**
     * Get all test results (admin only)
     */
    getAllResults: protectedProcedure.query(async ({ ctx }) => {
      assertAdmin(ctx.user.email || undefined);
      
      return await getAllTestResults();
    }),

    /** Genera un'anteprima del ricalcolo senza scrivere risultati o notifiche. */
    recalculatePreview: protectedProcedure.query(async ({ ctx }) => {
      assertAdmin(ctx.user.email || undefined);
      return await getRecalculationPreview();
    }),

    /** Applica esclusivamente l'anteprima confermata dall'amministratore. */
    recalculateApply: protectedProcedure
      .input(z.object({ previewHash: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        assertAdmin(ctx.user.email || undefined);
        try {
          return await applyRecalculation(input.previewHash);
        } catch (error) {
          if (error instanceof Error && error.name === "RecalculationConflictError") {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.message,
            });
          }
          throw error;
        }
      }),
  }),

  notifications: router({
    /**
     * Get all notifications for the current user
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),

    /**
     * Mark a specific notification as read
     */
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    /**
     * Mark all notifications as read for the current user
     */
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

/**
 * Calcola i punteggi VERDE, ROSSO, BLU a partire dalle risposte di un test.
 *
 * Meccanica (dal libro Structogram IBSA):
 * - Disco circolare con scala 0-36.
 * - Indice verde (boundary verde/rosso) parte da 12.
 * - Indice rosso (boundary rosso/blu) parte da 24.
 * - I tre settori iniziali sono ampi 12 unità ciascuno.
 * - Per ogni esercizio si legge il differenziale (+1, 0, -1, +2, -2) per
 *   ciascun indice dalla tabella di scoring. + = orario, - = antiorario.
 *
 * Output: ampiezze finali dei tre settori (la somma è sempre 36).
 *
 * In caso di risposte estreme (mai osservate in pratica) gli indici potrebbero
 * uscire dal range [0, 36]: in quel caso i valori vengono clampati per evitare
 * settori negativi nel grafico finale.
 */
async function calculateScores(answers: Array<{ exerciseNumber: number; answerData: unknown }>) {
  const tables = new Map<number, ScoringRow[]>();
  for (let ex = 1; ex <= 10; ex++) {
    tables.set(ex, await getScoringTable(ex));
  }
  return computeScores(answers, tables);
}

function assertAdmin(email: string | undefined) {
  if (!isAdmin(email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Non autorizzato",
    });
  }
}
