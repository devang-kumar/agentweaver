import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Cloud, Shield, Bell,
  Database, Cpu, Key, Globe, Save, Check, RotateCcw,
} from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../context/SettingsContext';

const SECTIONS = [
  {
    id: 'cloud', title: 'Cloud & Deployment', icon: Cloud, color: '#00cec9',
    fields: [
      { key: 'provider', label: 'Cloud Provider', type: 'select', options: ['AWS', 'GCP', 'Azure', 'Kubernetes'] },
      { key: 'region', label: 'Region', type: 'select', options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'] },
      { key: 'target', label: 'Deploy Target', type: 'select', options: ['Lambda', 'ECS', 'EKS', 'Edge'] },
      { key: 'autoscale', label: 'Auto-Scaling', type: 'toggle' },
    ],
  },
  {
    id: 'model', title: 'Model Defaults', icon: Cpu, color: '#fd79a8',
    fields: [
      { key: 'trials', label: 'Optuna Trials', type: 'number' },
      { key: 'candidates', label: 'Model Candidates', type: 'number' },
      { key: 'framework', label: 'Default Framework', type: 'select', options: ['Auto', 'XGBoost', 'LightGBM', 'PyTorch', 'TensorFlow'] },
      { key: 'quantize', label: 'Auto-Quantize', type: 'toggle' },
    ],
  },
  {
    id: 'monitoring', title: 'Monitoring & Alerts', icon: Bell, color: '#74b9ff',
    fields: [
      { key: 'latency_target', label: 'Latency Target (ms)', type: 'number' },
      { key: 'error_threshold', label: 'Error Rate Threshold (%)', type: 'number' },
      { key: 'drift_threshold', label: 'Drift Alert Threshold', type: 'number' },
      { key: 'slack', label: 'Slack Notifications', type: 'toggle' },
    ],
  },
  {
    id: 'security', title: 'Security & Compliance', icon: Shield, color: '#00b894',
    fields: [
      { key: 'compliance', label: 'Compliance Mode', type: 'select', options: ['None', 'HIPAA', 'GDPR', 'SOC2', 'PCI-DSS'] },
      { key: 'bias_audit', label: 'Mandatory Bias Audit', type: 'toggle' },
      { key: 'secret_scan', label: 'Secret Scanning', type: 'toggle' },
      { key: 'encryption', label: 'Data Encryption', type: 'toggle' },
    ],
  },
];

export default function Settings() {
  const { settings, saveAll, resetToDefaults } = useSettings();
  // Local draft so we save atomically on button press
  const [draft, setDraft] = useState(() => ({ ...settings }));
  const [saved, setSaved] = useState(false);

  const update = (key, val) => {
    setDraft(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    saveAll(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    resetToDefaults();
    setDraft({ ...DEFAULT_SETTINGS });
    setSaved(false);
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontWeight: 800, marginBottom: 4 }}>
              <span className="gradient-text">Settings</span>
            </h2>
            <p style={{ fontSize: '0.9rem' }}>
              Configure agent defaults, cloud targets, and compliance rules.
              Changes are applied to the <strong>next</strong> pipeline run.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} /> Reset
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── API Keys ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28, borderColor: 'rgba(108,92,231,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(108,92,231,0.3)' }}>
                <Key size={18} color="#a29bfe" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 2 }}>API Keys</h3>
                <p style={{ fontSize: '0.75rem', margin: 0 }}>Keys are stored only in your browser (localStorage). Never shared.</p>
              </div>
            </div>
            {/* Gemini Key */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, display: 'block' }}>
                Gemini API Key —{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#a29bfe' }}>
                  Get free key at aistudio.google.com
                </a>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="password"
                  value={draft['api.geminiKey'] ?? ''}
                  onChange={(e) => update('api.geminiKey', e.target.value)}
                  placeholder="AIza..."
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none',
                  }}
                />
                <div style={{
                  padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
                  background: draft['api.geminiKey']?.trim() ? 'rgba(0,184,148,0.12)' : 'rgba(225,112,85,0.1)',
                  color: draft['api.geminiKey']?.trim() ? '#00b894' : '#e17055',
                  border: `1px solid ${draft['api.geminiKey']?.trim() ? 'rgba(0,184,148,0.25)' : 'rgba(225,112,85,0.2)'}`,
                  display: 'flex', alignItems: 'center', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  {draft['api.geminiKey']?.trim() ? '✓ Key set' : '✗ No key'}
                </div>
              </div>
            </div>

            {/* GitHub Key */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Globe size={16} color="#00cec9" />
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>GitHub Integration & Deployment</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, display: 'block' }}>GitHub Username</label>
                  <input
                    type="text"
                    value={draft['api.githubUser'] ?? ''}
                    onChange={(e) => update('api.githubUser', e.target.value)}
                    placeholder="e.g. octocat"
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, display: 'block' }}>GitHub Target Repo</label>
                  <input
                    type="text"
                    value={draft['api.githubRepo'] ?? 'agentweaver-deploy'}
                    onChange={(e) => update('api.githubRepo', e.target.value)}
                    placeholder="agentweaver-deploy"
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, display: 'block' }}>
                  GitHub Personal Access Token (PAT) —{' '}
                  <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" style={{ color: '#00cec9' }}>
                    Generate Token (needs 'repo' scope)
                  </a>
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="password"
                    value={draft['api.githubToken'] ?? ''}
                    onChange={(e) => update('api.githubToken', e.target.value)}
                    placeholder="ghp_..."
                    style={{
                      flex: 1, padding: '10px 14px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                  <div style={{
                    padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
                    background: draft['api.githubToken']?.trim() ? 'rgba(0,184,148,0.12)' : 'rgba(225,112,85,0.1)',
                    color: draft['api.githubToken']?.trim() ? '#00b894' : '#e17055',
                    border: `1px solid ${draft['api.githubToken']?.trim() ? 'rgba(0,184,148,0.25)' : 'rgba(225,112,85,0.2)'}`,
                    display: 'flex', alignItems: 'center', fontWeight: 600, whiteSpace: 'nowrap',
                  }}>
                    {draft['api.githubToken']?.trim() ? '✓ Token set' : '✗ No token'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Other sections ── */}
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.id}

                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card" style={{ padding: 28 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${s.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${s.color}25`,
                  }}>
                    <Icon size={18} color={s.color} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.title}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                  {s.fields.map((f) => {
                    const fk = `${s.id}.${f.key}`;
                    const val = draft[fk] ?? DEFAULT_SETTINGS[fk];

                    if (f.type === 'toggle') {
                      return (
                        <div key={fk} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.label}</span>
                          <button
                            onClick={() => update(fk, !val)}
                            style={{
                              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                              background: val ? s.color : 'var(--bg-tertiary)',
                              position: 'relative', transition: 'background var(--transition-fast)',
                            }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%', background: 'white',
                              position: 'absolute', top: 3,
                              left: val ? 23 : 3,
                              transition: 'left var(--transition-fast)',
                            }} />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={fk}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, display: 'block' }}>{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={val}
                            onChange={(e) => update(fk, e.target.value)}
                            style={{
                              width: '100%', padding: '10px 14px',
                              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                              fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => update(fk, Number(e.target.value))}
                            style={{
                              width: '100%', padding: '10px 14px',
                              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                              fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

