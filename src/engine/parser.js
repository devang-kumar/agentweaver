/**
 * AgentWeaver Problem Parser
 * Extracts structured information from natural-language problem descriptions.
 */

const DOMAIN_KEYWORDS = {
  finance: ['finance', 'financial', 'banking', 'bank', 'credit', 'loan', 'stock', 'trading', 'portfolio', 'investment', 'fraud', 'transaction', 'payment', 'fintech', 'insurance', 'risk', 'revenue', 'pricing'],
  healthcare: ['health', 'healthcare', 'medical', 'patient', 'clinical', 'hospital', 'disease', 'diagnosis', 'drug', 'pharma', 'genomic', 'radiology', 'ehr', 'hipaa', 'mortality', 'readmission'],
  ecommerce: ['ecommerce', 'e-commerce', 'retail', 'product', 'customer', 'shopping', 'cart', 'purchase', 'recommendation', 'catalog', 'inventory', 'order', 'marketplace', 'shopify'],
  iot: ['iot', 'sensor', 'device', 'telemetry', 'edge', 'embedded', 'arduino', 'raspberry', 'temperature', 'humidity', 'vibration', 'predictive maintenance', 'anomaly detection', 'manufacturing'],
  marketing: ['marketing', 'campaign', 'conversion', 'click', 'engagement', 'audience', 'segmentation', 'ad', 'advertising', 'social media', 'email', 'newsletter', 'retention'],
  nlp: ['text', 'nlp', 'language', 'sentiment', 'chatbot', 'summarization', 'translation', 'ner', 'named entity', 'topic', 'document', 'review', 'comment', 'tweet'],
  cv: ['image', 'vision', 'object detection', 'segmentation', 'face', 'video', 'camera', 'ocr', 'photo', 'visual', 'cnn', 'yolo', 'resnet'],
  hr: ['employee', 'attrition', 'hiring', 'resume', 'hr', 'human resource', 'talent', 'workforce', 'salary', 'performance review'],
};

const PROBLEM_KEYWORDS = {
  classification: ['classification', 'classify', 'predict', 'churn', 'fraud', 'spam', 'detection', 'binary', 'multiclass', 'categorize', 'label', 'yes or no', 'true or false', 'positive or negative', 'diagnosis', 'default'],
  regression: ['regression', 'price', 'forecast price', 'estimate', 'continuous', 'predict value', 'how much', 'salary prediction', 'house price', 'cost', 'revenue prediction', 'demand prediction', 'housing prediction', 'house price prediction', 'valuation', 'property value'],
  clustering: ['clustering', 'cluster', 'segment', 'group', 'unsupervised', 'k-means', 'dbscan', 'cohort', 'persona'],
  forecasting: ['forecast', 'time series', 'timeseries', 'predict future', 'trend', 'seasonal', 'arima', 'prophet', 'stock price', 'demand forecast', 'sales forecast'],
  recommendation: ['recommend', 'recommendation', 'collaborative', 'content-based', 'suggest', 'personalize'],
  anomaly: ['anomaly', 'outlier', 'unusual', 'abnormal', 'intrusion', 'fault detection'],
  nlp: ['sentiment', 'text classification', 'summarize', 'translate', 'chatbot', 'ner', 'topic model'],
  cv: ['object detection', 'image classification', 'segmentation', 'face recognition', 'ocr'],
};

const DEPLOY_KEYWORDS = {
  'AWS Lambda': ['aws lambda', 'lambda', 'serverless aws'],
  'AWS ECS': ['ecs', 'aws ecs', 'fargate'],
  'AWS EKS': ['eks', 'aws eks'],
  'AWS SageMaker': ['sagemaker', 'sage maker'],
  'GCP Cloud Run': ['cloud run', 'gcp', 'google cloud'],
  'GCP Vertex AI': ['vertex', 'vertex ai'],
  'Azure ML': ['azure', 'azure ml'],
  'Kubernetes': ['kubernetes', 'k8s', 'kubectl', 'helm'],
  'Edge Device': ['edge', 'embedded', 'raspberry pi', 'arduino', 'jetson', 'mobile', 'on-device'],
  'Docker': ['docker', 'container'],
};

const COMPLIANCE_KEYWORDS = {
  HIPAA: ['hipaa', 'healthcare compliance', 'phi', 'protected health'],
  GDPR: ['gdpr', 'european', 'data protection', 'right to forget'],
  'SOC2': ['soc2', 'soc 2', 'security compliance'],
  'PCI-DSS': ['pci', 'pci-dss', 'payment card', 'card data'],
  'FDA': ['fda', 'food and drug', 'medical device'],
};

function matchKeywords(text, keywordMap) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(keywordMap)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.split(' ').length; // multi-word matches score higher
      }
    }
    if (score > 0) scores[category] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

function matchAllKeywords(text, keywordMap) {
  const lower = text.toLowerCase();
  const matches = [];

  for (const [category, keywords] of Object.entries(keywordMap)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matches.push(category);
        break;
      }
    }
  }
  return matches;
}

function extractDataSize(text) {
  const lower = text.toLowerCase();

  // Match patterns like "500K rows", "1M records", "10000 samples", "2GB"
  const sizePatterns = [
    { regex: /(\d+(?:\.\d+)?)\s*m(?:illion)?\s*(?:rows|records|samples|data\s*points|entries)/i, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*k\s*(?:rows|records|samples|data\s*points|entries)/i, multiplier: 1000 },
    { regex: /(\d+(?:,\d{3})*)\s*(?:rows|records|samples|data\s*points|entries)/i, multiplier: 1 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:gb|gigabyte)/i, multiplier: -1 }, // flag as GB
    { regex: /(\d+(?:\.\d+)?)\s*(?:tb|terabyte)/i, multiplier: -2 }, // flag as TB
  ];

  for (const { regex, multiplier } of sizePatterns) {
    const match = text.match(regex);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (multiplier === -1) return { rows: null, sizeGB: num, label: `${num}GB` };
      if (multiplier === -2) return { rows: null, sizeGB: num * 1000, label: `${num}TB` };
      const rows = Math.round(num * multiplier);
      return { rows, sizeGB: null, label: formatNumber(rows) + ' rows' };
    }
  }

  // Check for just number mentions with "data" nearby
  const genericMatch = lower.match(/(\d+(?:,\d{3})+|\d{4,})\s*(?:data|point|sample|row|record|observation)/);
  if (genericMatch) {
    const rows = parseInt(genericMatch[1].replace(/,/g, ''));
    return { rows, sizeGB: null, label: formatNumber(rows) + ' rows' };
  }

  return { rows: null, sizeGB: null, label: 'Unknown' };
}

function extractLatency(text) {
  const match = text.match(/<?(\d+)\s*ms/i);
  if (match) return parseInt(match[1]);

  if (text.toLowerCase().includes('real-time') || text.toLowerCase().includes('realtime')) return 50;
  if (text.toLowerCase().includes('low latency')) return 100;
  if (text.toLowerCase().includes('batch')) return 5000;

  return null;
}

function extractColumns(text) {
  const match = text.match(/(\d+)\s*(?:columns|features|variables|attributes)/i);
  return match ? parseInt(match[1]) : null;
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

/**
 * Main parser function — takes raw problem text and returns structured config.
 */
export function parseProblem(text) {
  if (!text || !text.trim()) return null;

  const domain = matchKeywords(text, DOMAIN_KEYWORDS) || 'general';
  const problemType = matchKeywords(text, PROBLEM_KEYWORDS) || 'classification';
  const deployTarget = matchKeywords(text, DEPLOY_KEYWORDS) || 'Docker';
  const compliance = matchAllKeywords(text, COMPLIANCE_KEYWORDS);
  const dataSize = extractDataSize(text);
  const latencyTarget = extractLatency(text);
  const columns = extractColumns(text);

  return {
    domain,
    problemType,
    deployTarget,
    compliance,
    dataSize,
    latencyTarget,
    columns,
    raw: text,
  };
}

export function domainLabel(d) {
  const labels = {
    finance: 'Finance',
    healthcare: 'Healthcare',
    ecommerce: 'E-Commerce',
    iot: 'IoT / Manufacturing',
    marketing: 'Marketing',
    nlp: 'NLP / Text',
    cv: 'Computer Vision',
    hr: 'Human Resources',
    general: 'General',
  };
  return labels[d] || d;
}

export function problemLabel(p) {
  const labels = {
    classification: 'Classification',
    regression: 'Regression',
    clustering: 'Clustering',
    forecasting: 'Time-Series Forecasting',
    recommendation: 'Recommendation',
    anomaly: 'Anomaly Detection',
    nlp: 'NLP',
    cv: 'Computer Vision',
  };
  return labels[p] || p;
}
