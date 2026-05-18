import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Default settings — single source of truth for all configurable values.
 * These are consumed by the simulator and monitoring pages so nothing is hardcoded.
 */
export const DEFAULT_SETTINGS = {
  // API Keys (stored locally — never sent anywhere except the respective API)
  'api.geminiKey': '',
  'api.githubToken': '',
  'api.githubUser': '',
  'api.githubRepo': 'agentweaver-deploy',
  // Cloud & Deployment
  'cloud.provider': 'AWS',
  'cloud.region': 'us-east-1',
  'cloud.target': 'Lambda',
  'cloud.autoscale': true,
  // Model Defaults
  'model.trials': 50,
  'model.candidates': 5,
  'model.framework': 'Auto',
  'model.quantize': false,
  // Monitoring & Alerts
  'monitoring.latency_target': 100,
  'monitoring.error_threshold': 1,
  'monitoring.drift_threshold': 0.1,
  'monitoring.slack': true,
  // Security & Compliance
  'security.compliance': 'None',
  'security.bias_audit': true,
  'security.secret_scan': true,
  'security.encryption': true,
};

const SettingsContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('agentweaver_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadFromStorage);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem('agentweaver_settings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const saveAll = useCallback((values) => {
    const next = { ...DEFAULT_SETTINGS, ...values };
    setSettings(next);
    try { localStorage.setItem('agentweaver_settings', JSON.stringify(next)); } catch {}
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    try { localStorage.removeItem('agentweaver_settings'); } catch {}
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, saveAll, resetToDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
