import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getUserTestResults, 
  getTestResultWithAnswers,
  saveTestResult,
  saveTestAnswers,
  getScoringTable,
  getAffirmationScoring
} from "./db";
import { nanoid } from "nanoid";

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
});

export type AppRouter = typeof appRouter;

/**
 * Calculate VERDE, ROSSO, BLU scores from answers
 * Logic: Start from initial positions (VERDE=12, ROSSO=24, BLU=0), 
 * accumulate incremental movements on circular disc, 
 * final BLU = 36 - (final_VERDE + final_ROSSO)
 */
async function calculateScores(answers: Array<{ exerciseNumber: number; answerData: any }>) {
  // Accumulate differentials (not absolute positions)
  let verdeDifferential = 0;
  let rossoDifferential = 0;

  // Process exercises 1-7 (format: { plus: "1", minus: "2" })
  for (const answer of answers.filter(a => a.exerciseNumber <= 7)) {
    const scoringTable = await getScoringTable(answer.exerciseNumber);
    const combinationKey = formatCombinationKey(answer.answerData);
    
    const scoring = scoringTable.find(s => s.combinationKey === combinationKey);
    if (scoring) {
      verdeDifferential += scoring.verdeScore;
      rossoDifferential += scoring.rossoScore;
    }
    // If not found, add 0 (no change)
  }

  // Process exercises 8-10 (format: ["28", "29", "30"])
  for (const answer of answers.filter(a => a.exerciseNumber >= 8 && a.exerciseNumber <= 10)) {
    const scoringTable = await getScoringTable(answer.exerciseNumber);
    const selectedKey = formatAffirmationKey(answer.answerData);
    
    const scoring = scoringTable.find(s => s.combinationKey === selectedKey);
    if (scoring) {
      verdeDifferential += scoring.verdeScore;
      rossoDifferential += scoring.rossoScore;
    }
    // If combination not in table, add 0 (as per book instructions)
  }

  // Calculate final scores for the bar visualization
  // Based on the book mechanism:
  // - VERDE quantity = 12 + verde_differential (positions 1 to VERDE on bar)
  // - ROSSO position on disc = 24 + rosso_differential
  // - ROSSO quantity = ROSSO_position - VERDE_quantity (positions VERDE+1 to ROSSO_position)
  // - BLU quantity = 36 - ROSSO_position (positions ROSSO_position+1 to 36)
  
  const verdeQuantity = 12 + verdeDifferential;
  const rossoPosition = 24 + rossoDifferential;
  const rossoQuantity = rossoPosition - verdeQuantity;
  const bluQuantity = 36 - rossoPosition;
  
  return { 
    verde: verdeQuantity, 
    rosso: rossoQuantity, 
    blu: bluQuantity 
  };
}

/**
 * Format combination key for exercises 1-7
 * Example: { plus: "2", minus: "1" } => "2+1-"
 * Database format: "X+Y-" means option X with plus, option Y with minus
 */
function formatCombinationKey(answerData: any): string {
  // Handle format: {"1": "-", "2": "+"}
  let plus = '';
  let minus = '';
  
  for (const [key, value] of Object.entries(answerData)) {
    if (value === '+') {
      plus = key;
    } else if (value === '-') {
      minus = key;
    }
  }
  
  return `${plus}+${minus}-`;
}

/**
 * Format affirmation key for exercises 8-10
 * Example: ["34", "35", "37"] => "34,35,37"
 */
function formatAffirmationKey(answerData: string[]): string {
  return answerData.map(s => parseInt(s)).sort((a, b) => a - b).join(',');
}

/**
 * Determine profile type based on scores
 */
function determineProfile(verde: number, rosso: number, blu: number): string {
  const total = verde + rosso + blu;
  const verdePercent = (verde / total) * 100;
  const rossoPercent = (rosso / total) * 100;
  const bluPercent = (blu / total) * 100;

  // Determine dominant component
  const max = Math.max(verdePercent, rossoPercent, bluPercent);
  
  if (max === verdePercent) {
    if (rossoPercent > bluPercent && rossoPercent > 25) {
      return "Dominante VERDE con seconda componente ROSSO";
    } else if (bluPercent > rossoPercent && bluPercent > 25) {
      return "Dominante VERDE con seconda componente BLU";
    }
    return "Dominante VERDE";
  } else if (max === rossoPercent) {
    if (verdePercent > bluPercent && verdePercent > 25) {
      return "Dominante ROSSO con seconda componente VERDE";
    } else if (bluPercent > verdePercent && bluPercent > 25) {
      return "Dominante ROSSO con seconda componente BLU";
    }
    return "Dominante ROSSO";
  } else {
    if (verdePercent > rossoPercent && verdePercent > 25) {
      return "Dominante BLU con seconda componente VERDE";
    } else if (rossoPercent > verdePercent && rossoPercent > 25) {
      return "Dominante BLU con seconda componente ROSSO";
    }
    return "Dominante BLU";
  }
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

