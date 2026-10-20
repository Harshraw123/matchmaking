import { z } from 'zod';
import { CustomerProfile, FactorScore } from '../matching/types';
import {
  generateDeterministicExplanation,
  generateDeterministicIntroDraft,
} from '../matching/explanations';
import {
  AiProvider,
  callGeminiJson,
  callOpenAiJson,
  getGeminiApiKey,
} from './client';
import {
  buildIntroSystemPrompt,
  buildMatchNarrativeSystemPrompt,
  buildMatchUserPayload,
  getMatchTier,
  MatchInsightInput,
} from './prompts';

const AiExplanationSchema = z.object({
  tier: z.string().default('High Potential Match'),
  explanation: z.string().min(10),
  keySynergies: z.array(z.string()).optional().default([]),
  frictionPoints: z.array(z.string()).optional().default([]),
  introDraft: z.string().min(20),
});

export interface AiMatchOutput {
  tier?: string;
  explanation: string;
  keySynergies?: string[];
  frictionPoints?: string[];
  introDraft: string;
  source: 'ai' | 'deterministic';
  provider?: AiProvider;
  apiStatus?: {
    configured: boolean;
    provider: string;
    status: 'active' | 'error' | 'offline';
    message?: string;
  };
}

function buildDeterministicOutput(input: MatchInsightInput): AiMatchOutput {
  const {
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts,
  } = input;

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

function toAiSuccess(
  data: z.infer<typeof AiExplanationSchema>,
  fallback: AiMatchOutput,
  provider: 'gemini' | 'openai',
  model: string
): AiMatchOutput {
  return {
    tier: data.tier || fallback.tier,
    explanation: data.explanation,
    keySynergies: data.keySynergies?.length ? data.keySynergies : fallback.keySynergies,
    frictionPoints: data.frictionPoints?.length ? data.frictionPoints : fallback.frictionPoints,
    introDraft: data.introDraft,
    source: 'ai',
    provider,
    apiStatus: {
      configured: true,
      provider,
      status: 'active',
      message: `Powered by AI (${model})`,
    },
  };
}

export async function generateAiMatchInsights(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  overallScore: number,
  scoreCoverage: number,
  factorScores: FactorScore[],
  strengths: string[],
  potentialConflicts: string[],
  unknowns: string[]
): Promise<AiMatchOutput> {
  const input: MatchInsightInput = {
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts,
    unknowns,
  };

  const fallback = buildDeterministicOutput(input);
  const systemPrompt = buildMatchNarrativeSystemPrompt(true);
  const userPayload = buildMatchUserPayload(input);

  const gemini = await callGeminiJson<unknown>(systemPrompt, userPayload, { timeoutMs: 9000 });
  if (gemini) {
    const validated = AiExplanationSchema.safeParse(gemini.data);
    if (validated.success) {
      return toAiSuccess(validated.data, fallback, 'gemini', gemini.model);
    }
  }

  const openai = await callOpenAiJson<unknown>(systemPrompt, userPayload);
  if (openai) {
    const validated = AiExplanationSchema.safeParse(openai.data);
    if (validated.success) {
      return toAiSuccess(validated.data, fallback, 'openai', openai.model);
    }
  }

  return {
    ...fallback,
    apiStatus: {
      configured: Boolean(getGeminiApiKey()),
      provider: 'gemini',
      status: getGeminiApiKey() ? 'error' : 'offline',
      message: getGeminiApiKey()
        ? 'AI providers unavailable; using deterministic fallback'
        : 'Operating in offline deterministic mode',
    },
  };
}

export async function generateAiIntroEmail(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  factorScores: FactorScore[],
  strengths: string[],
  customNote?: string
): Promise<{
  introDraft: string;
  source: 'ai' | 'deterministic';
  provider: string;
  message?: string;
}> {
  const gemini = await callGeminiJson<{ introDraft?: string }>(
    buildIntroSystemPrompt(customer, candidate, strengths, customNote),
    { customer: customer.firstName, candidate: `${candidate.firstName} ${candidate.lastName}` },
    { temperature: 0.35 }
  );

  if (gemini?.data.introDraft) {
    return {
      introDraft: gemini.data.introDraft,
      source: 'ai',
      provider: 'gemini',
      message: `Generated with AI (${gemini.model})`,
    };
  }

  return {
    introDraft: generateDeterministicIntroDraft(customer, candidate, factorScores, strengths),
    source: 'deterministic',
    provider: 'deterministic',
  };
}
