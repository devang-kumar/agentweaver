import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Bot, Activity,
  Settings, ChevronLeft, ChevronRight, Zap,
  Bell, Search, User
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { path: '/agents', icon: Bot, label: 'Agents' },
  { path: '/monitoring', icon: Activity, label: 'Monitoring' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const sideW = collapsed ? 72 : 260;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: sideW, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        transition: 'width var(--transition-base)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid var(--border-subtle)', minHeight: 73,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Zap size={20} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em' }}>AgentWeaver</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Multi-Agent OS</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <NavLink key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '12px' : '11px 16px',
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--accent-primary-light)' : 'var(--text-secondary)',
                background: active ? 'rgba(108,92,231,0.12)' : 'transparent',
                textDecoration: 'none', fontSize: '0.875rem',
                fontWeight: active ? 600 : 500,
                transition: 'all var(--transition-fast)',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <Icon size={20} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button onClick={() => setCollapsed(!collapsed)} style={{
          margin: 12, padding: 10, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)', background: 'transparent',
          color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      <div style={{
        flex: 1, marginLeft: sideW,
        transition: 'margin-left var(--transition-base)',
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{
          height: 64, borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', background: 'rgba(6,7,10,0.8)',
          backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)', width: 320,
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input placeholder="Search agents, pipelines..." style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)', width: '100%',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 8, display: 'flex' }}>
                <Bell size={20} />
              </button>
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-danger)' }} />
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <User size={18} color="white" />
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'auto' }}><Outlet /></main>
      </div>
    </div>
  );
}
