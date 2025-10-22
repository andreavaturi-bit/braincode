import { drizzle } from "drizzle-orm/mysql2";
import { scoringTables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function checkScoring() {
  for (let ex = 1; ex <= 10; ex++) {
    const combinations = await db
      .select()
      .from(scoringTables)
      .where(eq(scoringTables.exerciseNumber, ex));
    
    console.log(`\nESERCIZIO ${ex}: ${combinations.length} combinazioni`);
    combinations.forEach(c => {
      console.log(`  ${c.combinationKey.padEnd(20)} → V:${c.verdeScore >= 0 ? '+' : ''}${c.verdeScore} R:${c.rossoScore >= 0 ? '+' : ''}${c.rossoScore}`);
    });
  }
}

checkScoring().then(() => process.exit(0));

