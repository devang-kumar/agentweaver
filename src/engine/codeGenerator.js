/**
 * Real ML code generator — calls Gemini to produce a complete, runnable codebase
 * for any problem the user describes.
 */
import { callGemini } from '../services/gemini';

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(config, results, csvMetadata) {
  const compliance = results.compliance?.length > 0 ? results.compliance.join(', ') : 'None';
  const latency = config.latencyTarget ? `<${config.latencyTarget}ms` : 'standard';
  const models = results.allModels.map(m => m.name).join(', ');

  let customDatasetPrompt = '';
  if (csvMetadata) {
    customDatasetPrompt = `
CUSTOM DATASET DETAILS:
- Features to load: [${csvMetadata.features.join(', ')}]
- Target to predict: "${csvMetadata.target}"
Ensure the FastAPI Pydantic request model exactly declares these features as fields, and train.py correctly drops columns, splits, pre-processes, and trains a matching classifier/regressor.
`;
  }

  return `Generate a complete, production-ready ML solution as a JSON object.

Problem: ${results.domain} ${results.problemType}
Dataset: ~${results.rows}, ${results.columns} features ${customDatasetPrompt}
Best model: ${results.champion.name} (${results.champion.metric}: ${results.champion.score})
Other candidates: ${models}
Deploy: ${results.deployTarget} | Latency: ${latency} | Compliance: ${compliance}

Return ONLY this JSON (no markdown, no extra text):
{
  "train.py": "...",
  "app/main.py": "...",
  "requirements.txt": "...",
  "Dockerfile": "...",
  "docker-compose.yml": "...",
  "tests/test_pipeline.py": "...",
  "README.md": "..."
}

Rules:
- train.py: load CSV, preprocess (handle nulls/categoricals), train ${results.champion.name}, cross-validate, print ${results.champion.metric}, save model.pkl with joblib, if __name__=="__main__" block
- app/main.py: FastAPI with /health GET, /predict POST, /metrics GET; Pydantic models; load model.pkl; CORS; HTTPException error handling; structured logging
- requirements.txt: pinned versions; include fastapi, uvicorn, scikit-learn, pandas, numpy, joblib, pytest, httpx
- Dockerfile: python:3.11-slim, install deps, non-root user, EXPOSE 8000, HEALTHCHECK, CMD uvicorn
- docker-compose.yml: port 8000, data volume
- tests/test_pipeline.py: 5+ pytest functions; test preprocessing, model load, /health, /predict, edge cases
- README.md: setup + run commands

No placeholders. Every function must be complete.`;
}

// ── Validation ────────────────────────────────────────────────────────────
function validateFiles(files, results) {
  const checks = [];

  const REQUIRED = [
    'train.py', 'app/main.py', 'requirements.txt',
    'Dockerfile', 'tests/test_pipeline.py',
  ];

  // File presence + size
  REQUIRED.forEach(f => {
    const present = !!files[f] && files[f].length > 100;
    checks.push({
      category: 'Structure',
      name: `${f} generated`,
      passed: present,
      detail: present ? `${files[f].length.toLocaleString()} chars` : 'Missing or empty',
    });
  });

  // train.py checks
  if (files['train.py']) {
    const t = files['train.py'];
    checks.push({ category: 'Training', name: 'Entry point (main block)', passed: t.includes("__main__"), detail: '' });
    checks.push({ category: 'Training', name: 'Model persistence (joblib/pickle)', passed: t.includes('joblib') || t.includes('pickle'), detail: '' });
    checks.push({ category: 'Training', name: 'Train/test split', passed: t.includes('train_test_split') || t.includes('split'), detail: '' });
    checks.push({ category: 'Training', name: 'Metric evaluation', passed: /score|accuracy|auc|f1|rmse|mape|ndcg|silhouette/i.test(t), detail: '' });
    checks.push({ category: 'Training', name: 'Data preprocessing', passed: /pipeline|scaler|encoder|transform|fillna|dropna/i.test(t), detail: '' });
  }

  // API checks
  if (files['app/main.py']) {
    const a = files['app/main.py'];
    checks.push({ category: 'API', name: 'FastAPI app instance', passed: /FastAPI\(/.test(a), detail: '' });
    checks.push({ category: 'API', name: '/predict endpoint', passed: a.includes('/predict'), detail: '' });
    checks.push({ category: 'API', name: '/health endpoint', passed: a.includes('/health'), detail: '' });
    checks.push({ category: 'API', name: 'Pydantic models', passed: /BaseModel/.test(a), detail: '' });
    checks.push({ category: 'API', name: 'Error handling', passed: /HTTPException|try.*except/s.test(a), detail: '' });
    checks.push({ category: 'API', name: 'CORS middleware', passed: /CORSMiddleware|cors/i.test(a), detail: '' });
  }

  // Dockerfile
  if (files['Dockerfile']) {
    const d = files['Dockerfile'];
    checks.push({ category: 'Docker', name: 'Python base image', passed: d.includes('python'), detail: '' });
    checks.push({ category: 'Docker', name: 'EXPOSE directive', passed: d.includes('EXPOSE'), detail: '' });
    checks.push({ category: 'Docker', name: 'CMD/ENTRYPOINT', passed: d.includes('CMD') || d.includes('ENTRYPOINT'), detail: '' });
    checks.push({ category: 'Docker', name: 'Requirements install', passed: d.includes('requirements'), detail: '' });
  }

  // requirements.txt
  if (files['requirements.txt']) {
    const r = files['requirements.txt'];
    checks.push({ category: 'Dependencies', name: 'fastapi', passed: r.includes('fastapi'), detail: '' });
    checks.push({ category: 'Dependencies', name: 'scikit-learn', passed: r.includes('scikit-learn'), detail: '' });
    checks.push({ category: 'Dependencies', name: 'pandas', passed: r.includes('pandas'), detail: '' });
    checks.push({ category: 'Dependencies', name: 'pytest', passed: r.includes('pytest'), detail: '' });
  }

  // Tests
  if (files['tests/test_pipeline.py']) {
    const t = files['tests/test_pipeline.py'];
    const count = (t.match(/^def test_/gm) || []).length;
    checks.push({ category: 'Tests', name: `${count} test functions`, passed: count >= 3, detail: `Found ${count}` });
    checks.push({ category: 'Tests', name: 'Assertions present', passed: t.includes('assert'), detail: '' });
    checks.push({ category: 'Tests', name: 'API client tests', passed: /TestClient|client\./i.test(t), detail: '' });
  }

  const passed = checks.filter(c => c.passed).length;
  return { checks, passed, total: checks.length, score: Math.round((passed / checks.length) * 100) };
}

// ── Public API ─────────────────────────────────────────────────────────────
/**
 * Generate a complete ML codebase for the given pipeline results.
 * @param {object} config  - from parser
 * @param {object} results - from simulator
 * @param {string} apiKey  - Gemini API key from settings
 * @param {Function} onStatus - progress callback(message)
 */
export async function generateCode(config, results, apiKey, onStatus, csvMetadata) {
  onStatus?.('Building prompt…');
  const prompt = buildPrompt(config, results, csvMetadata);

  onStatus?.('Connecting to Gemini (trying gemini-2.5-flash-lite first)…');
  const geminiResult = await callGemini({
    prompt,
    apiKey,
    jsonMode: true,
    onStatus, // passes live countdown through to UI
  });

  onStatus?.('Validating generated code…');
  const files = geminiResult.data;
  const validation = validateFiles(files, results);

  return {
    files,
    validation,
    meta: {
      model: geminiResult.model,          // actual model that responded
      generatedAt: new Date().toISOString(),
      duration: geminiResult.duration,
      promptTokens: geminiResult.promptTokens,
      outputTokens: geminiResult.outputTokens,
      totalTokens: geminiResult.totalTokens,
    },
  };
}

