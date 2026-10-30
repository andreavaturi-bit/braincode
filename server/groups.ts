export const GROUP_SLUG_MAX_LENGTH = 64;

export type GroupResultForAnalytics = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  completedAt: Date | string;
  verdeScore: number;
  rossoScore: number;
  bluScore: number;
  profileType: string;
};

export type GroupDistributionKey = "verde" | "rosso" | "blu" | "doppia" | "equilibrata" | "altro";

export type GroupDistributionItem = {
  key: GroupDistributionKey;
  label: string;
  count: number;
  percent: number;
};

export function slugifyGroupName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, GROUP_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function normalizeGroupSlug(slug: string): string | null {
  const normalized = slugifyGroupName(slug);
  if (!normalized || normalized !== slug || normalized.length > GROUP_SLUG_MAX_LENGTH) return null;
  return normalized;
}

export function getProfileDistributionKey(profileType: string): GroupDistributionKey {
  if (profileType.startsWith("Doppia dominante")) return "doppia";
  if (profileType === "Ripartizione equilibrata") return "equilibrata";
  if (profileType.startsWith("Dominante VERDE")) return "verde";
  if (profileType.startsWith("Dominante ROSSO")) return "rosso";
  if (profileType.startsWith("Dominante BLU")) return "blu";
  return "altro";
}

const DISTRIBUTION_LABELS: Record<GroupDistributionKey, string> = {
  verde: "Dominante VERDE",
  rosso: "Dominante ROSSO",
  blu: "Dominante BLU",
  doppia: "Doppia dominante",
  equilibrata: "Ripartizione equilibrata",
  altro: "Altri profili",
};

/** Arrotonda tre medie preservando sempre la somma 36. */
export function roundScoresTo36(verde: number, rosso: number, blu: number) {
  const raw = [verde, rosso, blu];
  const rounded = raw.map(Math.floor);
  let remaining = 36 - rounded.reduce((sum, value) => sum + value, 0);

  raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
    .slice(0, Math.max(0, remaining))
    .forEach(({ index }) => {
      rounded[index] += 1;
      remaining -= 1;
    });

  return { verde: rounded[0], rosso: rounded[1], blu: rounded[2] };
}

export function buildGroupOverview(memberCount: number, results: GroupResultForAnalytics[]) {
  const completedCount = results.length;
  const totals = results.reduce(
    (sum, result) => ({
      verde: sum.verde + result.verdeScore,
      rosso: sum.rosso + result.rossoScore,
      blu: sum.blu + result.bluScore,
    }),
    { verde: 0, rosso: 0, blu: 0 }
  );

  const average = completedCount
    ? roundScoresTo36(totals.verde / completedCount, totals.rosso / completedCount, totals.blu / completedCount)
    : { verde: 12, rosso: 12, blu: 12 };

  const counts: Record<GroupDistributionKey, number> = {
    verde: 0,
    rosso: 0,
    blu: 0,
    doppia: 0,
    equilibrata: 0,
    altro: 0,
  };
  results.forEach((result) => {
    counts[getProfileDistributionKey(result.profileType)] += 1;
  });

  const distribution = (Object.keys(counts) as GroupDistributionKey[])
    .map((key) => ({
      key,
      label: DISTRIBUTION_LABELS[key],
      count: counts[key],
      percent: completedCount ? (counts[key] / completedCount) * 100 : 0,
    }))
    .filter((item) => item.count > 0 || item.key !== "altro");

  return {
    memberCount,
    completedCount,
    average,
    distribution,
  };
}
