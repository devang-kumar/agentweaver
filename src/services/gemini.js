/**
 * Gemini API client — direct REST, no SDK.
 * Model priority: gemini-2.5-flash-lite → gemini-2.5-flash → gemini-2.0-flash-lite → gemini-2.0-flash
 * Free tier: gemini-2.5-flash-lite gives high limits and fast responses.
 */

// Model chain — first non-rate-limited one wins
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

function endpoint(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/** Parse the suggested retry delay (seconds) out of a Gemini quota error message. */
function parseRetryDelay(message = '') {
  const m = message.match(/retry in ([\d.]+)s/i);
  return m ? Math.ceil(parseFloat(m[1])) + 2 : 65; // +2s buffer
}

/**
 * Call Gemini with automatic model fallback + one auto-retry on rate limit.
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.apiKey
 * @param {boolean} [opts.jsonMode=false]
 * @param {Function} [opts.onStatus]  - progress callback(message)
 */
export async function callGemini({ prompt, apiKey, jsonMode = false, onStatus }) {
  if (!apiKey?.trim()) throw new Error('NO_API_KEY');

  const body = (model) => ({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });

  for (const model of MODELS) {
    onStatus?.(`Trying ${model}…`);

    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `${endpoint(model)}?key=${apiKey.trim()}`;
      const t0 = Date.now();

      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body(model)),
        });
      } catch (netErr) {
        throw new Error(`Network error: ${netErr.message}`);
      }

      const raw = await response.json();

      if (response.ok) {
        const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini returned an empty response.');

        const usage = raw.usageMetadata || {};
        let data = text;

        if (jsonMode) {
          const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
          try { data = JSON.parse(clean); }
          catch { throw new Error('Gemini response was not valid JSON. Please try again.'); }
        }

        return {
          data,
          model,
          duration: Date.now() - t0,
          promptTokens: usage.promptTokenCount ?? 0,
          outputTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
        };
      }

      // Rate limit — auto-retry after the suggested delay
      const msg = raw?.error?.message || '';
      if (response.status === 429 && attempt === 0) {
        const delay = parseRetryDelay(msg);
        // Count down visibly
        for (let s = delay; s > 0; s--) {
          onStatus?.(`Rate limited on ${model} — retrying in ${s}s…`);
          await new Promise(r => setTimeout(r, 1000));
        }
        continue; // retry same model once
      }

      // Any other error on this model → try next model in chain
      break;
    }
  }

  throw new Error(
    'All Gemini models are currently rate-limited on your free tier. ' +
    'Wait ~1 minute and try again, or upgrade at ai.google.dev.'
  );
}

