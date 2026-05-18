import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';
import { AGENT_DEFINITIONS, AGENT_COUNT } from '../config/agents';
import {
  Rocket, Play, Clock, CheckCircle2,
  Bot, Zap, ArrowRight, TrendingUp, Activity,
} from 'lucide-react';

const statusColors = {
  completed: { bg: 'rgba(0,184,148,0.12)', color: '#00b894', border: 'rgba(0,184,148,0.25)' },
  running: { bg: 'rgba(108,92,231,0.12)', color: '#a29bfe', border: 'rgba(108,92,231,0.25)' },
  queued: { bg: 'rgba(139,141,163,0.12)', color: '#8b8da3', border: 'rgba(139,141,163,0.25)' },
  failed: { bg: 'rgba(225,112,85,0.12)', color: '#e17055', border: 'rgba(225,112,85,0.25)' },
};

// Re-use shared agent definitions instead of duplicating the list
const agentStatuses = AGENT_DEFINITIONS;

export default function Dashboard() {
  const navigate = useNavigate();
  const { pipelines, activePipeline, latestResults } = usePipeline();
  const [problem, setProblem] = useState('');

  const handleLaunch = () => {
    if (problem.trim()) {
      navigate('/pipeline', { state: { problem } });
    }
  };

  // Build dynamic stats from actual pipeline data
  const completedCount = pipelines.filter(p => p.status === 'completed').length;
  const hasActive = !!activePipeline;

  const avgAccuracy = completedCount > 0
    ? (pipelines.reduce((sum, p) => {
        const s = p.results?.champion?.score || 0;
        return sum + (p.results?.champion?.lowerBetter ? (1 - s) * 100 : s * 100);
      }, 0) / completedCount).toFixed(1) + '%'
    : '—';

  const quickStats = [
    { label: 'Pipelines Run', value: String(completedCount + (hasActive ? 1 : 0)), icon: Zap, color: '#6c5ce7', change: hasActive ? '1 running now' : completedCount > 0 ? `${completedCount} completed` : 'None yet' },
    { label: 'Models Deployed', value: String(completedCount), icon: Rocket, color: '#00b894', change: completedCount > 0 ? 'Latest: ' + (pipelines[0]?.results?.champion?.name || '—') : 'Run a pipeline first' },
    { label: 'Best Score', value: latestResults ? `${latestResults.champion.score}` : '—', icon: TrendingUp, color: '#fd79a8', change: latestResults ? `${latestResults.champion.metric} (${latestResults.champion.name})` : 'No data yet' },
    { label: 'Agent Fleet', value: String(AGENT_COUNT), icon: Activity, color: '#00cec9', change: hasActive ? 'Agents working' : 'All idle' },
  ];

  // Pipeline history + active
  const allPipelines = [
    ...(activePipeline ? [{
      id: activePipeline.id,
      name: activePipeline.config.raw.slice(0, 50) + (activePipeline.config.raw.length > 50 ? '…' : ''),
      domain: activePipeline.results.domain,
      status: 'running',
      accuracy: '—',
      time: 'In progress',
      champion: '—',
    }] : []),
    ...pipelines.map(p => ({
      id: p.id,
      name: p.config.raw.slice(0, 50) + (p.config.raw.length > 50 ? '…' : ''),
      domain: p.results.domain,
      status: p.status,
      accuracy: p.results.champion.lowerBetter
        ? `${p.results.champion.score} ${p.results.champion.metric}`
        : `${(p.results.champion.score * 100).toFixed(1)}%`,
      time: p.completedAt ? `${Math.round((p.completedAt - p.startedAt) / 1000)}s` : '—',
      champion: p.results.champion.name,
    })),
  ];

  // Determine agent status based on active pipeline
  const getAgentStatus = (name) => {
    if (!hasActive) return { label: 'idle', color: '#8b8da3' };
    return { label: 'active', color: '#00b894' };
  };

  return (
    <div className="page-container">
      {/* Welcome + Quick Launch */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 4 }}>
            Welcome to <span className="gradient-text">AgentWeaver</span>
          </h2>
          <p style={{ fontSize: '0.95rem' }}>Describe a data science problem and let the agents handle everything.</p>
        </div>

        {/* Input Card */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Bot size={20} style={{ color: 'var(--accent-primary-light)', marginTop: 2 }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 4 }}>New Pipeline</h4>
              <p style={{ fontSize: '0.8rem' }}>Describe your ML problem — domain, data, deployment target, constraints. The parser will auto-detect everything.</p>
            </div>
          </div>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder={"Try different inputs:\n• \"Predict customer churn using 500K rows of CRM data, deploy on AWS Lambda, HIPAA compliant\"\n• \"Forecast daily sales for next 90 days using 2 years of e-commerce data (1M records), deploy on GCP\"\n• \"Detect fraudulent transactions in real-time, 10M banking records, <50ms latency, PCI-DSS\"\n• \"Segment users into personas using clickstream data with 200K records and 45 features\""}
            style={{
              width: '100%', minHeight: 110, padding: 16,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
              resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Parser auto-detects: domain, problem type, data size, deploy target, compliance, latency
            </div>
            <button className="btn btn-primary" onClick={handleLaunch} disabled={!problem.trim()}>
              <Play size={16} /> Launch Pipeline
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}
      >
        {quickStats.map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${s.color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${s.color}25`,
              }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontWeight: 500 }}>{s.change}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Pipelines Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontWeight: 700 }}>Pipeline History</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{allPipelines.length} total</span>
            </div>
            {allPipelines.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No pipelines yet. Describe a problem above and hit "Launch Pipeline".
              </div>
            ) : (
              <div>
                {allPipelines.map((p) => {
                  const sc = statusColors[p.status] || statusColors.queued;
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {p.domain} {p.champion && p.champion !== '—' ? `· ${p.champion}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        {p.accuracy !== '—' && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-success)' }}>{p.accuracy}</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          <Clock size={11} /> {p.time}
                        </div>
                        <span style={{
                          padding: '4px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '0.68rem', fontWeight: 600,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          textTransform: 'capitalize',
                        }}>{p.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Agent Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontWeight: 700 }}>Agent Fleet</h4>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {agentStatuses.map((a, i) => {
                const st = getAgentStatus(a.name);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${a.color}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <a.icon size={15} color={a.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{a.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color }} />
                      <span style={{ fontSize: '0.7rem', fontWeight: 500, color: st.color, textTransform: 'capitalize' }}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
