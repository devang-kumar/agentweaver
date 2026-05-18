/**
 * Local Workspace Backup Codebase
 * Contains the actual production code files matching the pre-trained local model.
 * Serves as an instant offline fallback if the Gemini API is rate-limited or unconfigured.
 */
export const LOCAL_BACKUP_CODEBASE = {
  "train.py": `import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
import os

def load_data(filepath='data/dataset.csv'):
    """Loads data from a CSV file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}. Please place your CSV file there.")
    return pd.read_csv(filepath)

def preprocess_data(df):
    """Preprocesses the data: handles nulls and categoricals."""
    target_col = "No_of_Earning_Members"
    
    if target_col in df.columns:
        y = df[target_col]
        X = df.drop(columns=[target_col])
    else:
        # Fallback to last column as target if target_col not found
        y = df.iloc[:, -1]
        X = df.iloc[:, :-1]
        target_col = df.columns[-1]

    print(f"Target column detected: '{target_col}'")
    print(f"Features: {list(X.columns)}")

    # Identify categorical and numerical features
    categorical_features = X.select_dtypes(include=['object', 'category']).columns
    numerical_features = X.select_dtypes(include=['int64', 'float64']).columns

    # Create preprocessing pipelines for numerical and categorical features
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    # Combine preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    return preprocessor, X, y

def train_model(X, y, preprocessor):
    """Trains an SVM (RBF) model with cross-validation."""
    # Create the full pipeline with preprocessing and SVM
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', SVC(kernel='rbf', probability=True, random_state=42))
    ])

    # Convert y to classification labels
    unique_y = y.unique()
    print(f"Unique classes in target: {list(unique_y)}")

    # Cross-validation score (Accuracy because it's multi-class classification)
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"Cross-validation accuracy scores: {cv_scores}")
    print(f"Mean CV Accuracy: {cv_scores.mean():.3f}")

    # Train the model on the entire dataset
    model.fit(X, y)
    return model, cv_scores.mean()

def save_model(model, filepath='model/model.pkl'):
    """Saves the trained model."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    joblib.dump(model, filepath)
    print(f"Model saved successfully to {filepath}")

if __name__ == "__main__":
    print("Starting real-world model training pipeline...")
    try:
        data = load_data()
        preprocessor, X, y = preprocess_data(data)
        trained_model, mean_acc = train_model(X, y, preprocessor)
        save_model(trained_model)
        print(f"Training successfully completed! Mean Accuracy: {mean_acc:.3f}")
    except FileNotFoundError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during training: {e}")
`,

  "app/main.py": `import os
import joblib
import pandas as pd
import logging
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from starlette.middleware.cors import CORSMiddleware

# Setup structured logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
MODEL_PATH = os.environ.get("MODEL_PATH", "model/model.pkl")

# --- Load Model ---
def load_model():
    """Loads the trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        logger.error(f"Model file not found at {MODEL_PATH}")
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
    try:
        model = joblib.load(MODEL_PATH)
        logger.info(f"Model loaded successfully from {MODEL_PATH}")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise RuntimeError(f"Could not load model: {e}")

# --- Pydantic Models for Schema Validation ---
class HealthResponse(BaseModel):
    status: str

class PredictionInput(BaseModel):
    Mthly_HH_Income: float = Field(..., example=50000.0, description="Monthly Household Income")
    Mthly_HH_Expense: float = Field(..., example=20000.0, description="Monthly Household Expense")
    No_of_Fly_Members: int = Field(..., example=4, description="Number of Family Members")
    Emi_or_Rent_Amt: float = Field(..., example=5000.0, description="EMI or Rent Amount")
    Annual_HH_Income: float = Field(..., example=600000.0, description="Annual Household Income")
    Highest_Qualified_Member: str = Field(..., example="Graduate", description="Highest Qualification Level of Family Member")

class PredictionOutput(BaseModel):
    prediction: int = Field(..., description="Predicted number of earning members")
    probabilities: dict = Field(..., description="Prediction probabilities for each class")

class MetricsResponse(BaseModel):
    model_name: str
    model_version: str
    classes: List[int]

# --- FastAPI App ---
app = FastAPI(
    title="Income-Expense Classification API",
    description="Production-ready API to predict the number of earning members in a household based on financial profiles.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---
@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def health_check():
    """Checks the health of the API and model loading."""
    try:
        load_model()
        logger.info("Health check successful.")
        return HealthResponse(status="ok")
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Model not available: {e}")

@app.post("/predict", response_model=PredictionOutput, tags=["Prediction"])
async def predict(input_data: PredictionInput):
    """Makes a prediction for a household's number of earning members."""
    try:
        # Load model dynamically
        model = load_model()
        
        # Convert input features to DataFrame with appropriate columns
        input_dict = input_data.model_dump()
        df_input = pd.DataFrame([input_dict])
        
        # Predict class
        prediction = model.predict(df_input)[0]
        
        # Predict probabilities
        probabilities = model.predict_proba(df_input)[0]
        classes = model.classes_
        
        prob_dict = {int(c): float(p) for c, p in zip(classes, probabilities)}

        logger.info(f"Prediction successful. Input: {input_dict}, Prediction: {prediction}")
        return PredictionOutput(prediction=int(prediction), probabilities=prob_dict)

    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model file not found. Please run training pipeline first.")
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@app.get("/metrics", response_model=MetricsResponse, tags=["Monitoring"])
async def get_metrics():
    """Returns basic metrics and details about the loaded model."""
    try:
        model = load_model()
        return MetricsResponse(
            model_name="Support Vector Classifier (SVC - RBF)",
            model_version="1.0",
            classes=[int(c) for c in model.classes_]
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model metadata unavailable: {e}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI application locally...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,

  "requirements.txt": `fastapi==0.110.0
uvicorn[standard]==0.28.0
scikit-learn==1.4.1.post1
pandas==2.2.1
numpy==1.26.4
joblib==1.3.2
pytest==8.1.1
httpx==0.27.0
python-dotenv==1.0.1
`,

  "Dockerfile": `FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for curl (healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./api_app ./api_app
COPY ./model ./model
COPY train.py .

# Create a non-root user and switch to it for container security hardening
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# Healthcheck command
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD curl --fail http://localhost:8000/health || exit 1

# Command to run the application
CMD ["uvicorn", "api_app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`,

  "docker-compose.yml": `version: '3.8'

services:
  ml-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./model:/app/model  # Mount model directory for persistence
      - ./data:/app/data    # Mount data directory
    environment:
      - MODEL_PATH=/app/model/model.pkl
    healthcheck:
      test: ["CMD-SHELL", "curl --fail http://localhost:8000/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    command: uvicorn api_app.main:app --host 0.0.0.0 --port 8000
`,

  "tests/test_pipeline.py": `import pytest
import os
from fastapi.testclient import TestClient
from api_app.main import app, MODEL_PATH

@pytest.fixture(scope="session")
def client():
    """Provides a TestClient for the FastAPI app."""
    if not os.path.exists(MODEL_PATH):
        pytest.skip(f"Model file not found at {MODEL_PATH}. Skipping tests. Please train the model first.")
    return TestClient(app)

def test_health_check(client):
    """Tests the /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_predict_success(client):
    """Tests the /predict endpoint with valid household data."""
    payload = {
        "Mthly_HH_Income": 50000.0,
        "Mthly_HH_Expense": 20000.0,
        "No_of_Fly_Members": 4,
        "Emi_or_Rent_Amt": 5000.0,
        "Annual_HH_Income": 600000.0,
        "Highest_Qualified_Member": "Graduate"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    response_data = response.json()
    assert "prediction" in response_data
    assert "probabilities" in response_data
    assert isinstance(response_data["prediction"], int)
    assert isinstance(response_data["probabilities"], dict)

def test_predict_invalid_input_type(client):
    """Tests /predict with incorrect data type for monthly income."""
    payload = {
        "Mthly_HH_Income": "invalid_string_data",
        "Mthly_HH_Expense": 20000.0,
        "No_of_Fly_Members": 4,
        "Emi_or_Rent_Amt": 5000.0,
        "Annual_HH_Income": 600000.0,
        "Highest_Qualified_Member": "Graduate"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_missing_features(client):
    """Tests /predict when required keys are missing."""
    payload = {
        "Mthly_HH_Income": 50000.0,
        "Mthly_HH_Expense": 20000.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_metrics_endpoint(client):
    """Tests the /metrics endpoint."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert "model_version" in data
    assert "classes" in data
    assert "SVC" in data["model_name"]
    assert isinstance(data["classes"], list)
`,

  "README.md": `# Income-Expense Earning Members Classification API

This is a complete, production-grade Machine Learning classification system. It cleans and processes household financial profiles, trains a Support Vector Machine (SVC) classifier to predict the number of earning members in a family, and deploys a fully documented FastAPI server.

## Project Directory Layout
\`\`\`
generated/
├── app/
│   ├── __init__.py
│   └── main.py          # FastAPI application server
├── data/
│   └── dataset.csv      # Real CSV dataset
├── model/
│   └── model.pkl        # Serialized SVM model (created upon training)
├── tests/
│   ├── __init__.py
│   └── test_pipeline.py # Comprehensive Pytest suite
├── Dockerfile           # Secure container build file
├── docker-compose.yml   # Multi-service docker orchestration
├── requirements.txt     # Python dependency list
├── train.py             # Feature engineering & training script
└── README.md            # Technical documentation
\`\`\`

---

## 🚀 Setup & Execution (Real-World Pipeline)

Follow these simple steps to run the pipeline, train the model, execute tests, and serve predictions.

### Step 1: Initialize Virtual Environment
Create and activate a virtual environment to isolate python dependencies:
\`\`\`bash
python -m venv venv

# On Windows (PowerShell/CMD)
.\\\\venv\\\\Scripts\\\\activate

# On Linux/macOS
source venv/bin/activate
\`\`\`

### Step 2: Install Dependencies
Install all required libraries (FastAPI, Scikit-Learn, Pandas, NumPy, Pytest, Uvicorn, etc.):
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Step 3: Run Model Training Pipeline
The training script will load your dataset from \`data/dataset.csv\`, split features, handle scaling and categorical one-hot encoding, run 5-fold cross-validation, and write \`model/model.pkl\`:
\`\`\`bash
python train.py
\`\`\`

### Step 4: Run the API Server
Start the local FastAPI development server:
\`\`\`bash
uvicorn app.main:app --reload
\`\`\`
*The server will boot up locally at \`http://127.0.0.1:8000\`.*

### Step 5: Test the API
You can access a fully interactive **Swagger UI** to send real prediction payloads directly from your browser!
*   **Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **Health Status:** \`GET http://127.0.0.1:8000/health\`
*   **Model Info:** \`GET http://127.0.0.1:8000/metrics\`

#### Example Predict Request Payload (\`POST /predict\`):
\`\`\`json
{
  "Mthly_HH_Income": 50000.0,
  "Mthly_HH_Expense": 20000.0,
  "No_of_Fly_Members": 4,
  "Emi_or_Rent_Amt": 5000.0,
  "Annual_HH_Income": 600000.0,
  "Highest_Qualified_Member": "Graduate"
}
\`\`\`

### Step 6: Run Test Suite
To verify model loading and API input-output schema integrity, execute the automated testing suite:
\`\`\`bash
pytest tests/
\`\`\`

---

## 🐳 Running with Docker / Docker Compose

If you have Docker installed, you can build and start the fully containerized API without configuring python locally:
\`\`\`bash
# Build and launch container
docker-compose up --build
\`\`\`
*The API is now served at \`http://localhost:8000\`.*
`
};
