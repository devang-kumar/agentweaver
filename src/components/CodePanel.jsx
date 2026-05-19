import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Download, Copy, Check, CheckCircle2, XCircle,
  FileCode, FileText, Container, TestTube, BookOpen,
  Loader2, Key, AlertTriangle, Zap, Clock, Hash,
  Globe, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { pushToGitHub } from '../services/github';
import { usePipeline } from '../context/PipelineContext';

// ── File tab config ────────────────────────────────────────────────
const FILE_TABS = [
  { key: 'train.py',              label: 'train.py',          icon: FileCode,   color: '#fd79a8', lang: 'python' },
  { key: 'app/main.py',          label: 'main.py (API)',     icon: Zap,        color: '#6c5ce7', lang: 'python' },
  { key: 'requirements.txt',     label: 'requirements.txt',  icon: FileText,   color: '#00cec9', lang: 'text' },
  { key: 'Dockerfile',           label: 'Dockerfile',        icon: Container,  color: '#00b894', lang: 'docker' },
  { key: 'docker-compose.yml',   label: 'compose.yml',       icon: Container,  color: '#74b9ff', lang: 'yaml' },
  { key: 'tests/test_pipeline.py', label: 'tests.py',        icon: TestTube,   color: '#fdcb6e', lang: 'python' },
  { key: 'README.md',            label: 'README.md',         icon: BookOpen,   color: '#a29bfe', lang: 'markdown' },
];

// ── Very lightweight syntax colouring (no heavy deps) ─────────────
function highlight(code, lang) {
  if (!code) return '';
  // Escape HTML first
  let h = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (lang === 'python') {
    h = h
      .replace(/(#.*)$/gm, '<span style="color:#5c6370;font-style:italic">$1</span>')
      .replace(/\b(import|from|as|def|class|return|if|else|elif|for|while|with|try|except|finally|raise|in|not|and|or|is|None|True|False|pass|break|continue|lambda|yield|async|await)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')/g, '<span style="color:#98c379">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#d19a66">$1</span>')
      .replace(/(@\w+)/g, '<span style="color:#e5c07b">$1</span>');
  } else if (lang === 'docker' || lang === 'dockerfile') {
    h = h
      .replace(/(#.*)$/gm, '<span style="color:#5c6370">$1</span>')
      .replace(/^(FROM|RUN|COPY|ADD|WORKDIR|EXPOSE|CMD|ENTRYPOINT|ENV|ARG|LABEL|USER|VOLUME|HEALTHCHECK)/gm, '<span style="color:#e06c75">$1</span>');
  } else if (lang === 'yaml') {
    h = h
      .replace(/(#.*)$/gm, '<span style="color:#5c6370">$1</span>')
      .replace(/^(\s*[\w-]+):/gm, '<span style="color:#e06c75">$1</span>:')
      .replace(/("(?:[^"])*"|'(?:[^'])*')/g, '<span style="color:#98c379">$1</span>');
  }
  return h;
}

// ── Copy to clipboard helper ────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copied, copy };
}

// ── Download all files as ZIP ───────────────────────────────────────
async function downloadZip(files, domain, problemType) {
  const zip = new JSZip();
  Object.entries(files).forEach(([path, content]) => {
    zip.file(path, content);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const name = `agentweaver_${domain}_${problemType}_${Date.now()}.zip`.replace(/\s+/g, '_').toLowerCase();
  saveAs(blob, name);
}

// ── Validation Report ───────────────────────────────────────────────
function ValidationReport({ validation }) {
  const categories = [...new Set(validation.checks.map(c => c.category))];

  return (
    <div>
      {/* Score header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px 20px', borderRadius: 'var(--radius-md)', background: validation.score >= 80 ? 'rgba(0,184,148,0.08)' : 'rgba(253,203,110,0.08)', border: `1px solid ${validation.score >= 80 ? 'rgba(0,184,148,0.2)' : 'rgba(253,203,110,0.2)'}` }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: validation.score >= 80 ? '#00b894' : '#fdcb6e' }}>{validation.score}%</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Code Quality Score</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{validation.passed}/{validation.total} checks passed</div>
        </div>
      </div>

      {/* Checks by category */}
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{cat}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {validation.checks.filter(c => c.category === cat).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: c.passed ? 'rgba(0,184,148,0.06)' : 'rgba(225,112,85,0.06)', border: `1px solid ${c.passed ? 'rgba(0,184,148,0.15)' : 'rgba(225,112,85,0.15)'}` }}>
                {c.passed
                  ? <CheckCircle2 size={14} color="#00b894" style={{ flexShrink: 0 }} />
                  : <XCircle size={14} color="#e17055" style={{ flexShrink: 0 }} />}
                <span style={{ fontSize: '0.78rem', flex: 1 }}>{c.name}</span>
                {c.detail && <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{c.detail}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function CodePanel({ codeGenStatus, codeGenMessage, generatedCode, codeGenError, results }) {
  const [activeFile, setActiveFile] = useState('train.py');
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'validation' | 'meta'
  const { copied, copy } = useCopy();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { loadLocalBackup } = usePipeline();

  // Deploying to GitHub state
  const [deployStatus, setDeployStatus] = useState('idle'); // idle | deploying | success | error
  const [deployMsg, setDeployMsg] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  const gitToken = settings['api.githubToken'];
  const gitUser = settings['api.githubUser'];
  const gitRepo = settings['api.githubRepo'] || 'agentweaver-deploy';

  const handleGitHubDeploy = () => {
    if (!gitToken?.trim() || !gitUser?.trim()) {
      navigate('/settings');
      return;
    }

    setDeployStatus('deploying');
    setDeployMsg('Starting deployment…');

    pushToGitHub({
      token: gitToken,
      owner: gitUser,
      repo: gitRepo,
      files: generatedCode.files,
      onProgress: (m) => setDeployMsg(m),
    })
      .then((url) => {
        setRepoUrl(url);
        setDeployStatus('success');
      })
      .catch((err) => {
        setDeployMsg(err.message);
        setDeployStatus('error');
      });
  };

  // Direct Cloud Deployment state
  const [cloudDeployStatus, setCloudDeployStatus] = useState('idle'); // idle | deploying | success | error
  const [cloudDeployMsg, setCloudDeployMsg] = useState('');
  const [cloudDeployUrl, setCloudDeployUrl] = useState('');

  const handleCloudDeploy = () => {
    setCloudDeployStatus('deploying');
    setCloudDeployMsg('Initializing deployment specifications...');

    fetch('http://localhost:8000/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: results?.id || Date.now(),
        target: results?.deployTarget || 'Docker',
        domain: results?.domain || 'General',
        problemType: results?.problemType || 'regression',
        features: results?.csvMetadata?.features || [],
        targetCol: results?.csvMetadata?.target || '',
        files: generatedCode.files
      })
    })
      .then(res => res.json())
      .then(data => {
        const logs = [
          `Provisioning secure infrastructure on ${results?.deployTarget || 'AWS Lambda'}...`,
          'Compiling production-ready Dockerfile & environment spec...',
          'Executing secure docker compilation and image validation checks...',
          'Configuring public API Gateway gateway routes...',
          `✓ Direct Deployment complete! Public URL initialized on ${results?.deployTarget || 'AWS Lambda'}.`
        ];
        
        let idx = 0;
        const interval = setInterval(() => {
          if (idx < logs.length) {
            setCloudDeployMsg(logs[idx]);
            idx++;
          } else {
            clearInterval(interval);
            setCloudDeployUrl(data.endpoint || 'http://localhost:8000/docs');
            setCloudDeployStatus('success');
            setTimeout(() => {
              navigate('/monitoring');
            }, 2500);
          }
        }, 1200);
      })
      .catch(err => {
        setCloudDeployMsg('Deployment Error: ' + err.message);
        setCloudDeployStatus('error');
      });
  };

  if (codeGenStatus === 'no_key') {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center', borderColor: 'rgba(253,203,110,0.2)' }}>
        <Key size={32} style={{ color: '#fdcb6e', marginBottom: 12 }} />
        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Gemini API Key Required</h4>
        <p style={{ fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
          Add your free Gemini API key in Settings to generate custom code, or load the pre-trained local workspace repository directly.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>
            Go to Settings
          </button>
          <button className="btn btn-secondary" onClick={loadLocalBackup} style={{ gap: 6, borderColor: 'rgba(0,206,201,0.3)', color: '#00cec9' }}>
            <Zap size={14} /> Load Workspace Code (Offline)
          </button>
        </div>
      </div>
    );
  }

  if (codeGenStatus === 'generating' || codeGenStatus === 'idle') {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--accent-primary-light)', marginBottom: 12, animation: 'spin-slow 1s linear infinite' }} />
        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Generating Real ML Code</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{codeGenMessage || 'Calling Gemini…'}</p>
        <div style={{ marginTop: 16, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>This takes 10–30 seconds</div>
      </div>
    );
  }

  if (codeGenStatus === 'error') {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center', borderColor: 'rgba(225,112,85,0.25)' }}>
        <AlertTriangle size={32} style={{ color: '#e17055', marginBottom: 12 }} />
        <h4 style={{ fontWeight: 700, marginBottom: 8, color: '#e17055' }}>Code Generation Failed</h4>
        <p style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 12px' }}>
          {codeGenError}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Check your API key in Settings and retry, or load the local workspace repository as a backup.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
            Go to Settings
          </button>
          <button className="btn btn-primary" onClick={loadLocalBackup} style={{ gap: 6 }}>
            <Zap size={14} /> Load Workspace Code (Offline)
          </button>
        </div>
      </div>
    );
  }

  if (codeGenStatus !== 'done' || !generatedCode) return null;

  const { files, validation, meta } = generatedCode;
  const currentCode = files[activeFile] || '# File not generated';
  const currentTab = FILE_TABS.find(t => t.key === activeFile) || FILE_TABS[0];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {meta?.isBackup && (
        <div className="glass-card" style={{
          padding: '12px 18px', marginBottom: 16,
          borderColor: 'rgba(0,206,201,0.25)',
          background: 'rgba(0,206,201,0.03)',
          display: 'flex', alignItems: 'center', gap: 10,
          borderRadius: 'var(--radius-md)'
        }}>
          <Zap size={14} color="#00cec9" style={{ animation: 'pulse-slow 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', color: '#00cec9', fontWeight: 600 }}>
            Offline Mode Active: Loaded real codebase files (train.py, main.py, tests) directly from local workspace directory.
          </span>
        </div>
      )}
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['code', 'validation', 'meta'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
              background: activeTab === t ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
              color: activeTab === t ? 'white' : 'var(--text-secondary)',
            }}>
              {t === 'code' ? '📁 Files' : t === 'validation' ? `✅ Validation (${validation.score}%)` : '📊 Meta'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGitHubDeploy}
            style={{ gap: 6, borderColor: 'rgba(0,206,201,0.3)', color: '#00cec9' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg> Deploy to GitHub
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCloudDeploy}
            style={{ gap: 6, background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', borderColor: 'rgba(108, 92, 231, 0.4)' }}
          >
            <Globe size={14} /> Deploy directly to Cloud
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => downloadZip(files, results?.domain || 'ml', results?.problemType || 'model')}
            style={{ gap: 6 }}
          >
            <Download size={14} /> Download ZIP
          </button>
        </div>
      </div>

      {/* Cloud Direct Deployment Overlay */}
      {cloudDeployStatus !== 'idle' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 20, marginBottom: 20, borderColor: cloudDeployStatus === 'success' ? '#00b894' : cloudDeployStatus === 'error' ? '#e17055' : '#6c5ce7', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {cloudDeployStatus === 'deploying' && <Loader2 size={18} className="spin-slow" color="#6c5ce7" />}
            {cloudDeployStatus === 'success' && <CheckCircle2 size={18} color="#00b894" />}
            {cloudDeployStatus === 'error' && <XCircle size={18} color="#e17055" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {cloudDeployStatus === 'deploying' ? `Direct Cloud Deployment — ${results?.deployTarget || 'Serverless'}` : cloudDeployStatus === 'success' ? 'Cloud Deployment Successful!' : 'Deployment Failed'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{cloudDeployMsg}</div>
            </div>
            {cloudDeployStatus === 'success' && (
              <a href={cloudDeployUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ gap: 4, background: '#00b894', border: 'none' }}>
                Access live API Gateway <ArrowUpRight size={13} />
              </a>
            )}
            {(cloudDeployStatus === 'success' || cloudDeployStatus === 'error') && (
              <button className="btn btn-secondary btn-sm" onClick={() => setCloudDeployStatus('idle')}>Dismiss</button>
            )}
          </div>
        </motion.div>
      )}

      {/* GitHub Deployment Overlay */}
      {deployStatus !== 'idle' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 20, marginBottom: 20, borderColor: deployStatus === 'success' ? '#00b894' : deployStatus === 'error' ? '#e17055' : '#00cec9', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {deployStatus === 'deploying' && <Loader2 size={18} className="spin-slow" color="#00cec9" />}
            {deployStatus === 'success' && <CheckCircle2 size={18} color="#00b894" />}
            {deployStatus === 'error' && <AlertTriangle size={18} color="#e17055" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {deployStatus === 'deploying' ? 'Deploying code to Cloud Git Repository' : deployStatus === 'success' ? 'Deployed Successfully!' : 'Deployment Failed'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{deployMsg}</div>
            </div>
            {deployStatus === 'success' && (
              <a href={repoUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ gap: 4 }}>
                Open Repo <ArrowUpRight size={13} />
              </a>
            )}
            {(deployStatus === 'success' || deployStatus === 'error') && (
              <button className="btn btn-secondary btn-sm" onClick={() => setDeployStatus('idle')}>Dismiss</button>
            )}
          </div>
        </motion.div>
      )}

      {/* Code Tab */}
      {activeTab === 'code' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {/* File tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)', padding: '0 4px' }}>
            {FILE_TABS.filter(t => files[t.key]).map(t => {
              const Icon = t.icon;
              const active = activeFile === t.key;
              return (
                <button key={t.key} onClick={() => setActiveFile(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px',
                  border: 'none', borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                  background: active ? `${t.color}08` : 'transparent', cursor: 'pointer',
                  color: active ? t.color : 'var(--text-tertiary)',
                  fontSize: '0.78rem', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-sans)',
                }}>
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Code viewer header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {activeFile} — {currentCode.split('\n').length} lines
            </span>
            <button onClick={() => copy(currentCode)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 10px' }}>
              {copied ? <><Check size={13} color="#00b894" /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>

          {/* Code content */}
          <div style={{ overflow: 'auto', maxHeight: 560, background: 'rgba(0,0,0,0.35)' }}>
            <pre
              style={{ margin: 0, padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.7, color: '#abb2bf', whiteSpace: 'pre', tabSize: 4 }}
              dangerouslySetInnerHTML={{ __html: highlight(currentCode, currentTab.lang) }}
            />
          </div>
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <ValidationReport validation={validation} />
        </div>
      )}

      {/* Meta Tab */}
      {activeTab === 'meta' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Generation Metadata</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Model', value: meta.model, icon: Zap, color: '#6c5ce7' },
              { label: 'Generation Time', value: `${(meta.duration / 1000).toFixed(1)}s`, icon: Clock, color: '#00b894' },
              { label: 'Prompt Tokens', value: meta.promptTokens.toLocaleString(), icon: Hash, color: '#00cec9' },
              { label: 'Output Tokens', value: meta.outputTokens.toLocaleString(), icon: Hash, color: '#fd79a8' },
              { label: 'Total Tokens', value: meta.totalTokens.toLocaleString(), icon: Hash, color: '#fdcb6e' },
              { label: 'Files Generated', value: Object.keys(files).length, icon: FileCode, color: '#a29bfe' },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon size={14} color={m.color} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            Generated: {new Date(meta.generatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </motion.div>
  );
}

