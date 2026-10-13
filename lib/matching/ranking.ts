import {
  CustomerProfile,
  PartnerPreferences,
  MatchResult,
  MatchingConfig,
  DEFAULT_MATCHING_CONFIG,
} from './types';
import { checkEligibility } from './eligibility';
import { scoreCandidate } from './scoring';
import { generateDeterministicExplanation, generateDeterministicIntroDraft } from './explanations';

export type SortCriteria = 'overall' | 'mutual' | 'completeness';

export interface RankOptions {
  sort?: SortCriteria;
  verifiedOnly?: boolean;
  limit?: number;
  config?: MatchingConfig;
  alreadyIntroducedIds?: Set<string>;
}

export function rankCandidates(
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

    // 1. Hard Eligibility Filter
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

    // 2. Multi-factor Scoring
    const scoreResult = scoreCandidate(
      customer,
      customerPrefs,
      candidate,
      candidatePrefs,
      config
    );

    // 3. Explanation & Intro generation
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

    const tier =
      scoreResult.overallScore >= 80
        ? 'High Potential Match'
        : scoreResult.overallScore >= 70
        ? 'Strong Compatibility'
        : scoreResult.overallScore >= 60
        ? 'Moderate Fit'
        : 'Selective Fit';

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
      tier,
      keySynergies: scoreResult.strengths.slice(0, 3),
      frictionPoints: scoreResult.potentialConflicts.slice(0, 2),
      explanation,
      introDraft,
      candidate,
    });
  }

  // 4. Deterministic Ranking
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
