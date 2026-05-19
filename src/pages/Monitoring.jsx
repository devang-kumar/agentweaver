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
  const { latestResults, activePipeline, codeGenStatus } = usePipeline();

  const [serverState, setServerState] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [serverInfo, setServerInfo] = useState(null);
  const [connectionError, setConnectionError] = useState('');

  // Dynamically loaded features list and properties
  const [featuresList, setFeaturesList] = useState([]);
  const [targetName, setTargetName] = useState('Target');
  const [isClassifier, setIsClassifier] = useState(true);
  const [playgroundUpdated, setPlaygroundUpdated] = useState(false);
  const [lastPipelineId, setLastPipelineId] = useState(null);

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
                
                // Special handling for Highest_Qualified_Member
                if (key === 'Highest_Qualified_Member') {
                  type = 'select';
                  options = ['Illiterate', 'Under-Graduate', 'Graduate', 'Post-Graduate', 'Professional'];
                } else if (prop.type === 'number' || prop.type === 'integer') {
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
                  if (key === 'Highest_Qualified_Member') {
                    defaultValue = 'Graduate';
                  } else {
                    defaultValue = prop.default ?? prop.example ?? options[0] ?? '';
                  }
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
            
            // Check if this is a new pipeline
            const currentPipelineId = activePipeline?.id;
            if (currentPipelineId && currentPipelineId !== lastPipelineId) {
              setPlaygroundUpdated(true);
              setLastPipelineId(currentPipelineId);
              // Auto-hide the notification after 5 seconds
              setTimeout(() => setPlaygroundUpdated(false), 5000);
            }
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
          
          // Check if this is a new pipeline
          const currentPipelineId = activePipeline?.id;
          if (currentPipelineId && currentPipelineId !== lastPipelineId) {
            setPlaygroundUpdated(true);
            setLastPipelineId(currentPipelineId);
            // Auto-hide the notification after 5 seconds
            setTimeout(() => setPlaygroundUpdated(false), 5000);
          }
          return;
        }
      }

      // Default fallback
      setFeaturesList(defaultFeatures);
      setTargetName('Earning Members');
      setIsClassifier(true);
    };

    loadDynamicFeatures();
  }, [serverState, latestResults, serverInfo, activePipeline?.id, lastPipelineId]);

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
      } else if (f.type === 'select') {
        // For select fields, check if options are numbers (like No_of_Fly_Members)
        if (f.options && typeof f.options[0] === 'number') {
          payload[f.name] = parseFloat(f.value);
        } else {
          // For string options (like Highest_Qualified_Member), use the value directly
          payload[f.name] = f.value;
        }
      } else {
        payload[f.name] = f.value;
      }
    });

    // Debug log to see what we're sending
    console.log('Sending payload:', payload);

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

        {/* Pipeline Running Status & Dynamic Playground */}
        {activePipeline && activePipeline.status === 'running' && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.6
            }}
            className="glass-card pipeline-running-banner" 
            style={{ 
              padding: 28, 
              marginBottom: 32, 
              borderColor: 'rgba(139,92,246,0.4)', 
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(167,139,250,0.08) 100%)',
              boxShadow: '0 8px 32px rgba(139,92,246,0.2), 0 0 0 1px rgba(139,92,246,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated background gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent 30%, rgba(139,92,246,0.05) 50%, transparent 70%)',
              animation: 'shimmer 3s ease-in-out infinite',
              backgroundSize: '200% 200%'
            }} />
            
            {/* Floating particles */}
            <div style={{ position: 'absolute', top: '20%', left: '10%', width: 4, height: 4, borderRadius: '50%', background: '#8b5cf6', opacity: 0.4, animation: 'float 4s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: '60%', right: '15%', width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', opacity: 0.3, animation: 'float 3s ease-in-out infinite 1s' }} />
            <div style={{ position: 'absolute', bottom: '30%', left: '80%', width: 3, height: 3, borderRadius: '50%', background: '#8b5cf6', opacity: 0.5, animation: 'float 5s ease-in-out infinite 2s' }} />
            
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 16, 
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(167,139,250,0.2) 100%)', 
                  border: '2px solid rgba(139,92,246,0.4)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 25px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                  position: 'relative'
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={28} color="#8b5cf6" />
                </motion.div>
                
                {/* Pulsing ring */}
                <div style={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: '50%',
                  border: '2px solid rgba(139,92,246,0.4)',
                  animation: 'pulse-ring 2s ease-out infinite'
                }} />
              </motion.div>
              
              <div style={{ flex: 1 }}>
                <motion.h4 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ 
                    fontWeight: 800, 
                    marginBottom: 8, 
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '1.1rem'
                  }}
                >
                  🚀 Pipeline Running - New Model Playground Available!
                </motion.h4>
                
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}
                >
                  A new ML pipeline is currently running for <strong>"{activePipeline.config?.domain || 'your problem'}"</strong>. 
                  {codeGenStatus === 'generating' && ' ⚡ Code generation is in progress...'}
                  {codeGenStatus === 'done' && ' ✨ The model playground below has been updated with the new features and target variables.'}
                  {codeGenStatus === 'idle' && ' 🔄 The playground will update automatically once the model is ready.'}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
                >
                  {[
                    { label: 'Domain', value: activePipeline.results?.domain || 'General', color: '#8b5cf6' },
                    { label: 'Type', value: activePipeline.results?.problemType || 'Classification', color: '#a78bfa' },
                    { 
                      label: 'Status', 
                      value: codeGenStatus === 'generating' ? '⏳ Generating Code...' :
                             codeGenStatus === 'done' ? '✅ Model Ready' :
                             codeGenStatus === 'idle' ? '🔄 Preparing...' :
                             codeGenStatus === 'no_key' ? '🔑 API Key Required' : '❌ Generation Failed',
                      color: codeGenStatus === 'generating' ? '#fbbf24' : 
                             codeGenStatus === 'done' ? '#10b981' : '#8b5cf6'
                    }
                  ].map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.1, type: "spring", stiffness: 200 }}
                      style={{ 
                        padding: '6px 14px', 
                        borderRadius: 'var(--radius-full)',
                        background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}08 100%)`, 
                        border: `1px solid ${item.color}30`,
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        color: item.color,
                        boxShadow: `0 2px 8px ${item.color}20`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 1 }}>
                        <strong>{item.label}:</strong> {item.value}
                      </span>
                      {codeGenStatus === 'generating' && item.label === 'Status' && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          animation: 'shimmer 2s ease-in-out infinite'
                        }} />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 32 }}
        >
          
          {/* Prediction Input Form */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="glass-card playground-card" 
            style={{ 
              padding: 28,
              borderColor: activePipeline && activePipeline.status === 'running' ? 'rgba(139,92,246,0.4)' : 'var(--border-subtle)',
              background: activePipeline && activePipeline.status === 'running' ? 
                'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(167,139,250,0.03) 100%)' : 'var(--bg-elevated)',
              boxShadow: activePipeline && activePipeline.status === 'running' ? 
                '0 8px 32px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.1)' : 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated border gradient for active pipeline */}
            {activePipeline && activePipeline.status === 'running' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, #8b5cf6, #a78bfa, #8b5cf6)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }} />
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, position: 'relative', zIndex: 1 }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(167,139,250,0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(108,92,231,0.2)'
                }}
              >
                <Cpu size={20} color="var(--accent-primary-light)" />
              </motion.div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Prediction Playground
                  <AnimatePresence>
                    {activePipeline && activePipeline.status === 'running' && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: -10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '3px 10px', 
                          borderRadius: 'var(--radius-full)',
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(167,139,250,0.2) 100%)', 
                          color: '#8b5cf6',
                          fontWeight: 700,
                          border: '1px solid rgba(139,92,246,0.4)',
                          boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                          animation: 'glow-pulse 2s ease-in-out infinite'
                        }}
                      >
                        UPDATED
                      </motion.span>
                    )}
                  </AnimatePresence>
                </h4>
              </div>
            </div>

            <AnimatePresence>
              {playgroundUpdated && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ 
                    padding: 18, 
                    marginBottom: 20, 
                    borderRadius: 'var(--radius-md)', 
                    background: 'linear-gradient(135deg, rgba(0,184,148,0.08) 0%, rgba(16,185,129,0.05) 100%)', 
                    border: '1px solid rgba(0,184,148,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: '0 4px 20px rgba(0,184,148,0.1)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 size={22} color="#00b894" />
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00b894', marginBottom: 3 }}>
                      🎉 Playground Updated!
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                      Features and target variables have been automatically configured for the new <strong>"{activePipeline?.results?.domain || 'ML'}"</strong> pipeline.
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPlaygroundUpdated(false)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: 'var(--text-tertiary)',
                      fontSize: '1.2rem',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activePipeline && activePipeline.status === 'running' && codeGenStatus !== 'done' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ 
                    padding: 18, 
                    marginBottom: 20, 
                    borderRadius: 'var(--radius-md)', 
                    background: 'linear-gradient(135deg, rgba(253,203,110,0.08) 0%, rgba(245,158,11,0.05) 100%)', 
                    border: '1px solid rgba(253,203,110,0.2)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ 
                        width: 18, 
                        height: 18, 
                        border: '2px solid #fdcb6e', 
                        borderTopColor: 'transparent', 
                        borderRadius: '50%' 
                      }} 
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fdcb6e' }}>
                      ⚡ Updating playground for new pipeline...
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                    Features and target variables will be automatically configured once the model is ready.
                  </p>
                  
                  {/* Animated progress bar */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 2,
                    background: '#fdcb6e',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    animation: 'shimmer 2s ease-in-out infinite',
                    width: '60%'
                  }} />
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}
              >
                {featuresList.map((f, idx) => (
                  <motion.div 
                    key={f.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05, type: "spring", stiffness: 200 }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gridColumn: (idx === featuresList.length - 1 && featuresList.length % 2 !== 0) ? 'span 2' : 'span 1'
                    }}
                  >
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: 'var(--text-tertiary)', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      marginBottom: 8,
                      transition: 'color var(--transition-fast)'
                    }}>
                      {f.label}
                    </label>
                    
                    {f.type === 'select' ? (
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={f.value}
                        onChange={(e) => updateFeatureValue(f.name, e.target.value)}
                        disabled={serverState !== 'connected'}
                        style={{ 
                          width: '100%', 
                          padding: '12px 14px', 
                          background: 'var(--bg-tertiary)', 
                          border: '2px solid var(--border-subtle)', 
                          borderRadius: 'var(--radius-md)', 
                          color: 'var(--text-primary)', 
                          outline: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          transition: 'all var(--transition-base)',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary-light)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                      >
                        {f.options?.map((opt, idx) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </motion.select>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type="number"
                          value={f.value}
                          onChange={(e) => updateFeatureValue(f.name, Number(e.target.value))}
                          disabled={serverState !== 'connected'}
                          style={{ 
                            width: '100%', 
                            padding: '12px 14px', 
                            background: 'var(--bg-tertiary)', 
                            border: '2px solid var(--border-subtle)', 
                            borderRadius: 'var(--radius-md)', 
                            color: 'var(--text-primary)', 
                            outline: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'all var(--transition-base)'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--accent-primary-light)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-subtle)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        {f.min !== undefined && f.max !== undefined && (
                          <motion.input
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + idx * 0.05 }}
                            type="range"
                            min={f.min}
                            max={f.max}
                            step={f.step || 1}
                            value={f.value}
                            onChange={(e) => updateFeatureValue(f.name, Number(e.target.value))}
                            disabled={serverState !== 'connected'}
                            style={{ 
                              width: '100%', 
                              marginTop: 10, 
                              accentColor: 'var(--accent-primary)',
                              height: 6,
                              borderRadius: 3,
                              background: 'var(--bg-tertiary)',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          />
                        )}
                        
                        {/* Value indicator */}
                        <div style={{
                          position: 'absolute',
                          top: -8,
                          right: 8,
                          fontSize: '0.7rem',
                          color: 'var(--accent-primary-light)',
                          fontWeight: 600,
                          background: 'rgba(139,92,246,0.15)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          opacity: 0.8
                        }}>
                          {typeof f.value === 'number' ? f.value.toLocaleString() : f.value}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: '0 8px 30px rgba(139,92,246,0.5)' 
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn btn-primary"
                disabled={serverState !== 'connected' || loading}
                style={{ 
                  width: '100%', 
                  marginTop: 16, 
                  height: 48,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  background: loading ? 
                    'linear-gradient(135deg, rgba(139,92,246,0.7) 0%, rgba(167,139,250,0.7) 100%)' :
                    'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                  border: 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {loading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 2s ease-in-out infinite'
                  }} />
                )}
                
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={18} />
                      </motion.div>
                      Running Inference...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> 
                      Run {isClassifier ? 'Classification' : 'Regression'} Inference
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          </motion.div>

          {/* Inference Output / Results Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="glass-card inference-output-card" 
            style={{ 
              padding: 28, 
              display: 'flex', 
              flexDirection: 'column',
              borderColor: activePipeline && activePipeline.status === 'running' ? 'rgba(139,92,246,0.4)' : 'var(--border-subtle)',
              background: activePipeline && activePipeline.status === 'running' ? 
                'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(167,139,250,0.03) 100%)' : 'var(--bg-elevated)',
              boxShadow: activePipeline && activePipeline.status === 'running' ? 
                '0 8px 32px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.1)' : 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 400
            }}
          >
            {/* Animated border gradient for active pipeline */}
            {activePipeline && activePipeline.status === 'running' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, #00b894, #10b981, #00b894)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }} />
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, position: 'relative', zIndex: 1 }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(0,184,148,0.15) 0%, rgba(16,185,129,0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0,184,148,0.2)'
                }}
              >
                <Activity size={20} color="#00b894" />
              </motion.div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Inference Output
                  <AnimatePresence>
                    {activePipeline && activePipeline.status === 'running' && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: -10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '3px 10px', 
                          borderRadius: 'var(--radius-full)',
                          background: 'linear-gradient(135deg, rgba(0,184,148,0.2) 0%, rgba(16,185,129,0.15) 100%)', 
                          color: '#00b894',
                          fontWeight: 700,
                          border: '1px solid rgba(0,184,148,0.3)',
                          boxShadow: '0 2px 8px rgba(0,184,148,0.2)',
                          animation: 'glow-pulse 2s ease-in-out infinite'
                        }}
                      >
                        LIVE
                      </motion.span>
                    )}
                  </AnimatePresence>
                </h4>
              </div>
            </div>

            <AnimatePresence>
              {activePipeline && activePipeline.status === 'running' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ 
                    padding: 14, 
                    marginBottom: 20, 
                    borderRadius: 'var(--radius-md)', 
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(167,139,250,0.08) 100%)', 
                    border: '1px solid rgba(139,92,246,0.25)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
                    <strong style={{ color: '#8b5cf6' }}>Target:</strong> 
                    <span>{targetName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa' }} />
                    <strong style={{ color: '#a78bfa' }}>Type:</strong> 
                    <span>{isClassifier ? 'Classification' : 'Regression'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00b894' }} />
                    <strong style={{ color: '#00b894' }}>Domain:</strong> 
                    <span>{activePipeline.results?.domain || 'General'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                  >
                    
                    {/* Glowing result */}
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                      style={{ 
                        padding: '20px 24px', 
                        borderRadius: 'var(--radius-lg)', 
                        background: 'linear-gradient(135deg, rgba(0,184,148,0.08) 0%, rgba(16,185,129,0.05) 100%)', 
                        border: '2px solid rgba(0,184,148,0.2)', 
                        textAlign: 'center', 
                        boxShadow: '0 8px 32px rgba(0,184,148,0.15), 0 0 0 1px rgba(0,184,148,0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Animated background shimmer */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(0,184,148,0.1), transparent)',
                        animation: 'shimmer 3s ease-in-out infinite'
                      }} />
                      
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-tertiary)', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.1em', 
                          marginBottom: 8,
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        🎯 Predicted {targetName}
                      </motion.div>
                      
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        style={{ 
                          fontSize: '2.8rem', 
                          fontWeight: 900, 
                          background: 'linear-gradient(135deg, #00b894 0%, #10b981 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          position: 'relative',
                          zIndex: 1,
                          textShadow: '0 2px 4px rgba(0,184,148,0.2)'
                        }}
                      >
                        {formatPredictionValue(predictionResult.prediction)}
                      </motion.div>
                      
                      {/* Floating success particles */}
                      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 4, height: 4, borderRadius: '50%', background: '#00b894', opacity: 0.6, animation: 'float 3s ease-in-out infinite' }} />
                      <div style={{ position: 'absolute', bottom: '25%', right: '20%', width: 3, height: 3, borderRadius: '50%', background: '#10b981', opacity: 0.4, animation: 'float 4s ease-in-out infinite 1s' }} />
                    </motion.div>

                    {/* Probabilities Distribution (Classification only) */}
                    <AnimatePresence>
                      {predictionResult.probabilities && Object.keys(predictionResult.probabilities).length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.h5 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 700, 
                              color: 'var(--text-tertiary)', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em',
                              marginBottom: 16,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            📊 Probability Distribution
                          </motion.h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Object.entries(predictionResult.probabilities).map(([classes, prob], idx) => {
                              const percent = Math.round(prob * 100);
                              const active = String(classes) === String(predictionResult.prediction);
                              return (
                                <motion.div 
                                  key={classes}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.6 + idx * 0.1, type: "spring", stiffness: 200 }}
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 14,
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: active ? 'rgba(0,184,148,0.05)' : 'transparent',
                                    border: active ? '1px solid rgba(0,184,148,0.2)' : '1px solid transparent',
                                    transition: 'all var(--transition-base)'
                                  }}
                                >
                                  <span style={{ 
                                    fontSize: '0.8rem', 
                                    width: 120, 
                                    fontWeight: active ? 700 : 500, 
                                    color: active ? '#00b894' : 'var(--text-secondary)', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis' 
                                  }}>
                                    {targetName.toLowerCase().includes('member') ? `${classes} Member${Number(classes) > 1 ? 's' : ''}` : classes}
                                  </span>
                                  
                                  <div style={{ 
                                    flex: 1, 
                                    height: 12, 
                                    background: 'var(--bg-tertiary)', 
                                    borderRadius: 'var(--radius-full)', 
                                    overflow: 'hidden', 
                                    border: '1px solid var(--border-subtle)',
                                    position: 'relative'
                                  }}>
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percent}%` }}
                                      transition={{ delay: 0.7 + idx * 0.1, duration: 0.8, ease: "easeOut" }}
                                      style={{ 
                                        height: '100%', 
                                        background: active ? 
                                          'linear-gradient(90deg, #00b894 0%, #10b981 100%)' : 
                                          'linear-gradient(90deg, rgba(0,184,148,0.4) 0%, rgba(16,185,129,0.4) 100%)', 
                                        borderRadius: 'var(--radius-full)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }} 
                                    >
                                      {active && (
                                        <div style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                          animation: 'shimmer 2s ease-in-out infinite'
                                        }} />
                                      )}
                                    </motion.div>
                                  </div>
                                  
                                  <motion.span 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + idx * 0.1 }}
                                    style={{ 
                                      fontSize: '0.8rem', 
                                      width: 50, 
                                      textAlign: 'right', 
                                      fontWeight: active ? 800 : 600, 
                                      color: active ? '#00b894' : 'var(--text-tertiary)' 
                                    }}
                                  >
                                    {percent}%
                                  </motion.span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Live System Performance Telemetry */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}
        >
          {[
            {
              label: 'Local Serving Model',
              value: serverState === 'connected' ? (serverInfo ? serverInfo.model_name : 'Support Vector Classifier') : '—',
              detail: serverState === 'connected' ? `API Version: ${serverInfo?.model_version || '1.0'}` : 'Offline',
              icon: Cpu,
              color: '#8b5cf6',
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
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ 
                  y: -5, 
                  boxShadow: `0 12px 40px ${card.color}20` 
                }}
                className="glass-card telemetry-card" 
                style={{ 
                  padding: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 18,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: serverState === 'connected' ? `${card.color}30` : 'var(--border-subtle)'
                }}
              >
                {/* Animated background for connected state */}
                {serverState === 'connected' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${card.color}08, transparent)`,
                    animation: 'shimmer 4s ease-in-out infinite'
                  }} />
                )}
                
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ 
                    width: 52, 
                    height: 52, 
                    borderRadius: 16, 
                    background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}08 100%)`, 
                    border: `2px solid ${card.color}25`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: `0 4px 20px ${card.color}20`
                  }}
                >
                  <Icon size={24} color={card.color} />
                  
                  {/* Pulsing ring for active state */}
                  {serverState === 'connected' && (
                    <div style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      border: `2px solid ${card.color}30`,
                      animation: 'pulse-ring 3s ease-out infinite'
                    }} />
                  )}
                </motion.div>
                
                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-tertiary)', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      marginBottom: 4 
                    }}
                  >
                    {card.label}
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + idx * 0.1, type: "spring", stiffness: 200 }}
                    style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 800, 
                      color: serverState === 'connected' ? card.color : 'var(--text-tertiary)',
                      marginBottom: 2,
                      textShadow: serverState === 'connected' ? `0 2px 8px ${card.color}30` : 'none'
                    }}
                  >
                    {card.value}
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + idx * 0.1 }}
                    style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--text-tertiary)', 
                      lineHeight: 1.3 
                    }}
                  >
                    {card.detail}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Telemetry Charts */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}
        >
          {/* Latency History */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
            className="glass-card chart-card" 
            style={{ 
              padding: 28,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <motion.h4 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                style={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                📈 Live Endpoint Latency (ms)
              </motion.h4>
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-tertiary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(108,92,231,0.1)',
                  border: '1px solid rgba(108,92,231,0.2)'
                }}
              >
                ⚡ Refreshes on prediction
              </motion.span>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={latencyHistory}>
                  <defs>
                    <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                    label={{ 
                      value: 'Latency (ms)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } 
                    }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6c5ce7" 
                    fill="url(#latGrad)" 
                    strokeWidth={3}
                    dot={{ fill: '#6c5ce7', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#6c5ce7', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>

          {/* System Load */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
            className="glass-card chart-card" 
            style={{ 
              padding: 28,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.h4 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              style={{ 
                fontWeight: 700, 
                marginBottom: 24, 
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              📊 Prediction API Load
            </motion.h4>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={predictionVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill="url(#barGrad)" 
                    name="API Queries" 
                    radius={[4, 4, 0, 0]} 
                    opacity={0.9}
                  />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00cec9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#00cec9" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
}
