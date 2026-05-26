/** Samples required per market for one answer option. */
export type QuotaTargetsByMarket = Record<string, number>;

export type ScreenerQuestionQuotaConfig = {
  enabled: boolean;
  /** One entry per non-empty answer option (same order as saved options). */
  optionTargets: QuotaTargetsByMarket[];
};

export function emptyQuotaConfig(optionCount: number): ScreenerQuestionQuotaConfig {
  return {
    enabled: false,
    optionTargets: Array.from({ length: Math.max(0, optionCount) }, () => ({})),
  };
}

export function countQuotaOptions(
  answerOptions: { text: string }[],
): number {
  return answerOptions.filter((o) => o.text.trim().length > 0).length;
}

export function normalizeQuotaConfig(
  raw: unknown,
  optionCount: number,
): ScreenerQuestionQuotaConfig {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<ScreenerQuestionQuotaConfig>)
      : null;

  const enabled = Boolean(source?.enabled);
  const prev = Array.isArray(source?.optionTargets) ? source.optionTargets : [];

  const optionTargets = Array.from({ length: optionCount }, (_, index) => {
    const row = prev[index];
    if (!row || typeof row !== "object" || Array.isArray(row)) return {};
    const byMarket: QuotaTargetsByMarket = {};
    for (const [market, value] of Object.entries(row)) {
      const trimmed = market.trim();
      if (!trimmed) continue;
      const n =
        typeof value === "number" ? value : Number.parseInt(String(value), 10);
      if (Number.isFinite(n) && n >= 0) {
        byMarket[trimmed] = Math.floor(n);
      }
    }
    return byMarket;
  });

  return { enabled, optionTargets };
}

export function quotaConfigForSave(
  config: ScreenerQuestionQuotaConfig,
  optionCount: number,
): ScreenerQuestionQuotaConfig | null {
  const normalized = normalizeQuotaConfig(config, optionCount);
  if (!normalized.enabled) return null;
  return normalized;
}

export function screenerQuestionToQuotaFormState(question: {
  answerOptions: { text: string }[];
  quotaConfig: ScreenerQuestionQuotaConfig | null;
}): ScreenerQuestionQuotaConfig {
  const optionCount = countQuotaOptions(question.answerOptions);
  if (!question.quotaConfig) {
    return emptyQuotaConfig(optionCount);
  }
  return normalizeQuotaConfig(question.quotaConfig, optionCount);
}

export type QuotaMarketTarget = {
  market: string;
  target: number;
};

export type ScreenerQuotaSummaryOption = {
  optionText: string;
  markets: QuotaMarketTarget[];
};

export type ScreenerQuotaSummaryEntry = {
  questionId: string;
  position: number;
  questionText: string;
  options: ScreenerQuotaSummaryOption[];
  hasTargets: boolean;
};

export function collectScreenerQuotaSummary(
  questions: Array<{
    id: string;
    position: number;
    questionText: string;
    answerOptions: { text: string }[];
    quotaConfig: ScreenerQuestionQuotaConfig | null;
  }>,
  projectMarkets: string[],
): ScreenerQuotaSummaryEntry[] {
  const marketOrder = projectMarkets.filter((m) => m.trim().length > 0);

  return questions
    .filter((q) => q.quotaConfig?.enabled)
    .map((q) => {
      const filledOptions = q.answerOptions.filter((o) => o.text.trim().length > 0);
      const targets = q.quotaConfig?.optionTargets ?? [];

      const options: ScreenerQuotaSummaryOption[] = filledOptions.map(
        (opt, index) => {
          const byMarket = targets[index] ?? {};
          const seen = new Set<string>();
          const markets: QuotaMarketTarget[] = [];

          for (const market of marketOrder) {
            const target = byMarket[market];
            if (typeof target === "number" && target > 0) {
              markets.push({ market, target });
              seen.add(market);
            }
          }

          for (const [market, target] of Object.entries(byMarket)) {
            if (seen.has(market) || typeof target !== "number" || target <= 0) {
              continue;
            }
            markets.push({ market, target });
          }

          return { optionText: opt.text.trim(), markets };
        },
      );

      const hasTargets = options.some((o) => o.markets.length > 0);

      return {
        questionId: q.id,
        position: q.position,
        questionText: q.questionText,
        options,
        hasTargets,
      };
    });
}
