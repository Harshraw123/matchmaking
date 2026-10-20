import { callGeminiJson, AiProvider } from '../ai/client';
import {
  buildIntroSystemPrompt,
  buildMatchNarrativeSystemPrompt,
  buildMatchUserPayload,
  getMatchTier,
  MatchInsightInput,
} from '../ai/prompts';
import { CustomerProfile, FactorScore } from './types';

export function generateDeterministicExplanation(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  overallScore: number,
  scoreCoverage: number,
  factorScores: FactorScore[],
  strengths: string[],
  potentialConflicts: string[]
): string {
  const topFactors = [...factorScores]
    .filter(f => f.score >= 75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const topFactorNames = topFactors.map(f => f.name.toLowerCase()).join(' and ');

  let toneDescriptor = 'Promising potential alignment';
  if (overallScore >= 85) toneDescriptor = 'Exceptional mutual compatibility';
  else if (overallScore >= 75) toneDescriptor = 'Strong complementary match';
  else if (overallScore >= 60) toneDescriptor = 'Moderate compatibility with selective commonalities';
  else toneDescriptor = 'Low alignment across core preference criteria';

  const strengthsSummary =
    strengths.length > 0
      ? `Key shared foundations include ${strengths.slice(0, 2).join('; ')}.`
      : '';

  const conflictSummary =
    potentialConflicts.length > 0
      ? ` Note that ${potentialConflicts[0].toLowerCase()} will benefit from early conversation.`
      : '';

  const coverageNote =
    scoreCoverage < 75
      ? ` (Data coverage is currently ${scoreCoverage}%; some preferences remain to be confirmed with the client).`
      : '';

  return `${toneDescriptor} (${overallScore}/100) anchored by strong synergy in ${topFactorNames || 'personal biodata'}. ${strengthsSummary}${conflictSummary}${coverageNote}`;
}

export function generateDeterministicIntroDraft(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  factorScores: FactorScore[],
  strengths: string[]
): string {
  const commonHobbies = customer.hobbies.filter(h =>
    candidate.hobbies.map(x => x.toLowerCase()).includes(h.toLowerCase())
  );

  const hobbyPhrase =
    commonHobbies.length > 0
      ? `Both of you share an enthusiasm for ${commonHobbies.slice(0, 2).join(' and ')}.`
      : `Both profiles reflect high commitment to intentional personal growth and shared values.`;

  const locationContext =
    customer.city === candidate.city
      ? `as you both reside in ${candidate.city}`
      : `with ${candidate.firstName} based in ${candidate.city}`;

  return `Dear ${customer.firstName},

I am delighted to introduce ${candidate.firstName} ${candidate.lastName}, who caught our attention as an exceptionally well-aligned candidate for you.

${candidate.firstName} is working as a ${candidate.designation} at ${candidate.currentCompany} with a background from ${candidate.undergraduateCollege}. ${locationContext}, there is strong synergy across your lifestyle values. ${hobbyPhrase}

Our team noticed especially strong alignment in your long-term perspectives and career sensibilities. We believe an introductory virtual coffee would be a delightful next step.

Warm regards,
Your Dedicated Matchmaker
The Date Crew`;
}

export interface GeminiExplanationResult {
  explanation: string;
  tier?: string;
  keySynergies?: string[];
  frictionPoints?: string[];
  source: 'ai' | 'deterministic';
  provider: AiProvider;
}

export interface GeminiIntroResult {
  introDraft: string;
  source: 'ai' | 'deterministic';
  provider: AiProvider;
}

export interface GeminiMatchNarrativeResult extends GeminiExplanationResult, GeminiIntroResult {}

function toInsightInput(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  overallScore: number,
  scoreCoverage: number,
  factorScores: FactorScore[],
  strengths: string[],
  potentialConflicts: string[],
  unknowns: string[] = []
): MatchInsightInput {
  return {
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts,
    unknowns,
  };
}

function buildDeterministicNarrative(input: MatchInsightInput): GeminiMatchNarrativeResult {
  const { customer, candidate, overallScore, scoreCoverage, factorScores, strengths, potentialConflicts } =
    input;

  return {
    tier: getMatchTier(overallScore),
    explanation: generateDeterministicExplanation(
      customer,
      candidate,
      overallScore,
      scoreCoverage,
      factorScores,
      strengths,
      potentialConflicts
    ),
    keySynergies: strengths.slice(0, 3),
    frictionPoints: potentialConflicts.slice(0, 2),
    introDraft: generateDeterministicIntroDraft(customer, candidate, factorScores, strengths),
    source: 'deterministic',
    provider: 'deterministic',
  };
}

/**
 * Gemini-powered explanation service.
 * Falls back to deterministic explanation if offline, unconfigured, or on timeout.
 */
export async function generateGeminiExplanation(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  overallScore: number,
  scoreCoverage: number,
  factorScores: FactorScore[],
  strengths: string[],
  potentialConflicts: string[],
  unknowns: string[] = []
): Promise<GeminiExplanationResult> {
  const input = toInsightInput(
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts,
    unknowns
  );
  const fallback = buildDeterministicNarrative(input);

  const result = await callGeminiJson<{
    tier?: string;
    explanation?: string;
    keySynergies?: string[];
    frictionPoints?: string[];
  }>(buildMatchNarrativeSystemPrompt(false), buildMatchUserPayload(input));

  if (result?.data.explanation && result.data.explanation.trim().length > 10) {
    return {
      explanation: result.data.explanation,
      tier: result.data.tier || fallback.tier,
      keySynergies: result.data.keySynergies || fallback.keySynergies,
      frictionPoints: result.data.frictionPoints || fallback.frictionPoints,
      source: 'ai',
      provider: 'gemini',
    };
  }

  const { explanation, tier, keySynergies, frictionPoints, source, provider } = fallback;
  return { explanation, tier, keySynergies, frictionPoints, source, provider };
}

/**
 * Gemini-powered personalized introductory draft service.
 * Falls back to deterministic intro draft if offline, unconfigured, or on timeout.
 */
export async function generateGeminiIntroDraft(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  factorScores: FactorScore[],
  strengths: string[],
  customNote?: string
): Promise<GeminiIntroResult> {
  const deterministicFallback = generateDeterministicIntroDraft(
    customer,
    candidate,
    factorScores,
    strengths
  );

  const result = await callGeminiJson<{ introDraft?: string }>(
    buildIntroSystemPrompt(customer, candidate, strengths, customNote),
    { customer: customer.firstName, candidate: `${candidate.firstName} ${candidate.lastName}` }
  );

  if (result?.data.introDraft && result.data.introDraft.trim().length > 20) {
    return {
      introDraft: result.data.introDraft,
      source: 'ai',
      provider: 'gemini',
    };
  }

  return {
    introDraft: deterministicFallback,
    source: 'deterministic',
    provider: 'deterministic',
  };
}

/**
 * Unified Gemini Match Narrative Service.
 * Generates explanation + intro in a single API roundtrip.
 */
export async function generateGeminiMatchNarrative(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  overallScore: number,
  scoreCoverage: number,
  factorScores: FactorScore[],
  strengths: string[],
  potentialConflicts: string[],
  unknowns: string[] = []
): Promise<GeminiMatchNarrativeResult> {
  const input = toInsightInput(
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts,
    unknowns
  );
  const fallback = buildDeterministicNarrative(input);

  const result = await callGeminiJson<{
    tier?: string;
    explanation?: string;
    keySynergies?: string[];
    frictionPoints?: string[];
    introDraft?: string;
  }>(buildMatchNarrativeSystemPrompt(true), buildMatchUserPayload(input));

  if (result?.data.explanation && result.data.introDraft) {
    return {
      tier: result.data.tier || fallback.tier,
      explanation: result.data.explanation,
      keySynergies: result.data.keySynergies || fallback.keySynergies,
      frictionPoints: result.data.frictionPoints || fallback.frictionPoints,
      introDraft: result.data.introDraft,
      source: 'ai',
      provider: 'gemini',
    };
  }

  return fallback;
}
