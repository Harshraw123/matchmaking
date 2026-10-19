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

  const strengthsSummary = strengths.length > 0 
    ? `Key shared foundations include ${strengths.slice(0, 2).join('; ')}.` 
    : '';

  const conflictSummary = potentialConflicts.length > 0
    ? ` Note that ${potentialConflicts[0].toLowerCase()} will benefit from early conversation.`
    : '';

  const coverageNote = scoreCoverage < 75 
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

  const hobbyPhrase = commonHobbies.length > 0
    ? `Both of you share an enthusiasm for ${commonHobbies.slice(0, 2).join(' and ')}.`
    : `Both profiles reflect high commitment to intentional personal growth and shared values.`;

  const locationContext = customer.city === candidate.city 
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

// ---------------------------------------------------------------------------
// Gemini-Powered Explanation & Introduction Services
// ---------------------------------------------------------------------------

export interface GeminiExplanationResult {
  explanation: string;
  tier?: string;
  keySynergies?: string[];
  frictionPoints?: string[];
  source: 'ai' | 'deterministic';
  provider: 'gemini' | 'deterministic';
}

export interface GeminiIntroResult {
  introDraft: string;
  source: 'ai' | 'deterministic';
  provider: 'gemini' | 'deterministic';
}

export interface GeminiMatchNarrativeResult extends GeminiExplanationResult, GeminiIntroResult {}

async function callGeminiJson<T>(
  systemPrompt: string,
  userPayload: unknown,
  timeoutMs = 8000
): Promise<T | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey === 'your_gemini_api_key_here') {
    return null;
  }

  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].filter(Boolean) as string[];
  const uniqueModels = Array.from(new Set(candidateModels));

  for (const model of uniqueModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: JSON.stringify(userPayload) }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            response_mime_type: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(cleanText) as T;
        }
      } else if (res.status === 403) {
        break;
      }
    } catch {
      // try next fallback model
    }
  }

  return null;
}

/**
 * Gemini-powered explanation service.
 * Synthesizes evidence-grounded match rationale, key synergies, and friction points.
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
  const deterministicFallback = generateDeterministicExplanation(
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts
  );

  const defaultTier =
    overallScore >= 80
      ? 'High Potential Match'
      : overallScore >= 70
      ? 'Strong Compatibility'
      : overallScore >= 60
      ? 'Moderate Fit'
      : 'Selective Fit';

  const systemPrompt = `You are a discreet, senior matrimonial matchmaker at The Date Crew (TDC).
You will receive verified biodata, calculated compatibility scores (0-100), confirmed strengths, friction points, and unconfirmed items for two individuals.
Your task:
1. "tier": Classify profile fit into one of: "High Potential Match", "Strong Compatibility", "Moderate Fit", or "Selective Fit".
2. "explanation": Provide natural language reasoning for profile fit (2-3 sentences) grounded strictly on verified logic and shared traits.
3. "keySynergies": List 2-3 specific evidence-backed bullet points explaining why these two profiles fit together.
4. "frictionPoints": List 1-2 points to be mindful of or verify during consultation.

Strict Rules:
- Rely strictly on supplied facts and scores. Never invent details, hobbies, or life events.
- Never make claims about guaranteed marriage success.
- Never mention or infer caste, religion, or protected traits.
- Return response strictly in JSON:
{
  "tier": "High Potential Match",
  "explanation": "...",
  "keySynergies": ["...", "..."],
  "frictionPoints": ["..."]
}`;

  const userPayload = {
    customer: {
      name: `${customer.firstName} ${customer.lastName}`,
      gender: customer.gender,
      age: customer.age,
      city: customer.city,
      profession: customer.designation,
      education: customer.undergraduateCollege,
      values: customer.personalValues,
      hobbies: customer.hobbies,
    },
    candidate: {
      name: `${candidate.firstName} ${candidate.lastName}`,
      gender: candidate.gender,
      age: candidate.age,
      city: candidate.city,
      profession: candidate.designation,
      company: candidate.currentCompany,
      education: candidate.undergraduateCollege,
      degree: candidate.degree,
      values: candidate.personalValues,
      hobbies: candidate.hobbies,
    },
    metrics: {
      overallScore,
      scoreCoverage,
      factorScores: factorScores.map(f => ({ name: f.name, score: f.score, evidence: f.evidence })),
      strengths,
      potentialConflicts,
      unknowns,
    },
  };

  const parsed = await callGeminiJson<{
    tier?: string;
    explanation?: string;
    keySynergies?: string[];
    frictionPoints?: string[];
  }>(systemPrompt, userPayload);

  if (parsed?.explanation && parsed.explanation.trim().length > 10) {
    return {
      explanation: parsed.explanation,
      tier: parsed.tier || defaultTier,
      keySynergies: parsed.keySynergies || strengths.slice(0, 3),
      frictionPoints: parsed.frictionPoints || potentialConflicts.slice(0, 2),
      source: 'ai',
      provider: 'gemini',
    };
  }

  return {
    explanation: deterministicFallback,
    tier: defaultTier,
    keySynergies: strengths.slice(0, 3),
    frictionPoints: potentialConflicts.slice(0, 2),
    source: 'deterministic',
    provider: 'deterministic',
  };
}

/**
 * Gemini-powered personalized introductory draft service.
 * Drafts warm, highly customized introduction emails referencing verified candidate highlights.
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

  const introPrompt = `You are a discreet, senior matchmaker at The Date Crew (TDC).
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

  const parsed = await callGeminiJson<{ introDraft?: string }>(
    introPrompt,
    { customer: customer.firstName, candidate: `${candidate.firstName} ${candidate.lastName}` }
  );

  if (parsed?.introDraft && parsed.introDraft.trim().length > 20) {
    return {
      introDraft: parsed.introDraft,
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
 * Generates both the explanation narrative and personalized introduction in a single
 * API roundtrip to minimize latency and API cost within the ranking pipeline.
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
  const deterministicExplanation = generateDeterministicExplanation(
    customer,
    candidate,
    overallScore,
    scoreCoverage,
    factorScores,
    strengths,
    potentialConflicts
  );

  const deterministicIntro = generateDeterministicIntroDraft(
    customer,
    candidate,
    factorScores,
    strengths
  );

  const defaultTier =
    overallScore >= 80
      ? 'High Potential Match'
      : overallScore >= 70
      ? 'Strong Compatibility'
      : overallScore >= 60
      ? 'Moderate Fit'
      : 'Selective Fit';

  const systemPrompt = `You are a discreet, senior matrimonial matchmaker at The Date Crew (TDC).
You will receive verified biodata, calculated compatibility scores (0-100), confirmed strengths, friction points, and unconfirmed items for two individuals.
Your task:
1. "tier": Classify profile fit into: "High Potential Match", "Strong Compatibility", "Moderate Fit", or "Selective Fit".
2. "explanation": Natural language reasoning for profile fit (2-3 sentences) grounded strictly on verified logic and shared traits.
3. "keySynergies": 2-3 specific evidence-backed bullet points explaining why these two profiles fit.
4. "frictionPoints": 1-2 points to be mindful of or verify during consultation.
5. "introDraft": A short, warm, personalized email introduction (under 120 words) for the client presenting this candidate.

Strict Rules:
- Rely strictly on supplied facts and scores. Never invent details, hobbies, or life events.
- Never make claims about guaranteed marriage success.
- Never mention or infer caste, religion, or protected traits.
- Return response strictly in JSON:
{
  "tier": "High Potential Match",
  "explanation": "...",
  "keySynergies": ["...", "..."],
  "frictionPoints": ["..."],
  "introDraft": "..."
}`;

  const userPayload = {
    customer: {
      name: `${customer.firstName} ${customer.lastName}`,
      gender: customer.gender,
      age: customer.age,
      city: customer.city,
      profession: customer.designation,
      education: customer.undergraduateCollege,
      values: customer.personalValues,
      hobbies: customer.hobbies,
    },
    candidate: {
      name: `${candidate.firstName} ${candidate.lastName}`,
      gender: candidate.gender,
      age: candidate.age,
      city: candidate.city,
      profession: candidate.designation,
      company: candidate.currentCompany,
      education: candidate.undergraduateCollege,
      degree: candidate.degree,
      values: candidate.personalValues,
      hobbies: candidate.hobbies,
    },
    metrics: {
      overallScore,
      scoreCoverage,
      factorScores: factorScores.map(f => ({ name: f.name, score: f.score, evidence: f.evidence })),
      strengths,
      potentialConflicts,
      unknowns,
    },
  };

  const parsed = await callGeminiJson<{
    tier?: string;
    explanation?: string;
    keySynergies?: string[];
    frictionPoints?: string[];
    introDraft?: string;
  }>(systemPrompt, userPayload);

  if (parsed?.explanation && parsed.introDraft) {
    return {
      tier: parsed.tier || defaultTier,
      explanation: parsed.explanation,
      keySynergies: parsed.keySynergies || strengths.slice(0, 3),
      frictionPoints: parsed.frictionPoints || potentialConflicts.slice(0, 2),
      introDraft: parsed.introDraft,
      source: 'ai',
      provider: 'gemini',
    };
  }

  return {
    tier: defaultTier,
    explanation: deterministicExplanation,
    keySynergies: strengths.slice(0, 3),
    frictionPoints: potentialConflicts.slice(0, 2),
    introDraft: deterministicIntro,
    source: 'deterministic',
    provider: 'deterministic',
  };
}
