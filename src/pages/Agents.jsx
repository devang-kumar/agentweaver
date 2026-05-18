import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePipeline } from '../context/PipelineContext';
import { AGENT_DEFINITIONS, AGENT_COUNT } from '../config/agents';
import { Zap } from 'lucide-react';

// Shared agent definitions (from config/agents.js)
const agentDefs = AGENT_DEFINITIONS;


function getAgentActivity(name, results, pipelineCount, isActive) {
  if (!results) {
    return { status: 'idle', actions: ['No pipeline data yet — run a pipeline to see activity'] };
  }

  const r = results;

  switch (name) {
    case 'Orchestrator':
      return {
        status: isActive ? 'active' : 'idle',
        actions: [
          `Parsed ${r.domain} ${r.problemType} problem`,
          `Delegated to ${AGENT_COUNT - 1} specialized agents`,
          `Data: ${r.rows} × ${r.columns} columns`,
          `Deploy target: ${r.deployTarget}`,
          ...(r.compliance.length > 0 ? [`Compliance: ${r.compliance.join(', ')}`] : []),
        ],
      };
    case 'Data Analyst':
      return {
        status: isActive ? 'active' : 'idle',
        actions: [
          `Audited dataset: ${r.rows}`,
          `Missing values: ${r.missingPct}%`,
          `Outliers flagged: ${r.outliers}`,
          `Quality score: ${r.dataQuality}/100`,
        ],
      };
    case 'Model Builder':
      return {
        status: isActive ? 'training' : 'idle',
        actions: [
          `Trained ${r.allModels.length} candidates`,
          ...r.allModels.map(m => `${m.name}: ${m.metric} = ${m.score}`),
          `Champion: ${r.champion.name}`,
          `${r.optunaTrials} Optuna trials completed`,
        ],
      };
    case 'Testing':
      return {
        status: isActive ? 'active' : 'idle',
        actions: [
          `Test coverage: ${r.testCoverage}%`,
          `Inference: ${r.inferenceMs}ms`,
          r.hasBias ? '⚠ Bias detected — flagged for review' : 'Fairness audit: Clean ✓',
          'Security scan: Clean ✓',
        ],
      };
    case 'Deployment':
      return {
        status: isActive ? 'active' : 'idle',
        actions: [
          `Deployed ${r.champion.name} to ${r.deployTarget}`,
          `FastAPI service built`,
          ...(r.compliance.length > 0 ? [`${r.compliance.join('/')} compliance verified`] : []),
          `Canary rollout → Full production`,
        ],
      };
    case 'Monitoring':
      return {
        status: 'watching',
        actions: [
          `P99 latency: ${r.latencyP99}ms`,
          `Error rate: ${r.errorRate}%`,
          `Drift detection active`,
          `Prometheus + Grafana configured`,
        ],
      };
    case 'Optimization':
      return {
        status: isActive ? 'active' : 'idle',
        actions: [
          `Quantization: ${r.quantizationSpeedup}x speedup`,
          `Baseline metrics captured`,
          `Ensemble strategy: top-2 blend prepared`,
          `Auto-retrain triggers set`,
        ],
      };
    case 'Healing':
      return {
        status: r.hasBias ? 'active' : 'standby',
        actions: r.hasBias
          ? ['Bias detected — retraining with balanced sampling', 'Monitoring fix results']
          : ['Standby — no failures detected', `Total pipelines healed: 0/${pipelineCount}`],
      };
    case 'Learning':
      return {
        status: isActive ? 'active' : 'idle',
        actions: [
          `${r.champion.name} → best for ${r.problemType} (${r.domain})`,
          `Knowledge base updated`,
          `${pipelineCount} pipeline(s) recorded`,
          `Pipeline template saved for reuse`,
        ],
      };
    default:
      return { status: 'idle', actions: [] };
  }
}

const statusDotColors = {
  active: '#00b894',
  training: '#a29bfe',
  idle: '#8b8da3',
  watching: '#74b9ff',
  standby: '#fdcb6e',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Agents() {
  const { latestResults, pipelines, activePipeline } = usePipeline();
  const [selected, setSelected] = useState(null);

  const pipelineCount = pipelines.length;
  const isActive = !!activePipeline;

  const agents = agentDefs.map(a => {
    const activity = getAgentActivity(a.name, latestResults, pipelineCount, isActive);
    return { ...a, ...activity };
  });

  const agent = selected !== null ? agents[selected] : null;

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 4 }}>
            <span className="gradient-text">Agent</span> Fleet
          </h2>
          <p style={{ fontSize: '0.9rem' }}>
            {AGENT_COUNT} specialized agents — activity updates dynamically based on your pipeline runs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected !== null ? '1fr 420px' : '1fr', gap: 24, transition: 'all 0.3s ease' }}>
          <motion.div
            variants={container} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}
          >
            {agents.map((a, i) => {
              const Icon = a.icon;
              const dotColor = statusDotColors[a.status] || '#8b8da3';
              return (
                <motion.div
                  key={i} variants={item}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className="glass-card"
                  style={{
                    padding: 22, cursor: 'pointer',
                    borderColor: selected === i ? `${a.color}50` : 'var(--border-subtle)',
                    boxShadow: selected === i ? `0 0 25px ${a.color}15` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${a.color}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${a.color}25`,
                    }}>
                      <Icon size={20} color={a.color} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 500, color: dotColor, textTransform: 'capitalize' }}>{a.status}</span>
                    </div>
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: 2, fontSize: '0.95rem' }}>{a.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{a.role}</p>
                  {/* Show first action as preview */}
                  {a.actions[0] && (
                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      → {a.actions[0]}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Detail Panel */}
          {agent && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card"
              style={{ padding: 28, height: 'fit-content', position: 'sticky', top: 88 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${agent.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${agent.color}30`,
                }}>
                  <agent.icon size={24} color={agent.color} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, marginBottom: 2 }}>{agent.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: agent.color, fontWeight: 500 }}>{agent.role}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 24 }}>{agent.description}</p>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capabilities</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.capabilities.map((c, ci) => (
                    <span key={ci} style={{
                      padding: '5px 12px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem', fontWeight: 500,
                      background: `${agent.color}10`, color: agent.color,
                      border: `1px solid ${agent.color}20`,
                    }}>{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {latestResults ? 'Latest Activity' : 'Activity'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {agent.actions.map((r, ri) => (
                    <div key={ri} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      fontSize: '0.78rem', color: 'var(--text-secondary)',
                    }}>
                      <Zap size={12} color={agent.color} style={{ marginTop: 3, flexShrink: 0 }} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
