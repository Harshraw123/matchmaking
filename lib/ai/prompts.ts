import { CustomerProfile, FactorScore } from '../matching/types';

export type MatchTier =
  | 'High Potential Match'
  | 'Strong Compatibility'
  | 'Moderate Fit'
  | 'Selective Fit';

export function getMatchTier(overallScore: number): MatchTier {
  if (overallScore >= 80) return 'High Potential Match';
  if (overallScore >= 70) return 'Strong Compatibility';
  if (overallScore >= 60) return 'Moderate Fit';
  return 'Selective Fit';
}

function summarizeProfile(profile: CustomerProfile, extras?: { includeCompany?: boolean; includeDegree?: boolean }) {
  return {
    name: `${profile.firstName} ${profile.lastName}`,
    gender: profile.gender,
    age: profile.age,
    city: profile.city,
    profession: profile.designation,
    ...(extras?.includeCompany ? { company: profile.currentCompany } : {}),
    education: profile.undergraduateCollege,
    ...(extras?.includeDegree ? { degree: profile.degree } : {}),
    values: profile.personalValues,
    hobbies: profile.hobbies,
  };
}

export interface MatchInsightInput {
  customer: CustomerProfile;
  candidate: CustomerProfile;
  overallScore: number;
  scoreCoverage: number;
  factorScores: FactorScore[];
  strengths: string[];
  potentialConflicts: string[];
  unknowns?: string[];
}

export function buildMatchUserPayload(input: MatchInsightInput) {
  const {
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts,
    unknowns = [],
  } = input;

  return {
    customer: summarizeProfile(customer),
    candidate: summarizeProfile(candidate, { includeCompany: true, includeDegree: true }),
    metrics: {
      overallScore,
      scoreCoverage,
      factorScores: factorScores.map(f => ({ name: f.name, score: f.score, evidence: f.evidence })),
      strengths,
      potentialConflicts,
      unknowns,
    },
  };
}

const MATCHMAKER_PERSONA =
  'You are a discreet, senior matrimonial matchmaker at The Date Crew (TDC).';

const STRICT_RULES = `- Rely strictly on supplied facts and scores. Never invent details, hobbies, or life events.
- Never make claims about guaranteed marriage success.
- Never mention or infer caste, religion, or protected traits.`;

export function buildMatchNarrativeSystemPrompt(includeIntro: boolean): string {
  const tasks = [
    '1. "tier": Classify profile fit into one of: "High Potential Match", "Strong Compatibility", "Moderate Fit", or "Selective Fit".',
    '2. "explanation": Provide natural language reasoning for profile fit (2-3 sentences) grounded strictly on verified logic and shared traits.',
    '3. "keySynergies": List 2-3 specific evidence-backed bullet points explaining why these two profiles fit together.',
    '4. "frictionPoints": List 1-2 points to be mindful of or verify during consultation.',
  ];

  const jsonShape: Record<string, unknown> = {
    tier: 'High Potential Match',
    explanation: '...',
    keySynergies: ['...', '...'],
    frictionPoints: ['...'],
  };

  if (includeIntro) {
    tasks.push(
      '5. "introDraft": Draft a short, warm, personalized email introduction (under 120 words) for the client presenting this candidate.'
    );
    jsonShape.introDraft = '...';
  }

  return `${MATCHMAKER_PERSONA}
You will receive verified biodata, calculated compatibility scores (0-100), confirmed strengths, friction points, and unconfirmed items for two individuals.
Your task:
${tasks.join('\n')}

Strict Rules:
${STRICT_RULES}
- Acknowledge unknown or unconfirmed items where relevant.
- Return response strictly in valid JSON matching:
${JSON.stringify(jsonShape, null, 2)}`;
}

export function buildIntroSystemPrompt(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  strengths: string[],
  customNote?: string
): string {
  return `${MATCHMAKER_PERSONA}
Draft a short, warm, and highly personalized introductory email to client ${customer.firstName} presenting candidate ${candidate.firstName} ${candidate.lastName}.
Candidate verified highlights:
- Age: ${candidate.age}
- Profession: ${candidate.designation} at ${candidate.currentCompany}
- Education: ${candidate.undergraduateCollege} (${candidate.degree})
- Location: ${candidate.city}
- Shared strengths: ${strengths.slice(0, 2).join('; ')}
${customNote ? `- Additional Matchmaker note: ${customNote}` : ''}

Rules:
- Concise, warm, polite, and professional (under 120 words).
- Focus on lifestyle alignment and shared values.
- Never mention caste, religion, or unverified facts.
- Return response strictly in JSON: { "introDraft": "..." }`;
}
