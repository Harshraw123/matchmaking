import {
  CustomerProfile,
  PartnerPreferences,
  MatchResult,
  MatchingConfig,
  DEFAULT_MATCHING_CONFIG,
} from './types';
import { checkEligibility } from './eligibility';
import { scoreCandidate } from './scoring';
import { getMatchTier } from '../ai/prompts';
import {
  generateDeterministicExplanation,
  generateDeterministicIntroDraft,
  generateGeminiMatchNarrative,
} from './explanations';

export type SortCriteria = 'overall' | 'mutual' | 'completeness';

export interface RankOptions {
  sort?: SortCriteria;
  verifiedOnly?: boolean;
  limit?: number;
  config?: MatchingConfig;
  alreadyIntroducedIds?: Set<string>;
  enableAi?: boolean;
  aiLimit?: number;
}

/**
 * Deterministic baseline candidate ranking (synchronous).
 * Filters eligible candidates, scores them across 7 factors, and sorts them deterministically.
 * Ranking and eligibility are 100% controlled by mathematical algorithms without LLM influence.
 */
export function rankCandidatesSync(
  customer: CustomerProfile,
  customerPrefs: PartnerPreferences | undefined,
  candidates: CustomerProfile[],
  candidatePrefsMap: Map<string, PartnerPreferences>,
  options: RankOptions = {}
): MatchResult[] {
  const {
    sort = 'overall',
    verifiedOnly = false,
    limit,
    config = DEFAULT_MATCHING_CONFIG,
    alreadyIntroducedIds = new Set(),
  } = options;

  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    if (verifiedOnly && candidate.verificationStatus !== 'verified') {
      continue;
    }

    const candidatePrefs = candidatePrefsMap.get(candidate.id);

    // 1. Hard Eligibility Filter (Unchanged)
    const eligibility = checkEligibility({
      customer,
      customerPrefs,
      candidate,
      candidatePrefs,
      config,
      alreadyIntroducedIds,
    });

    if (!eligibility.eligible) {
      continue;
    }

    // 2. Multi-factor Scoring (Unchanged)
    const scoreResult = scoreCandidate(
      customer,
      customerPrefs,
      candidate,
      candidatePrefs,
      config
    );

    // 3. Deterministic baseline explanation & intro generation
    const explanation = generateDeterministicExplanation(
      customer,
      candidate,
      scoreResult.overallScore,
      scoreResult.scoreCoverage,
      scoreResult.factorScores,
      scoreResult.strengths,
      scoreResult.potentialConflicts
    );

    const introDraft = generateDeterministicIntroDraft(
      customer,
      candidate,
      scoreResult.factorScores,
      scoreResult.strengths
    );

    results.push({
      customerId: customer.id,
      candidateId: candidate.id,
      overallScore: scoreResult.overallScore,
      scoreCoverage: scoreResult.scoreCoverage,
      factorScores: scoreResult.factorScores,
      strengths: scoreResult.strengths,
      potentialConflicts: scoreResult.potentialConflicts,
      unknowns: scoreResult.unknowns,
      eligibilityReasons: eligibility.reasons,
      explanationSource: 'deterministic',
      provider: 'deterministic',
      tier: getMatchTier(scoreResult.overallScore),
      keySynergies: scoreResult.strengths.slice(0, 3),
      frictionPoints: scoreResult.potentialConflicts.slice(0, 2),
      explanation,
      introDraft,
      candidate,
    });
  }

  // 4. Deterministic Ranking (Controlled by mathematical scores & tie-breakers)
  results.sort((a, b) => {
    if (sort === 'mutual') {
      const aMutual = a.factorScores.find(f => f.factor === 'mutualPreferences')?.score ?? 0;
      const bMutual = b.factorScores.find(f => f.factor === 'mutualPreferences')?.score ?? 0;
      if (bMutual !== aMutual) return bMutual - aMutual;
    } else if (sort === 'completeness') {
      const aComp = a.factorScores.find(f => f.factor === 'profileCompletenessAndVerification')?.score ?? 0;
      const bComp = b.factorScores.find(f => f.factor === 'profileCompletenessAndVerification')?.score ?? 0;
      if (bComp !== aComp) return bComp - aComp;
    }

    // Default primary: overall score
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }

    // Secondary deterministic tie-breaker: coverage then candidate ID
    if (b.scoreCoverage !== a.scoreCoverage) {
      return b.scoreCoverage - a.scoreCoverage;
    }

    return a.candidateId.localeCompare(b.candidateId);
  });

  if (limit && limit > 0) {
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Main Candidate Ranking Pipeline.
 * 1. Executes deterministic eligibility and scoring (under strict algorithmic control).
 * 2. Establishes final ranking order mathematically.
 * 3. Enhances top ranked candidates with Gemini-powered explanations and personalized intro drafts.
 * 4. Gracefully falls back to deterministic copy if Gemini is unconfigured or fails.
 */
export async function rankCandidates(
  customer: CustomerProfile,
  customerPrefs: PartnerPreferences | undefined,
  candidates: CustomerProfile[],
  candidatePrefsMap: Map<string, PartnerPreferences>,
  options: RankOptions = {}
): Promise<MatchResult[]> {
  // 1 & 2. Get deterministically filtered, scored, and ranked candidates
  const ranked = rankCandidatesSync(customer, customerPrefs, candidates, candidatePrefsMap, options);

  const shouldRunAi = options.enableAi ?? Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  if (!shouldRunAi || ranked.length === 0) {
    return ranked;
  }

  // Determine how many top candidates to enhance with Gemini
  const aiCount = Math.min(options.aiLimit ?? 5, ranked.length);

  // Enhance top matches concurrently
  const enhancementPromises = ranked.slice(0, aiCount).map(async (match) => {
    if (!match.candidate) return match;

    try {
      const aiNarrative = await generateGeminiMatchNarrative(
        customer,
        match.candidate,
        match.overallScore,
        match.scoreCoverage,
        match.factorScores,
        match.strengths,
        match.potentialConflicts,
        match.unknowns
      );

      if (aiNarrative.source === 'ai') {
        return {
          ...match,
          explanation: aiNarrative.explanation,
          introDraft: aiNarrative.introDraft,
          tier: aiNarrative.tier || match.tier,
          keySynergies: aiNarrative.keySynergies || match.keySynergies,
          frictionPoints: aiNarrative.frictionPoints || match.frictionPoints,
          explanationSource: 'ai' as const,
          provider: 'gemini' as const,
        };
      }
    } catch (err) {
      console.warn(`[AI Enhancement] Fallback applied for candidate ${match.candidateId}:`, err);
    }

    return match;
  });

  const settled = await Promise.allSettled(enhancementPromises);

  settled.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      ranked[idx] = result.value;
    }
  });

  return ranked;
}
