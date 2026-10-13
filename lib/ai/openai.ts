import { z } from 'zod';
import { CustomerProfile, FactorScore } from '../matching/types';
import { generateDeterministicExplanation, generateDeterministicIntroDraft } from '../matching/explanations';

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
  provider?: 'gemini' | 'openai' | 'deterministic';
  apiStatus?: {
    configured: boolean;
    provider: string;
    status: 'active' | 'error' | 'offline';
    message?: string;
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
1. "tier": Classify profile fit into one of: "High Potential Match", "Strong Compatibility", "Moderate Fit", or "Selective Fit" based on logical evidence.
2. "explanation": Provide natural language reasoning for profile fit (2-3 sentences) grounded strictly on the verified logic and shared traits.
3. "keySynergies": List 2-3 specific evidence-backed bullet points explaining why these two profiles fit together.
4. "frictionPoints": List 1-2 points to be mindful of or verify during consultation.
5. "introDraft": Draft a short, warm, personalized email introduction for the client presenting this candidate.

Strict Rules:
- Rely strictly on the supplied facts and scores. Never invent details, hobbies, or life events.
- Never make claims about "guaranteed marriage success" or scientifically absolute predictions.
- Never mention or infer caste, religion, or protected traits.
- Acknowledge unknown or unconfirmed items where relevant.
- Return response strictly in valid JSON matching:
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

  let lastGeminiError: string | undefined;

  // ---------------------------------------------------------------------------
  // 1. Check Google Gemini API (Primary Preferred Provider)
  // ---------------------------------------------------------------------------
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'your_gemini_api_key_here') {
    const candidateModels = [
      'gemini-3.5-flash-lite',
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ].filter(Boolean) as string[];
    const uniqueModels = Array.from(new Set(candidateModels));

    for (const model of uniqueModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

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
                tier: validated.data.tier || defaultTier,
                explanation: validated.data.explanation,
                keySynergies: validated.data.keySynergies || strengths.slice(0, 3),
                frictionPoints: validated.data.frictionPoints || potentialConflicts.slice(0, 2),
                introDraft: validated.data.introDraft,
                source: 'ai',
                provider: 'gemini',
                apiStatus: {
                  configured: true,
                  provider: 'gemini',
                  status: 'active',
                  message: `Powered by Google Gemini (${model})`,
                },
              };
            }
          }
        } else {
          let errText = `HTTP ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson?.error?.message) {
              errText = `HTTP ${res.status}: ${errJson.error.message}`;
            }
          } catch {
            // ignore
          }
          lastGeminiError = errText;
          console.warn(`[AI Gemini] Model ${model} returned ${errText}`);
          // If project disabled / 403, don't keep hammering subsequent models
          if (res.status === 403) {
            break;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastGeminiError = msg;
        console.warn(`[AI Gemini] Model ${model} call failed:`, msg);
      }
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
              tier: validated.data.tier || defaultTier,
              explanation: validated.data.explanation,
              keySynergies: validated.data.keySynergies || strengths.slice(0, 3),
              frictionPoints: validated.data.frictionPoints || potentialConflicts.slice(0, 2),
              introDraft: validated.data.introDraft,
              source: 'ai',
              provider: 'openai',
              apiStatus: {
                configured: true,
                provider: 'openai',
                status: 'active',
                message: `Powered by OpenAI (${model})`,
              },
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
    tier: defaultTier,
    explanation: deterministicExplanation,
    keySynergies: strengths.slice(0, 3),
    frictionPoints: potentialConflicts.slice(0, 2),
    introDraft: deterministicIntro,
    source: 'deterministic',
    provider: 'deterministic',
    apiStatus: {
      configured: !!geminiApiKey,
      provider: 'gemini',
      status: lastGeminiError ? 'error' : 'offline',
      message: lastGeminiError || 'Operating in offline deterministic mode',
    },
  };
}

export async function generateAiIntroEmail(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  factorScores: FactorScore[],
  strengths: string[],
  customNote?: string
): Promise<{ introDraft: string; source: 'ai' | 'deterministic'; provider: string; message?: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'your_gemini_api_key_here') {
    const candidateModels = [
      'gemini-3.5-flash-lite',
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ].filter(Boolean) as string[];
    const uniqueModels = Array.from(new Set(candidateModels));

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
- Return response in JSON: { "introDraft": "..." }`;

    for (const model of uniqueModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: introPrompt }] }],
            generationConfig: { temperature: 0.35, response_mime_type: 'application/json' },
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
            if (parsed.introDraft) {
              return {
                introDraft: parsed.introDraft,
                source: 'ai',
                provider: 'gemini',
                message: `Generated with Google Gemini (${model})`,
              };
            }
          }
        } else if (res.status === 403) {
          break;
        }
      } catch {
        // try next model
      }
    }
  }

  // Deterministic fallback
  return {
    introDraft: generateDeterministicIntroDraft(customer, candidate, factorScores, strengths),
    source: 'deterministic',
    provider: 'deterministic',
  };
}
