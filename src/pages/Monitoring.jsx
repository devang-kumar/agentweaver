import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, Clock, AlertTriangle, CheckCircle2,
  Cpu, Wifi, Zap, Info, Server, Sparkles, RefreshCw, HelpCircle
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      padding: '8px 14px', borderRadius: 8, fontSize: '0.75rem',
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: payload[0].color }}>
        {typeof payload[0].value === 'number' ? `${payload[0].value.toFixed(1)}ms` : payload[0].value}
      </div>
    </div>
  );
};

const DOMAIN_FEATURES = {
  finance: [
    { name: 'credit_score', label: 'Credit Score', type: 'number', min: 300, max: 850, step: 5, value: 710 },
    { name: 'debt_to_income', label: 'Debt-to-Income Ratio (%)', type: 'number', min: 0, max: 100, step: 1, value: 28 },
    { name: 'account_balance', label: 'Account Balance (USD)', type: 'number', min: 0, max: 250000, step: 1000, value: 15000 },
    { name: 'age', label: 'Customer Age', type: 'number', min: 18, max: 90, step: 1, value: 35 },
    { name: 'employment_years', label: 'Years of Employment', type: 'number', min: 0, max: 40, step: 1, value: 6 }
  ],
  healthcare: [
    { name: 'age', label: 'Patient Age', type: 'number', min: 0, max: 110, step: 1, value: 45 },
    { name: 'blood_pressure_systolic', label: 'Systolic Blood Pressure (mmHg)', type: 'number', min: 80, max: 200, step: 2, value: 120 },
    { name: 'cholesterol', label: 'Cholesterol Level (mg/dL)', type: 'number', min: 100, max: 400, step: 5, value: 190 },
    { name: 'bmi', label: 'Body Mass Index (BMI)', type: 'number', min: 10, max: 50, step: 0.5, value: 24.5 },
    { name: 'smoker', label: 'Smoker Status', type: 'select', options: ['Non-Smoker', 'Former Smoker', 'Active Smoker'], value: 'Non-Smoker' }
  ],
  ecommerce: [
    { name: 'session_duration', label: 'Session Duration (seconds)', type: 'number', min: 10, max: 3600, step: 10, value: 240 },
    { name: 'pages_visited', label: 'Pages Visited', type: 'number', min: 1, max: 50, step: 1, value: 6 },
    { name: 'cart_value', label: 'Cart Value (USD)', type: 'number', min: 0, max: 2000, step: 10, value: 85 },
    { name: 'discount_applied', label: 'Discount Code Used', type: 'select', options: ['None', 'WELCOME10', 'SPRING25', 'VIP_FREE'], value: 'None' },
    { name: 'device_type', label: 'Device Type', type: 'select', options: ['Mobile', 'Desktop', 'Tablet'], value: 'Mobile' }
  ],
  iot: [
    { name: 'temperature_celsius', label: 'Sensor Temperature (°C)', type: 'number', min: -20, max: 150, step: 0.5, value: 42.5 },
    { name: 'vibration_frequency', label: 'Vibration Frequency (Hz)', type: 'number', min: 10, max: 2000, step: 10, value: 450 },
    { name: 'voltage', label: 'Supply Voltage (V)', type: 'number', min: 100, max: 260, step: 1, value: 230 },
    { name: 'humidity_pct', label: 'Relative Humidity (%)', type: 'number', min: 0, max: 100, step: 1, value: 55 },
    { name: 'operating_hours', label: 'Cumulative Operating Hours', type: 'number', min: 0, max: 50000, step: 100, value: 12000 }
  ],
  marketing: [
    { name: 'click_through_rate', label: 'Click-Through Rate (%)', type: 'number', min: 0, max: 100, step: 0.1, value: 2.4 },
    { name: 'ad_spend', label: 'Ad Spend (USD)', type: 'number', min: 10, max: 10000, step: 50, value: 350 },
    { name: 'impressions', label: 'Impressions Count', type: 'number', min: 100, max: 1000000, strokeWidth: 100, value: 25000 },
    { name: 'campaign_channel', label: 'Campaign Channel', type: 'select', options: ['Google Search', 'Facebook Ad', 'Instagram Influencer', 'Email Newsletter'], value: 'Facebook Ad' },
    { name: 'user_age_group', label: 'Target Age Group', type: 'select', options: ['18-24', '25-34', '35-44', '45+'], value: '25-34' }
  ],
  nlp: [
    { name: 'text_length', label: 'Document Length (chars)', type: 'number', min: 10, max: 10000, step: 10, value: 450 },
    { name: 'word_count', label: 'Word Count', type: 'number', min: 2, max: 2000, step: 5, value: 85 },
    { name: 'sentiment_score', label: 'Sentiment Score', type: 'number', min: -1, max: 1, step: 0.05, value: 0.35 },
    { name: 'language', label: 'Language', type: 'select', options: ['English', 'Spanish', 'French', 'German', 'Chinese'], value: 'English' }
  ],
  cv: [
    { name: 'image_width', label: 'Image Width (pixels)', type: 'number', min: 100, max: 4000, step: 10, value: 1920 },
    { name: 'image_height', label: 'Image Height (pixels)', type: 'number', min: 100, max: 4000, step: 10, value: 1080 },
    { name: 'channels', label: 'Color Channels', type: 'select', options: ['1 (Grayscale)', '3 (RGB)', '4 (RGBA)'], value: '3 (RGB)' },
    { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '4:3', '1:1', '21:9'], value: '16:9' }
  ],
  hr: [
    { name: 'years_experience', label: 'Years of Experience', type: 'number', min: 0, max: 45, step: 1, value: 5 },
    { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Bachelors', 'Masters', 'PhD'], value: 'Bachelors' },
    { name: 'current_salary_usd', label: 'Current Salary (USD)', type: 'number', min: 20000, max: 250000, step: 5000, value: 85000 },
    { name: 'performance_score', label: 'Performance Score (1-5)', type: 'number', min: 1, max: 5, step: 0.5, value: 4 },
    { name: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Sales', 'Marketing', 'Product', 'HR', 'Finance'], value: 'Engineering' }
  ],
  general: [
    { name: 'feature_1', label: 'Numeric Feature 1', type: 'number', min: 0, max: 100, step: 1, value: 50 },
    { name: 'feature_2', label: 'Numeric Feature 2', type: 'number', min: 0, max: 1000, step: 10, value: 250 },
    { name: 'feature_3', label: 'Categorical Feature 3', type: 'select', options: ['Option A', 'Option B', 'Option C'], value: 'Option A' }
  ]
};

const defaultFeatures = [
  { name: 'Mthly_HH_Income', label: 'Monthly Income (INR)', type: 'number', min: 5000, max: 150000, step: 1000, value: 50000 },
  { name: 'Mthly_HH_Expense', label: 'Monthly Expense (INR)', type: 'number', min: 2000, max: 100000, step: 500, value: 20000 },
  { name: 'No_of_Fly_Members', label: 'Family Members', type: 'select', options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], value: 4 },
  { name: 'Emi_or_Rent_Amt', label: 'Rent / EMI Amount (INR)', type: 'number', min: 0, max: 50000, step: 500, value: 5000 },
  { name: 'Annual_HH_Income', label: 'Annual HH Income (INR)', type: 'number', min: 60000, max: 1800000, step: 12000, value: 600000 },
  { name: 'Highest_Qualified_Member', label: 'Highest Qualified Member', type: 'select', options: ['Illiterate', 'Under-Graduate', 'Graduate', 'Post-Graduate', 'Professional'], value: 'Graduate' }
];

export default function Monitoring() {
  const { latestResults } = usePipeline();

  const [serverState, setServerState] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [serverInfo, setServerInfo] = useState(null);
  const [connectionError, setConnectionError] = useState('');

  // Dynamically loaded features list and properties
  const [featuresList, setFeaturesList] = useState([]);
  const [targetName, setTargetName] = useState('Target');
  const [isClassifier, setIsClassifier] = useState(true);

  // Prediction serving states
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  // Live network telemetry data points
  const [latencyHistory, setLatencyHistory] = useState([
    { time: '19:00:00', value: 12 },
    { time: '19:05:00', value: 15 },
    { time: '19:10:00', value: 11 },
    { time: '19:15:00', value: 14 },
  ]);
  const [predictionVolume, setPredictionVolume] = useState([
    { time: '19:00:00', value: 1 },
    { time: '19:05:00', value: 2 },
    { time: '19:10:00', value: 3 },
    { time: '19:15:00', value: 4 },
  ]);
  const [errorHistory, setErrorHistory] = useState([
    { time: '19:00:00', value: 0 },
    { time: '19:05:00', value: 0 },
    { time: '19:10:00', value: 0 },
    { time: '19:15:00', value: 0 },
  ]);

  // Load and sync features
  useEffect(() => {
    const loadDynamicFeatures = async () => {
      if (serverState === 'connected') {
        try {
          const res = await fetch('http://localhost:8000/openapi.json');
          if (res.ok) {
            const openapi = await res.json();
            const schema = openapi?.components?.schemas?.PredictionInput;
            if (schema && schema.properties) {
              const parsedFeatures = Object.entries(schema.properties).map(([key, prop]) => {
                let type = 'string';
                let options = [];
                let min = 0;
                let max = 100;
                let step = 1;
                
                if (prop.type === 'number' || prop.type === 'integer') {
                  type = 'number';
                  const lowerKey = key.toLowerCase();
                  if (lowerKey.includes('income')) {
                    min = 1000;
                    max = 200000;
                    step = 1000;
                  } else if (lowerKey.includes('expense') || lowerKey.includes('rent') || lowerKey.includes('emi')) {
                    min = 500;
                    max = 100000;
                    step = 500;
                  } else if (lowerKey.includes('members') || lowerKey.includes('age') || lowerKey.includes('count')) {
                    min = 1;
                    max = 100;
                    step = 1;
                  } else {
                    min = prop.minimum ?? 0;
                    max = prop.maximum ?? 1000;
                    step = prop.type === 'integer' ? 1 : 0.1;
                  }
                } else if (prop.enum) {
                  type = 'select';
                  options = prop.enum;
                } else if (prop.anyOf) {
                  const enumSchema = prop.anyOf.find(s => s.enum);
                  if (enumSchema) {
                    type = 'select';
                    options = enumSchema.enum;
                  }
                }
                
                let defaultValue = '';
                if (type === 'number') {
                  defaultValue = prop.default ?? prop.example ?? Math.round((min + max) / 2);
                } else if (type === 'select') {
                  defaultValue = prop.default ?? prop.example ?? options[0] ?? '';
                } else {
                  defaultValue = prop.default ?? prop.example ?? '';
                }
                
                return {
                  name: key,
                  label: prop.title || key.replace(/_/g, ' '),
                  type,
                  options,
                  min,
                  max,
                  step,
                  value: defaultValue,
                  description: prop.description || ''
                };
              });

              setFeaturesList(parsedFeatures);
              
              if (serverInfo) {
                setTargetName(serverInfo.classes ? 'Prediction Class' : 'Regression Value');
                setIsClassifier(!!serverInfo.classes);
              } else {
                setTargetName('Prediction Class');
                setIsClassifier(true);
              }
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load schema from openapi.json:", err);
        }
      }

      if (latestResults) {
        const { csvMetadata, domain, problemType } = latestResults;
        const pType = problemType?.toLowerCase() || '';
        const isClass = !pType.includes('regress') && !pType.includes('forecast');
        setIsClassifier(isClass);
        
        if (csvMetadata) {
          setTargetName(csvMetadata.target || 'Target');
          
          if (csvMetadata.featureSpecs && csvMetadata.featureSpecs.length > 0) {
            const specs = csvMetadata.featureSpecs.map(f => ({
              ...f,
              label: f.name.replace(/_/g, ' '),
              value: f.default ?? (f.type === 'number' ? Math.round((f.min + f.max) / 2) : (f.options?.[0] || ''))
            }));
            setFeaturesList(specs);
            return;
          }
        } else {
          const domKey = domain?.toLowerCase() || 'general';
          const matchedDomain = Object.keys(DOMAIN_FEATURES).find(k => domKey.includes(k)) || 'general';
          
          const mapped = DOMAIN_FEATURES[matchedDomain].map(f => ({
            ...f,
            value: f.value ?? (f.type === 'number' ? Math.round((f.min + f.max) / 2) : (f.options?.[0] || ''))
          }));
          setFeaturesList(mapped);
          setTargetName(isClass ? 'Prediction Class' : 'Target Value');
          return;
        }
      }

      // Default fallback
      setFeaturesList(defaultFeatures);
      setTargetName('Earning Members');
      setIsClassifier(true);
    };

    loadDynamicFeatures();
  }, [serverState, latestResults, serverInfo]);

  const updateFeatureValue = (name, val) => {
    setFeaturesList(prev => {
      const updated = prev.map(f => f.name === name ? { ...f, value: val } : f);
      
      // Keep Monthly and Annual Household income in sync if they are present
      if (name === 'Mthly_HH_Income') {
        return updated.map(f => f.name === 'Annual_HH_Income' ? { ...f, value: Number(val) * 12 } : f);
      }
      return updated;
    });
  };

  // Perform browser CORS poll to check local server health
  const checkServer = async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) {
        setServerState('connected');
        const metricsRes = await fetch('http://localhost:8000/metrics');
        if (metricsRes.ok) {
          const metricsJson = await metricsRes.json();
          setServerInfo(metricsJson);
        }
        setConnectionError('');
      } else {
        setServerState('disconnected');
        setConnectionError(`HTTP Error ${res.status}`);
      }
    } catch (err) {
      setServerState('disconnected');
      setConnectionError(err.message || 'Connection refused');
    }
  };

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPredictionValue = (val) => {
    if (typeof val === 'number') {
      if (targetName.toLowerCase().includes('member')) {
        return `${val} Member${val > 1 ? 's' : ''}`;
      }
      return val.toLocaleString();
    }
    return String(val);
  };

  // Post Prediction Form to local Uvicorn FastAPI
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPredictionResult(null);
    setPredictionError(null);

    const startTime = performance.now();
    const payload = {};
    featuresList.forEach(f => {
      if (f.type === 'number') {
        payload[f.name] = parseFloat(f.value);
      } else {
        payload[f.name] = f.value;
      }
    });

    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (res.ok) {
        const data = await res.json();
        setPredictionResult(data);

        // Update live charts in-memory
        setLatencyHistory(prev => [...prev.slice(-9), { time: nowStr, value: latency }]);
        setPredictionVolume(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(-9), { time: nowStr, value: (last ? last.value : 0) + 1 }];
        });
        setErrorHistory(prev => [...prev.slice(-9), { time: nowStr, value: 0 }]);
      } else {
        const errorJson = await res.json().catch(() => ({}));
        let errMsg = errorJson.detail || `Server returned status ${res.status}`;
        if (res.status === 422 && errorJson.detail) {
          // Format validation errors cleanly
          errMsg = `Schema Validation Error: ${errorJson.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join(', ')}`;
        }
        setPredictionError(errMsg);
        setLatencyHistory(prev => [...prev.slice(-9), { time: nowStr, value: latency }]);
        setErrorHistory(prev => [...prev.slice(-9), { time: nowStr, value: 100 }]);
      }
    } catch (err) {
      setPredictionError(err.message || 'Could not communicate with the local server.');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setErrorHistory(prev => [...prev.slice(-9), { time: nowStr, value: 100 }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Dynamic Header */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontWeight: 800, marginBottom: 4 }}>
              <span className="gradient-text">Live</span> Serving & Monitoring
            </h2>
            <p style={{ fontSize: '0.9rem' }}>
              Test predictions, manage model health, and capture live network metrics directly from the browser.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={checkServer} style={{ gap: 6 }}>
              <RefreshCw size={12} /> Refresh Connection
            </button>
            {serverState === 'checking' && (
              <span className="badge badge-warning" style={{ padding: '6px 14px', background: 'rgba(253,203,110,0.12)', color: '#fdcb6e', borderColor: 'rgba(253,203,110,0.25)' }}>
                Checking Connection...
              </span>
            )}
            {serverState === 'connected' && (
              <span className="badge badge-success" style={{ padding: '6px 14px', background: 'rgba(0,184,148,0.12)', color: '#00b894', borderColor: 'rgba(0,184,148,0.25)', boxShadow: '0 0 10px rgba(0,184,148,0.2)' }}>
                <Wifi size={12} style={{ marginRight: 4 }} /> Connected: localhost:8000
              </span>
            )}
            {serverState === 'disconnected' && (
              <span className="badge badge-danger" style={{ padding: '6px 14px', background: 'rgba(225,112,85,0.12)', color: '#e17055', borderColor: 'rgba(225,112,85,0.25)', boxShadow: '0 0 10px rgba(225,112,85,0.2)' }}>
                <AlertTriangle size={12} style={{ marginRight: 4 }} /> Local Server Offline
              </span>
            )}
          </div>
        </div>

        {/* Offline Alert Details */}
        {serverState === 'disconnected' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 24, marginBottom: 28, borderColor: 'rgba(225,112,85,0.3)', background: 'rgba(225,112,85,0.04)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Server size={24} color="#e17055" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: 6, color: '#e17055' }}>Server Connection Refused ({connectionError})</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  The website tried to query your local model server at <code>http://localhost:8000</code> but received no response. To resolve this error and make predictions live, execute these commands in your terminal:
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#abb2bf', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                  <div>cd c:\Users\devan\Desktop\abbhack\generated</div>
                  <div style={{ color: 'var(--accent-primary-light)', marginTop: 4 }}>python -m uvicorn api_app.main:app --port 8000</div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  Once launched, this connection badge will automatically glow green, and the prediction playground below will unlock!
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Serving Playground */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          
          {/* Prediction Input Form */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Cpu size={18} color="var(--accent-primary-light)" />
              <h4 style={{ fontWeight: 700 }}>Prediction Playground</h4>
            </div>

            <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                {featuresList.map((f, idx) => (
                  <div 
                    key={f.name} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gridColumn: (idx === featuresList.length - 1 && featuresList.length % 2 !== 0) ? 'span 2' : 'span 1'
                    }}
                  >
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>
                      {f.label}
                    </label>
                    
                    {f.type === 'select' ? (
                      <select
                        value={f.value}
                        onChange={(e) => updateFeatureValue(f.name, e.target.value)}
                        disabled={serverState !== 'connected'}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={f.value}
                          onChange={(e) => updateFeatureValue(f.name, Number(e.target.value))}
                          disabled={serverState !== 'connected'}
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                        />
                        {f.min !== undefined && f.max !== undefined && (
                          <input
                            type="range"
                            min={f.min}
                            max={f.max}
                            step={f.step || 1}
                            value={f.value}
                            onChange={(e) => updateFeatureValue(f.name, Number(e.target.value))}
                            disabled={serverState !== 'connected'}
                            style={{ width: '100%', marginTop: 8, accentColor: 'var(--accent-primary)' }}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={serverState !== 'connected' || loading}
                style={{ width: '100%', marginTop: 12, height: 42 }}
              >
                {loading ? 'Running Inference...' : <><Sparkles size={16} /> Run {isClassifier ? 'Classification' : 'Regression'} Inference</>}
              </button>
            </form>
          </div>

          {/* Inference Output / Results Card */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Activity size={18} color="#00b894" />
              <h4 style={{ fontWeight: 700 }}>Inference Output</h4>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {/* 1. Initial State */}
                {!predictionResult && !predictionError && !loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
                    <Info size={32} style={{ marginBottom: 12 }} />
                    <h5 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Awaiting Inference</h5>
                    <p style={{ fontSize: '0.78rem' }}>Set feature values on the left and click "Run Inference" to query the model.</p>
                  </motion.div>
                )}

                {/* 2. Loading State */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: 20 }}>
                    <div className="spin-slow" style={{ width: 32, height: 32, border: '3px solid var(--accent-primary-light)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
                    <h5 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Evaluating Model Features...</h5>
                  </motion.div>
                )}

                {/* 3. Error Output State */}
                {predictionError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ padding: 18, borderColor: 'rgba(225,112,85,0.3)', background: 'rgba(225,112,85,0.05)', color: '#e17055' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                      <div>
                        <h5 style={{ fontWeight: 700, marginBottom: 4 }}>Prediction Query Failed</h5>
                        <p style={{ fontSize: '0.76rem', lineHeight: 1.5 }}>{predictionError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. Success Output */}
                {predictionResult && !loading && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Glowing result */}
                    <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(0,184,148,0.06)', border: '1px solid rgba(0,184,148,0.2)', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,184,148,0.05)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Predicted {targetName}</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00b894' }}>
                        {formatPredictionValue(predictionResult.prediction)}
                      </div>
                    </div>

                    {/* Probabilities Distribution (Classification only) */}
                    {predictionResult.probabilities && Object.keys(predictionResult.probabilities).length > 0 && (
                      <div>
                        <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Probability Distribution</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {Object.entries(predictionResult.probabilities).map(([classes, prob]) => {
                            const percent = Math.round(prob * 100);
                            const active = String(classes) === String(predictionResult.prediction);
                            return (
                              <div key={classes} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.78rem', width: 100, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {targetName.toLowerCase().includes('member') ? `${classes} Member${Number(classes) > 1 ? 's' : ''}` : classes}
                                </span>
                                <div style={{ flex: 1, height: 10, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                  <div style={{ height: '100%', width: `${percent}%`, background: active ? 'var(--gradient-primary)' : 'var(--border-subtle)', borderRadius: 'var(--radius-full)' }} />
                                </div>
                                <span style={{ fontSize: '0.78rem', width: 40, textAlign: 'right', fontWeight: active ? 800 : 500, color: active ? '#00b894' : 'var(--text-tertiary)' }}>
                                  {percent}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Live System Performance Telemetry */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            {
              label: 'Local Serving Model',
              value: serverState === 'connected' ? (serverInfo ? serverInfo.model_name : 'Support Vector Classifier') : '—',
              detail: serverState === 'connected' ? `API Version: ${serverInfo?.model_version || '1.0'}` : 'Offline',
              icon: Cpu,
              color: '#6c5ce7',
            },
            {
              label: 'Real-Time Endpoint Latency',
              value: serverState === 'connected' && latencyHistory.length > 0 ? `${latencyHistory[latencyHistory.length - 1].value}ms` : '—',
              detail: serverState === 'connected' ? 'Calculated round-trip fetch latency' : 'Offline',
              icon: Clock,
              color: '#00b894',
            },
            {
              label: 'API Request Load',
              value: serverState === 'connected' ? `${predictionVolume.reduce((sum, item) => sum + item.value, 0)} queries` : '—',
              detail: 'Historical API hits in this session',
              icon: Activity,
              color: '#00cec9',
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}10`, border: `1px solid ${card.color}25`, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={card.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{card.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{card.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Telemetry Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Latency History */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.85rem' }}>Live Endpoint Latency (ms)</h4>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Refreshes on prediction</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={latencyHistory}>
                <defs>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5a5c72' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#5a5c72' }} axisLine={false} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#5a5c72', fontSize: 10 } }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#6c5ce7" fill="url(#latGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* System Load */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 20, fontSize: '0.85rem' }}>Prediction API Load</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={predictionVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5a5c72' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#5a5c72' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#00cec9" name="API Queries" radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
