/**
 * Single source of truth for AgentWeaver agent definitions.
 * Used by Dashboard, Agents page, Landing, Layout, and simulator.
 */
import {
  Brain, Database, Cpu, TestTube, Rocket, Eye,
  Sparkles, RefreshCw, BarChart3,
} from 'lucide-react';

export const AGENT_DEFINITIONS = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    icon: Brain,
    color: '#6c5ce7',
    role: 'CEO / Decision Maker',
    description:
      'Parses problem statements, identifies domain/problem type, delegates tasks to specialized agents, and coordinates the entire pipeline lifecycle.',
    capabilities: [
      'Problem Parsing', 'Domain Detection', 'Task Delegation',
      'Pipeline Coordination', 'Escalation Management',
    ],
    landingDesc:
      'CEO agent that parses problems, delegates tasks, and coordinates the entire pipeline.',
  },
  {
    id: 'data',
    name: 'Data Analyst',
    icon: Database,
    color: '#00cec9',
    role: 'Data Expert',
    description:
      'Fetches, audits, and cleans datasets. Checks for missing values, outliers, distributions, correlations, and generates domain-specific quality scores.',
    capabilities: [
      'Data Fetching', 'Quality Auditing', 'Outlier Detection',
      'Feature Analysis', 'Cleaning Strategies',
    ],
    landingDesc:
      'Fetches, audits, and cleans datasets. Generates quality scores and domain insights.',
  },
  {
    id: 'model',
    name: 'Model Builder',
    icon: Cpu,
    color: '#fd79a8',
    role: 'ML Specialist',
    description:
      'Generates multiple model candidates, trains in parallel, runs hyperparameter optimization using Optuna, and selects the champion model.',
    capabilities: [
      'Multi-Model Generation', 'Parallel Training',
      'Hyperparameter Optimization', 'Model Selection', 'Pipeline Code Generation',
    ],
    landingDesc:
      'Generates 3–5 model candidates, trains in parallel, runs hyperparameter optimization.',
  },
  {
    id: 'testing',
    name: 'Testing',
    icon: TestTube,
    color: '#fdcb6e',
    role: 'QA / Validation',
    description:
      'Creates comprehensive tests (unit, integration, edge case), performance benchmarks, fairness/bias audits, and security scans.',
    capabilities: [
      'Unit Tests', 'Integration Tests', 'Performance Benchmarks',
      'Fairness Audits', 'Security Scans',
    ],
    landingDesc:
      'Creates unit/integration/edge-case tests. Runs fairness audits and security scans.',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    icon: Rocket,
    color: '#00b894',
    role: 'Ops / Infrastructure',
    description:
      'Generates Dockerfiles, creates FastAPI services, deploys to cloud targets with canary rollouts, load balancers, and rollback procedures.',
    capabilities: [
      'Docker Generation', 'API Service Creation', 'Cloud Deployment',
      'Canary Rollouts', 'Rollback Procedures',
    ],
    landingDesc:
      'Generates Dockerfiles, FastAPI services, deploys to AWS/GCP/K8s with canary rollouts.',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    icon: Eye,
    color: '#74b9ff',
    role: 'Surveillance / Alerts',
    description:
      'Sets up Prometheus/Grafana dashboards and CloudWatch alerts. Tracks drift, latency, error rates, and resource utilization.',
    capabilities: [
      'Metric Tracking', 'Dashboard Creation', 'Alert Configuration',
      'Drift Detection', 'Anomaly Detection',
    ],
    landingDesc:
      'Sets up Prometheus/Grafana dashboards. Tracks drift, latency, error rates in real-time.',
  },
  {
    id: 'optimization',
    name: 'Optimization',
    icon: Sparkles,
    color: '#e17055',
    role: 'Performance Tuning',
    description:
      'Continuously monitors performance and triggers retraining. Runs re-optimization, feature engineering, ensemble methods, and model quantization.',
    capabilities: [
      'Auto-Retrain', 'Feature Engineering', 'Ensemble Methods',
      'Model Quantization', 'Speed Optimization',
    ],
    landingDesc:
      'Continuously tunes models, attempts ensembles, quantizes for speed.',
  },
  {
    id: 'healing',
    name: 'Healing',
    icon: RefreshCw,
    color: '#ff6b6b',
    role: 'Auto-Fix',
    description:
      'Automatically fixes failures by retraining with different hyperparameters, removing bad data, adjusting preprocessing, or trying alternative architectures.',
    capabilities: [
      'Auto-Retrain', 'Data Correction', 'Preprocessing Fixes',
      'Architecture Fallbacks', 'Graceful Recovery',
    ],
    landingDesc:
      'Auto-fixes failures: retrains, adjusts preprocessing, tries fallback architectures.',
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: BarChart3,
    color: '#a29bfe',
    role: 'Knowledge Extraction',
    description:
      'Extracts patterns about what worked for each domain/problem type, which techniques were most impactful, and stores knowledge for future use.',
    capabilities: [
      'Pattern Extraction', 'Knowledge Storage', 'Domain Insights',
      'Template Generation', 'Recommendation Engine',
    ],
    landingDesc:
      'Extracts patterns from results to improve future recommendations across domains.',
  },
];

export const AGENT_COUNT = AGENT_DEFINITIONS.length;
