/**
 * AgentWeaver Pipeline Simulator
 * Generates dynamic, contextual pipeline stages based on parsed problem config.
 * Accepts an optional settings object from SettingsContext so nothing is hardcoded.
 */
import { domainLabel, problemLabel } from './parser';
import { AGENT_COUNT } from '../config/agents';

// ── Model candidates per problem type ──────────────────────────────
const MODEL_POOLS = {
  classification: [
    { name: 'XGBoost', family: 'Gradient Boosting' },
    { name: 'LightGBM', family: 'Gradient Boosting' },
    { name: 'CatBoost', family: 'Gradient Boosting' },
    { name: 'Random Forest', family: 'Ensemble' },
    { name: 'Logistic Regression', family: 'Linear' },
    { name: 'SVM (RBF)', family: 'Kernel' },
    { name: 'Neural Network (MLP)', family: 'Deep Learning' },
    { name: 'TabNet', family: 'Deep Learning' },
  ],
  regression: [
    { name: 'XGBoost Regressor', family: 'Gradient Boosting' },
    { name: 'LightGBM Regressor', family: 'Gradient Boosting' },
    { name: 'Random Forest Regressor', family: 'Ensemble' },
    { name: 'Ridge Regression', family: 'Linear' },
    { name: 'ElasticNet', family: 'Linear' },
    { name: 'SVR', family: 'Kernel' },
    { name: 'Neural Network (MLP)', family: 'Deep Learning' },
    { name: 'CatBoost Regressor', family: 'Gradient Boosting' },
  ],
  clustering: [
    { name: 'K-Means', family: 'Centroid' },
    { name: 'DBSCAN', family: 'Density' },
    { name: 'Agglomerative', family: 'Hierarchical' },
    { name: 'Gaussian Mixture', family: 'Probabilistic' },
    { name: 'HDBSCAN', family: 'Density' },
    { name: 'Spectral Clustering', family: 'Graph' },
  ],
  forecasting: [
    { name: 'Prophet', family: 'Decomposition' },
    { name: 'ARIMA', family: 'Statistical' },
    { name: 'LSTM', family: 'Deep Learning' },
    { name: 'N-BEATS', family: 'Deep Learning' },
    { name: 'XGBoost (lag features)', family: 'Gradient Boosting' },
    { name: 'Temporal Fusion Transformer', family: 'Deep Learning' },
    { name: 'LightGBM (lag features)', family: 'Gradient Boosting' },
  ],
  recommendation: [
    { name: 'Collaborative Filtering (ALS)', family: 'Matrix Factorization' },
    { name: 'Neural Collaborative Filtering', family: 'Deep Learning' },
    { name: 'LightFM', family: 'Hybrid' },
    { name: 'Content-Based (TF-IDF)', family: 'Information Retrieval' },
    { name: 'Wide & Deep', family: 'Deep Learning' },
  ],
  anomaly: [
    { name: 'Isolation Forest', family: 'Tree' },
    { name: 'Autoencoder', family: 'Deep Learning' },
    { name: 'One-Class SVM', family: 'Kernel' },
    { name: 'Local Outlier Factor', family: 'Density' },
    { name: 'DBSCAN', family: 'Density' },
    { name: 'Variational Autoencoder', family: 'Deep Learning' },
  ],
  nlp: [
    { name: 'BERT (fine-tuned)', family: 'Transformer' },
    { name: 'DistilBERT', family: 'Transformer' },
    { name: 'RoBERTa', family: 'Transformer' },
    { name: 'XGBoost + TF-IDF', family: 'Traditional ML' },
    { name: 'LSTM + Embeddings', family: 'Deep Learning' },
    { name: 'GPT-3.5 (few-shot)', family: 'LLM' },
  ],
  cv: [
    { name: 'ResNet-50', family: 'CNN' },
    { name: 'EfficientNet-B3', family: 'CNN' },
    { name: 'YOLOv8', family: 'Object Detection' },
    { name: 'Vision Transformer (ViT)', family: 'Transformer' },
    { name: 'MobileNetV3', family: 'Lightweight CNN' },
    { name: 'U-Net', family: 'Segmentation' },
  ],
};

// ── Metric names per problem type ──────────────────────────────────
const METRIC_MAP = {
  classification: { primary: 'AUC', secondary: 'F1-Score', unit: '' },
  regression: { primary: 'RMSE', secondary: 'MAE', unit: '', lowerBetter: true },
  clustering: { primary: 'Silhouette', secondary: 'Calinski-Harabasz', unit: '' },
  forecasting: { primary: 'MAPE', secondary: 'RMSE', unit: '%', lowerBetter: true },
  recommendation: { primary: 'NDCG@10', secondary: 'MAP@10', unit: '' },
  anomaly: { primary: 'AUC-PR', secondary: 'F1-Score', unit: '' },
  nlp: { primary: 'F1-Score', secondary: 'Accuracy', unit: '' },
  cv: { primary: 'mAP@50', secondary: 'Accuracy', unit: '' },
};

// ── Helpers ────────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function genMetric(problemType) {
  const info = METRIC_MAP[problemType] || METRIC_MAP.classification;

  // Generate realistic score ranges per type
  const ranges = {
    classification: { primary: [0.85, 0.97], secondary: [0.82, 0.95] },
    regression: { primary: [0.05, 0.25], secondary: [0.03, 0.18] },
    clustering: { primary: [0.55, 0.85], secondary: [200, 800] },
    forecasting: { primary: [3, 12], secondary: [0.1, 0.5] },
    recommendation: { primary: [0.65, 0.92], secondary: [0.55, 0.85] },
    anomaly: { primary: [0.82, 0.96], secondary: [0.78, 0.93] },
    nlp: { primary: [0.82, 0.96], secondary: [0.85, 0.97] },
    cv: { primary: [0.75, 0.95], secondary: [0.80, 0.96] },
  };

  const r = ranges[problemType] || ranges.classification;
  return {
    ...info,
    primaryRange: r.primary,
    secondaryRange: r.secondary,
  };
}

/**
 * Generate a full simulated pipeline based on parsed problem config.
 */
export function generatePipeline(config, settings = {}) {
  if (!config) return null;

  // ── Pull user-configured settings with sensible fallbacks ─────────
  const maxCandidates = settings['model.candidates'] ?? 5;
  const optunaTrialsMax = settings['model.trials'] ?? 50;
  const settingsLatency = settings['monitoring.latency_target'] ?? null;
  const settingsDeployTarget = settings['cloud.target']
    ? `${settings['cloud.provider'] ?? 'AWS'} ${settings['cloud.target']}`
    : null;
  const settingsDriftThreshold = settings['monitoring.drift_threshold'] ?? 0.1;
  const settingsErrorThreshold = settings['monitoring.error_threshold'] ?? 1;

  const {
    domain, problemType, deployTarget, compliance,
    dataSize, latencyTarget, columns,
  } = config;

  const domainName = domainLabel(domain);
  const problemName = problemLabel(problemType);
  // deployTarget from problem text takes priority; fall back to settings then 'Docker'
  const resolvedDeployTarget = deployTarget !== 'Docker' ? deployTarget : (settingsDeployTarget || deployTarget);
  const rowLabel = dataSize.label || 'Unknown size';
  const colCount = columns || randInt(15, 80);
  const missingPct = rand(0.5, 8).toFixed(1);
  const outlierCount = randInt(30, 350);
  const qualityScore = randInt(72, 96);
  const corrCount = randInt(3, 12);

  // Pick model candidates — count bounded by settings
  const pool = MODEL_POOLS[problemType] || MODEL_POOLS.classification;
  const candidateCount = Math.min(pool.length, randInt(3, Math.max(3, maxCandidates)));
  const candidates = pick(pool, candidateCount);
  const metricInfo = genMetric(problemType);
  const isLower = metricInfo.lowerBetter;

  // Generate scores for each candidate
  const scored = candidates.map((m) => {
    const primary = parseFloat(rand(...metricInfo.primaryRange).toFixed(3));
    const secondary = parseFloat(rand(...metricInfo.secondaryRange).toFixed(3));
    return { ...m, primary, secondary };
  });

  // Sort: best first (lower is better for regression/forecasting)
  scored.sort((a, b) => isLower ? a.primary - b.primary : b.primary - a.primary);

  // Champion gets a boost from hyperparameter tuning
  const champion = scored[0];
  const tuningBoost = isLower ? -rand(0.005, 0.02) : rand(0.005, 0.02);
  const championTuned = parseFloat((champion.primary + tuningBoost).toFixed(3));

  // Test results
  const unitTests = randInt(30, 65);
  const integTests = randInt(8, 18);
  const edgeTests = randInt(5, 15);
  const coverage = rand(86, 96).toFixed(1);
  // Latency: problem text wins, then settings, then random fallback
  const effectiveLatency = latencyTarget || settingsLatency;
  const inferenceMs = effectiveLatency
    ? randInt(Math.max(5, Math.floor(effectiveLatency * 0.15)), Math.floor(effectiveLatency * 0.65))
    : randInt(15, 85);
  const hasBias = Math.random() < 0.1; // 10% chance of bias

  // Deployment details
  const deployPort = randInt(8000, 8999);
  const canaryPct = [5, 10, 25].sort(() => Math.random() - 0.5)[0];
  const quantizationSpeedup = rand(1.5, 3.2).toFixed(1);

  // Monitoring baselines — error rate stays below settings threshold for realistic runs
  const baseLatencyP99 = inferenceMs + randInt(10, 30);
  const errorRateMax = Math.min(0.08, settingsErrorThreshold * 0.08);
  const baseErrorRate = rand(0.001, errorRateMax).toFixed(3);

  // Optuna trials — driven by settings
  const optunaTrials = randInt(Math.max(15, Math.floor(optunaTrialsMax * 0.6)), optunaTrialsMax);

  // ── Build stage tasks ────────────────────────────────────────────

  const stages = [
    {
      id: 'orchestrator', name: 'Orchestrator',
      tasks: [
        `Parsing problem statement`,
        `Identified domain: ${domainName}`,
        `Problem type: ${problemName}`,
        `Preparing Docker container files & environment configs`,
        `Target deployment specifier: ${resolvedDeployTarget}`,
        ...(compliance.length > 0 ? [`Compliance check: ${compliance.join(', ')}`] : ['Compliance check: Standard']),
        ...(effectiveLatency ? [`Inference latency budget: <${effectiveLatency}ms`] : []),
        `Activating specialized workspace pipeline agents...`,
      ],
      duration: 2500,
    },
    {
      id: 'data', name: 'Data Analysis',
      tasks: [
        `Scanning data source (${rowLabel})`,
        `Schema check (${colCount} dimensions)`,
        `Missing values: ${missingPct}% ${parseFloat(missingPct) < 5 ? '(acceptable)' : '(handling via simple imputation)'}`,
        `Outliers: ${outlierCount} identified`,
        `Analyzing numeric & categorical feature correlations`,
        `Computing statistical bounds for playground inputs`,
        `Dry-run dataset audit complete ✓`,
        `Data quality score: ${qualityScore}/100`,
      ],
      duration: 4500,
    },
    {
      id: 'model', name: 'Model Builder',
      tasks: [
        `Comparing candidate algorithms for ${problemName}`,
        ...scored.map(m => `Evaluating candidate: ${m.name} (${metricInfo.primary}: ${m.primary})`),
        `Simulating optimal hyperparameters across ${optunaTrials} Optuna trials`,
        `Champion selected: ${champion.name} (${metricInfo.primary}: ${championTuned})`,
        `Compiling python training and preprocessing pipeline script`,
      ],
      duration: 6500,
    },
    {
      id: 'testing', name: 'Testing',
      tasks: [
        `Running unit testing suite (${unitTests}/${unitTests} passed ✓)`,
        `Running integration tests (${integTests}/${integTests} passed ✓)`,
        `Running edge case validation tests (${edgeTests}/${edgeTests} passed ✓)`,
        `Estimated inference latency: ${inferenceMs}ms ${latencyTarget ? (inferenceMs < latencyTarget ? '✓ (under target)' : '⚠ (over target!)') : '✓'}`,
        `Fairness assessment: ${hasBias ? '⚠ Bias check flagged — adjusting thresholds' : 'Bias check passed ✓'}`,
        `Code coverage score: ${coverage}%`,
      ],
      duration: 3500,
    },
    {
      id: 'deployment', name: 'Deployment',
      tasks: [
        `Generating local Dockerfile configuration`,
        `Compiling python requirements.txt dependencies`,
        `Writing multi-service docker-compose.yml configuration`,
        `Validating cloud packaging format for target: ${resolvedDeployTarget}`,
        `Testing local FastAPI container port binding (${deployPort})`,
        `✓ Workspace code repository successfully compiled!`,
        `✓ Ready for local serving. Execute 'docker-compose up' to serve model.`,
      ],
      duration: 4500,
    },
    {
      id: 'monitoring', name: 'Monitoring',
      tasks: [
        `Configuring Uvicorn service logging & telemetry`,
        `Registering telemetry monitors for ${domainName} workspace`,
        `Drift trigger threshold set to >${settingsDriftThreshold}`,
        `Latency alert baseline configured (P99 < ${baseLatencyP99}ms)`,
        `Error threshold boundary registered (${baseErrorRate}% / max ${settingsErrorThreshold}%)`,
      ],
      duration: 2500,
    },
    {
      id: 'optimization', name: 'Optimization',
      tasks: [
        `Running post-training compression assessment`,
        `Model quantization speedup verified at ${quantizationSpeedup}x`,
        `Registering auto-retrain scheduling parameters`,
      ],
      duration: 2000,
    },
    {
      id: 'learning', name: 'Learning',
      tasks: [
        `Saving optimization insights for ${domainName} domain`,
        `Adding champion ${champion.name} to serving config`,
        `Workspace pipeline generation completed successfully!`,
      ],
      duration: 1500,
    },
  ];

  // ── Summary object returned to context ──────────────────────────
  return {
    config,
    stages,
    results: {
      domain: domainName,
      problemType: problemName,
      champion: {
        name: champion.name,
        family: champion.family,
        metric: metricInfo.primary,
        score: championTuned,
        secondaryMetric: metricInfo.secondary,
        secondaryScore: champion.secondary,
        lowerBetter: isLower,
      },
      allModels: scored.map(m => ({
        name: m.name,
        family: m.family,
        score: m.primary,
        metric: metricInfo.primary,
      })),
      dataQuality: qualityScore,
      columns: colCount,
      rows: rowLabel,
      missingPct: parseFloat(missingPct),
      outliers: outlierCount,
      testCoverage: parseFloat(coverage),
      inferenceMs,
      latencyP99: baseLatencyP99,
      latencyTarget: effectiveLatency,
      errorRate: parseFloat(baseErrorRate),
      errorThreshold: settingsErrorThreshold,
      driftThreshold: settingsDriftThreshold,
      deployTarget: resolvedDeployTarget,
      compliance,
      hasBias,
      quantizationSpeedup: parseFloat(quantizationSpeedup),
      optunaTrials,
    },
  };
}

/**
 * Generate monitoring time-series data based on pipeline results.
 */
export function generateMonitoringData(results, settings = {}) {
  if (!results) return null;

  const baseLatency = results.inferenceMs;
  const baseError = results.errorRate;
  const driftThreshold = results.driftThreshold ?? settings['monitoring.drift_threshold'] ?? 0.1;
  const baseVolume = randInt(200, 800);

  const hours = 24;
  const latencyData = [];
  const errorData = [];
  const volumeData = [];
  const driftData = [];

  for (let i = 0; i < hours; i++) {
    const t = `${String(i).padStart(2, '0')}:00`;
    const spike = Math.random() < 0.08;
    latencyData.push({
      time: t,
      value: parseFloat((baseLatency + rand(-8, 15) + (spike ? rand(10, 30) : 0)).toFixed(1)),
    });
    errorData.push({
      time: t,
      value: parseFloat(Math.max(0, baseError + rand(-0.01, 0.03) + (spike ? rand(0, 0.08) : 0)).toFixed(3)),
    });
    volumeData.push({
      time: t,
      value: Math.max(0, Math.round(baseVolume + rand(-100, 150) * (1 + Math.sin(i / 4) * 0.3))),
    });
    // Keep drift realistic relative to the configured threshold
    driftData.push({
      time: t,
      value: parseFloat(Math.max(0, rand(0.001, driftThreshold * 0.7)).toFixed(4)),
    });
  }

  return { latencyData, errorData, volumeData, driftData };
}
