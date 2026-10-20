/**
 * Shared LLM HTTP clients for Gemini and OpenAI.
 * Providers return parsed JSON or null; callers own fallbacks.
 */

export type AiProvider = 'gemini' | 'openai' | 'deterministic';

function isUsableKey(key: string | undefined, placeholder: string): key is string {
  return Boolean(key && key.trim() !== '' && key !== placeholder);
}

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return isUsableKey(key, 'your_gemini_api_key_here') ? key : null;
}

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  return isUsableKey(key, 'your_openai_api_key_here') ? key : null;
}

/** Single model used for all Gemini calls (free-tier friendly). */
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function resolveGeminiModels(): string[] {
  return [GEMINI_MODEL];
}

export function stripJsonFences(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export interface LlmCallOptions {
  timeoutMs?: number;
  temperature?: number;
}

export interface GeminiCallResult<T> {
  data: T;
  model: string;
}

export async function callGeminiJson<T>(
  systemPrompt: string,
  userPayload: unknown,
  options: LlmCallOptions = {}
): Promise<GeminiCallResult<T> | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const { timeoutMs = 8000, temperature = 0.3 } = options;
  const models = resolveGeminiModels();

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
              parts: [{ text: typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload) }],
            },
          ],
          generationConfig: {
            temperature,
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
          return {
            data: JSON.parse(stripJsonFences(rawText)) as T,
            model,
          };
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

export interface OpenAiCallResult<T> {
  data: T;
  model: string;
}

export async function callOpenAiJson<T>(
  systemPrompt: string,
  userPayload: unknown,
  options: LlmCallOptions = {}
): Promise<OpenAiCallResult<T> | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;

  const { timeoutMs = 7000, temperature = 0.4 } = options;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload),
          },
        ],
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return {
      data: JSON.parse(content) as T,
      model,
    };
  } catch {
    return null;
  }
}
