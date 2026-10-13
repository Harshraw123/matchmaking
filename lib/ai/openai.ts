import { z } from 'zod';
import { CustomerProfile, FactorScore } from '../matching/types';
import { generateDeterministicExplanation, generateDeterministicIntroDraft } from '../matching/explanations';

const AiExplanationSchema = z.object({
  explanation: z.string().min(10),
  introDraft: z.string().min(20),
});

export interface AiMatchOutput {
  explanation: string;
  introDraft: string;
  source: 'ai' | 'deterministic';
  provider?: 'gemini' | 'openai' | 'deterministic';
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

  const systemPrompt = `You are a discreet, senior matrimonial matchmaker at The Date Crew (TDC).
You will receive verified biodata, calculated compatibility scores, confirmed strengths, potential friction points, and unconfirmed unknowns for two individuals.
Your task:
1. Provide a concise, professional, evidence-grounded match rationale (2-3 sentences).
2. Draft a personalized, warm introductory message for the client presenting this candidate.

Strict Rules:
- Rely strictly on the supplied facts and scores. Never invent details, hobbies, or life events.
- Never make claims about "guaranteed marriage success" or scientifically absolute predictions.
- Never mention or infer caste, religion, or protected traits.
- Acknowledge unknown or unconfirmed items where relevant.
- Return response strictly in valid JSON matching:
{
  "explanation": "...",
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

  // ---------------------------------------------------------------------------
  // 1. Check Google Gemini API (Primary Preferred Provider)
  // ---------------------------------------------------------------------------
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          const parsed = JSON.parse(cleanText);
          const validated = AiExplanationSchema.safeParse(parsed);
          if (validated.success) {
            return {
              explanation: validated.data.explanation,
              introDraft: validated.data.introDraft,
              source: 'ai',
              provider: 'gemini',
            };
          }
        }
      } else {
        console.warn(`[AI Gemini] Responded with status ${res.status}. Trying fallback.`);
      }
    } catch (err) {
      console.warn('[AI Gemini] Call failed or timed out. Checking secondary fallback.', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Check OpenAI API (Secondary Provider)
  // ---------------------------------------------------------------------------
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.trim() !== '' && openAiKey !== 'your_openai_api_key_here') {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(userPayload) },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const validated = AiExplanationSchema.safeParse(parsed);
          if (validated.success) {
            return {
              explanation: validated.data.explanation,
              introDraft: validated.data.introDraft,
              source: 'ai',
              provider: 'openai',
            };
          }
        }
      }
    } catch (err) {
      console.warn('[AI OpenAI] Call failed. Using deterministic fallback.', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Deterministic Resilient Fallback (Zero external dependencies)
  // ---------------------------------------------------------------------------
  return {
    explanation: deterministicExplanation,
    introDraft: deterministicIntro,
    source: 'deterministic',
    provider: 'deterministic',
  };
}
