<div align="center">

<img src="public/favicon.svg" alt="AgentWeaver Logo" width="80" height="80" />

# AgentWeaver

**An AI-powered multi-agent platform that automates the entire ML pipeline — from problem description to deployed model.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 🧠 What is AgentWeaver?

AgentWeaver is a full-stack ML automation platform where you describe a data science problem in plain English and a fleet of **9 specialized AI agents** handles everything — data analysis, model training, testing, deployment, and live monitoring.

> **"Predict customer churn using 500K rows of CRM data, deploy on AWS Lambda, HIPAA compliant"**
> → AgentWeaver parses this, runs a full ML pipeline, trains models, and serves predictions via a live API.

---

## ✨ Features

### 🤖 Multi-Agent Orchestration
A fleet of 9 specialized agents that collaborate to run your ML pipeline end-to-end:

| Agent | Role |
|-------|------|
| **Orchestrator** | Parses problem statements, delegates tasks, coordinates the fleet |
| **Data Analyst** | Audits datasets, handles missing values, detects outliers |
| **Model Builder** | Trains multiple model candidates, runs Optuna hyperparameter tuning |
| **Testing Agent** | Validates accuracy, runs bias audits, security scans, inference benchmarks |
| **Deployment Agent** | Packages models, generates FastAPI servers, handles cloud deployment |
| **Monitoring Agent** | Tracks latency, error rates, drift detection, Prometheus/Grafana setup |
| **Optimization Agent** | Quantization, ensemble strategies, auto-retrain triggers |
| **Healing Agent** | Detects failures and bias, triggers retraining with balanced sampling |
| **Learning Agent** | Builds knowledge base from past runs, saves pipeline templates |

### 🚀 Pipeline Orchestration
- **Natural language input** — describe your ML problem in plain English
- **Auto-detection** of domain, problem type, data size, deploy target, compliance requirements, and latency constraints
- **Real CSV upload** — upload your own dataset for live browser-based neural network training
- **AI-synthesized datasets** — auto-generates realistic training data if no CSV is provided
- **Live pipeline logs** — real-time terminal output as each agent works
- **TensorFlow.js training** — actual neural network training runs directly in the browser
- **Training loss curves** — live visualization of model training progress

### 📊 Live Monitoring & Prediction Playground
- **Dynamic prediction playground** — updates automatically when a new pipeline completes
- **Real-time inference** — send feature inputs and get live predictions from your deployed model
- **Live telemetry charts** — latency history, prediction volume, error rate tracking
- **Server health monitoring** — auto-polls your local FastAPI server every 5 seconds
- **Schema-aware forms** — form fields auto-configure from the API's OpenAPI schema
- **Inference output panel** — displays prediction class, probabilities, and confidence scores

### 🎨 Modern UI/UX
- **Dark theme** with deep navy backgrounds and purple accent colors
- **Framer Motion animations** — spring physics, staggered reveals, hover effects
- **Glass morphism cards** with subtle borders and backdrop blur
- **Responsive layout** with smooth transitions
- **Shimmer effects** and floating particle animations
- **Real-time status badges** with glowing indicators

### ⚙️ Settings & Configuration
- **Gemini API key** integration for AI-powered code generation
- **GitHub integration** — push generated code directly to a repository
- **Cloud provider settings** — AWS, GCP, Azure, Kubernetes
- **Model defaults** — Optuna trials, candidate count, framework selection
- **Monitoring thresholds** — latency targets, error rate alerts, drift detection
- **Security & compliance** — HIPAA, GDPR, SOC2, PCI-DSS modes

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | UI framework |
| **Vite** | 5 | Build tool & dev server |
| **React Router** | 7 | Client-side routing |
| **Framer Motion** | 12 | Animations & transitions |
| **Recharts** | 3 | Live telemetry charts |
| **TensorFlow.js** | 4 | In-browser model training |
| **Lucide React** | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.100+ | REST API server |
| **Python** | 3.10+ | Backend runtime |
| **Scikit-learn** | Latest | ML model training |
| **Pandas** | Latest | Data processing |
| **Joblib** | Latest | Model serialization |
| **Uvicorn** | Latest | ASGI server |
| **Pydantic** | v2 | Schema validation |

### Database & Infrastructure
| Technology | Purpose |
|-----------|---------|
| **MongoDB** | Pipeline history persistence |
| **Docker** | Containerization |
| **Docker Compose** | Multi-service orchestration |
| **Nginx** | Static file serving |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (optional, for full stack)

### 1. Clone the Repository
```bash
git clone https://github.com/devang-kumar/agentweaver.git
cd agentweaver
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Start the Frontend
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Start the Backend (for predictions)
```bash
cd generated
pip install -r requirements.txt
python api_app/main.py
```
Backend runs at [http://localhost:8000](http://localhost:8000).

### 5. (Optional) Full Stack with Docker
```bash
docker-compose up --build -d
```
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure

```
agentweaver/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx          # Landing page
│   │   ├── Dashboard.jsx        # Main dashboard with pipeline history
│   │   ├── Pipeline.jsx         # Pipeline orchestration & live logs
│   │   ├── Agents.jsx           # Agent fleet status & details
│   │   ├── Monitoring.jsx       # Live predictions & telemetry
│   │   └── Settings.jsx         # API keys & configuration
│   ├── components/
│   │   ├── Layout.jsx           # App shell with navigation
│   │   └── CodePanel.jsx        # Generated code viewer
│   ├── context/
│   │   ├── PipelineContext.jsx  # Global pipeline state
│   │   └── SettingsContext.jsx  # User settings state
│   ├── engine/
│   │   ├── parser.js            # NLP problem statement parser
│   │   ├── simulator.js         # Pipeline stage simulator
│   │   ├── trainer.js           # TensorFlow.js training engine
│   │   └── codeGenerator.js     # AI code generation (Gemini)
│   ├── config/
│   │   └── agents.js            # Agent definitions & capabilities
│   └── services/
│       ├── gemini.js            # Google Gemini API integration
│       └── github.js            # GitHub API integration
├── generated/
│   ├── api_app/
│   │   └── main.py              # FastAPI prediction server
│   ├── model/
│   │   └── model.pkl            # Trained ML model
│   ├── data/
│   │   └── dataset.csv          # Training dataset
│   ├── train.py                 # Model training script
│   └── requirements.txt         # Python dependencies
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── Dockerfile                   # Frontend Docker image
├── Dockerfile.backend           # Backend Docker image
└── docker-compose.yml           # Full stack orchestration
```

---

## 🔑 Environment Variables

### Frontend (optional)
Create a `.env` file in the root:
```env
VITE_API_URL=http://localhost:8000
```

### Backend
Set these in your deployment environment:
```env
MONGO_URI=mongodb://localhost:27017/
MODEL_PATH=model/model.pkl
```

### In-App Settings
Configure these directly in the **Settings** page:
- `Gemini API Key` — for AI code generation ([get free key](https://aistudio.google.com/app/apikey))
- `GitHub Token` — for pushing generated code to GitHub
- `GitHub Username` & `Repo` — deployment target

---

## 🎯 How It Works

### 1. Describe Your Problem
```
"Predict customer churn using 500K rows of CRM data, 
deploy on AWS Lambda, HIPAA compliant, <100ms latency"
```

### 2. Parser Auto-Detects
- **Domain**: Finance / Healthcare / E-commerce / IoT / NLP / CV / HR
- **Problem Type**: Classification / Regression / Forecasting / Clustering
- **Deploy Target**: AWS Lambda / GCP / Azure / Kubernetes / Edge
- **Compliance**: HIPAA / GDPR / SOC2 / PCI-DSS
- **Latency**: Target inference time

### 3. Agents Run the Pipeline
Each of the 9 agents executes its specialized tasks in sequence, with live logs streaming to the terminal panel.

### 4. Model Gets Trained
- Multiple model candidates are evaluated
- Optuna hyperparameter optimization runs
- Champion model is selected based on the metric
- If you upload a CSV, TensorFlow.js trains a neural network live in your browser

### 5. Code Gets Generated
With a Gemini API key, the platform generates:
- Production-ready FastAPI server
- Training script with preprocessing pipeline
- Docker configuration
- Test suite

### 6. Live Predictions
The Monitoring page connects to your local FastAPI server and lets you:
- Input feature values via a dynamic form
- Get real-time predictions with probability scores
- Monitor latency, throughput, and error rates

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Devang Kumar**
- GitHub: [@devang-kumar](https://github.com/devang-kumar)
- Repository: [agentweaver](https://github.com/devang-kumar/agentweaver)

---

<div align="center">
  <p>Built with ❤️ using React, FastAPI, and a fleet of AI agents</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
