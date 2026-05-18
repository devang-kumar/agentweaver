import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AGENT_DEFINITIONS, AGENT_COUNT } from '../config/agents';
import {
  Zap, ArrowRight, Bot, GitBranch, Shield,
  Rocket, Brain, Sparkles,
} from 'lucide-react';

// Use the shared agent list — landingDesc is the blurb shown on the landing page
const agents = AGENT_DEFINITIONS;

const stats = [
  { value: '30min', label: 'Avg Pipeline Time' },
  { value: String(AGENT_COUNT), label: 'Specialized Agents' },
  { value: '99.7%', label: 'Uptime SLA' },
  { value: '85%+', label: 'Test Coverage' },
];


const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* BG Orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,121,168,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(6,7,10,0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)',
          }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>AgentWeaver</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#agents" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Agents</a>
          <a href="#how" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>How It Works</a>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
            Launch Console <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'relative', zIndex: 1,
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '120px 24px 80px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <div className="badge badge-primary" style={{ marginBottom: 24 }}>
            <Sparkles size={12} /> Autonomous Multi-Agent System
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, maxWidth: 900 }}>
            Ship Production ML in{' '}
            <span className="gradient-text">30 Minutes</span>
            {' '}Not Weeks
          </h1>
          <p style={{ fontSize: '1.15rem', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
            {AGENT_COUNT} specialized AI agents work in parallel—analyzing data, building models,
            testing, deploying, monitoring, and self-healing—completely autonomously.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
              <Rocket size={18} /> Get Started
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/agents')}>
              <Bot size={18} /> Meet the Agents
            </button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          style={{
            marginTop: 80, display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary-light)' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* Agents Grid */}
      <section id="agents" style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text">{AGENT_COUNT} Specialized</span> AI Agents
          </h2>
          <p style={{ fontSize: '1rem', maxWidth: 550, margin: '0 auto' }}>
            Each agent is a domain expert, working autonomously yet coordinated by the Orchestrator.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
        >
          {AGENT_DEFINITIONS.map((a, i) => (
            <motion.div key={i} variants={item} className="glass-card" style={{ padding: 28 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${a.color}18`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                border: `1px solid ${a.color}30`,
              }}>
                <a.icon size={22} color={a.color} />
              </div>
              <h4 style={{ marginBottom: 8, fontWeight: 700 }}>{a.name}</h4>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{a.landingDesc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '80px 24px 120px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 12 }}>
            How <span className="gradient-text">AgentWeaver</span> Works
          </h2>
          <p style={{ fontSize: '1rem' }}>Describe your problem. We handle the rest.</p>
        </div>

        {[
          { step: '01', title: 'Describe Your Problem', desc: 'Tell AgentWeaver what you need—domain, data, constraints. The Orchestrator parses everything.', icon: Brain },
          { step: '02', title: 'Autonomous Pipeline', desc: 'Agents analyze data, build models, run tests, and deploy—all in parallel, all automated.', icon: GitBranch },
          { step: '03', title: 'Production Ready', desc: 'Get a deployed, monitored, self-healing ML system with dashboards, alerts, and auto-optimization.', icon: Shield },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 48,
              padding: 32, borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(108,92,231,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(108,92,231,0.2)',
            }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary-light)' }}>{s.step}</span>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </motion.div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            <Zap size={18} /> Launch AgentWeaver
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          <Zap size={14} /> AgentWeaver &copy; 2026
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          Autonomous Multi-Agent Data Science OS
        </div>
      </footer>
    </div>
  );
}
