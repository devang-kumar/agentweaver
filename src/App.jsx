import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { PipelineProvider } from './context/PipelineContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Agents from './pages/Agents';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <PipelineProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PipelineProvider>
    </SettingsProvider>
  );
}
