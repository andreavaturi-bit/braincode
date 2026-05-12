import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getUserTestResults, 
  getTestResultWithAnswers,
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
import { computeScores, determineProfile, type ScoringRow } from "./scoring";

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
      .input(z.object({
        answers: z.array(z.object({
          exerciseNumber: z.number().min(1).max(10),
          answerData: z.any(),
        })),
      }))
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
      .query(async ({ input }) => {
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
      if (!isAdmin(ctx.user.email || undefined)) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      return await getAllTestResults();
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
async function calculateScores(answers: Array<{ exerciseNumber: number; answerData: any }>) {
  const tables = new Map<number, ScoringRow[]>();
  for (let ex = 1; ex <= 10; ex++) {
    tables.set(ex, await getScoringTable(ex));
  }
  return computeScores(answers, tables);
}

/**
 * Get profile description based on profile type
 */
function getProfileDescription(profileType: string): string {
  const descriptions: Record<string, string> = {
    "Dominante VERDE": "Persona sociale, armoniosa e orientata alle relazioni. Eccellente nelle relazioni interpersonali con capacità di mediazione e costruzione del consenso.",
    "Dominante ROSSO": "Persona dinamica, impulsiva e orientata all'azione. Desiderio di dominio e superiorità con tendenza alla competizione e autorità innata.",
    "Dominante BLU": "Persona riflessiva, sistematica e orientata alla pianificazione. Pensiero sistematico e categorico con tendenza all'astrazione e precisione.",
    "Dominante VERDE con seconda componente ROSSO": "La componente VERDE sociale si combina con il dinamismo della componente ROSSO, creando un profilo equilibrato tra relazioni e azione.",
    "Dominante VERDE con seconda componente BLU": "La componente VERDE sociale si unisce alla riflessività della componente BLU, creando un profilo empatico e sistematico.",
    "Dominante ROSSO con seconda componente VERDE": "La componente ROSSO diviene più conciliante grazie alla componente VERDE. Può fare leva sul dinamismo disponendo della capacità di tirare le persone dalla propria parte.",
    "Dominante ROSSO con seconda componente BLU": "L'impulsività e la forza di volontà si uniscono alla capacità di porsi obiettivi a lungo termine e di perseguirli con tenacia grazie alla componente BLU.",
    "Dominante BLU con seconda componente VERDE": "La riservatezza e la pianificazione della componente BLU si combinano con la capacità relazionale della componente VERDE.",
    "Dominante BLU con seconda componente ROSSO": "La sistematicità e la pianificazione della componente BLU si uniscono all'energia e alla capacità di azione della componente ROSSO.",
  };

  return descriptions[profileType] || "Profilo unico con caratteristiche equilibrate tra le tre componenti.";
}

