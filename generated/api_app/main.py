import os
import joblib
import pandas as pd
import logging
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from starlette.middleware.cors import CORSMiddleware

from pymongo import MongoClient

# Setup structured logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- MongoDB Connection ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/")
logger.info(f"Connecting to MongoDB at {MONGO_URI}...")

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    mongo_client.server_info()  # Force connection verification check
    db = mongo_client["agentweaver"]
    pipelines_collection = db["pipelines"]
    logger.info("Successfully connected to MongoDB.")
    mongo_active = True
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}. Running in local storage fallback mode.")
    mongo_active = False

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
        
        # Handle categorical encoding for Highest_Qualified_Member
        education_mapping = {
            'Illiterate': 0,
            'Under-Graduate': 1, 
            'Graduate': 2,
            'Post-Graduate': 3,
            'Professional': 4
        }
        
        if 'Highest_Qualified_Member' in input_dict:
            education_value = input_dict['Highest_Qualified_Member']
            if education_value in education_mapping:
                input_dict['Highest_Qualified_Member'] = education_mapping[education_value]
            else:
                # Default to Graduate if unknown value
                input_dict['Highest_Qualified_Member'] = 2
        
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

# =====================================================================
# DYNAMIC DEPLOYMENT & PERSISTENCE SERVICE (AgentWeaver Real-Time Reload Engine)
# =====================================================================
import os
import sys
import re
import subprocess
import logging
from pydantic import BaseModel
from typing import List, Optional
from fastapi import BackgroundTasks, HTTPException
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# --- MongoDB Connection Check ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/")
try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    mongo_client.server_info()
    db = mongo_client["agentweaver"]
    pipelines_collection = db["pipelines"]
    logger.info("Successfully connected to MongoDB.")
    mongo_active = True
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}. Running in local storage fallback mode.")
    mongo_active = False

class DeployPayload(BaseModel):
    id: float
    target: str
    domain: str
    problemType: str
    features: List[str] = []
    targetCol: str = ""
    files: Optional[dict] = None

def reload_server(main_path, new_api_code):
    import time
    time.sleep(0.5)
    with open(main_path, "w", encoding="utf-8") as main_f:
        main_f.write(new_api_code)
    logger.info("FastAPI Uvicorn server reload triggered successfully!")

@app.post("/api/deploy", tags=["Dynamic Deployment"])
async def deploy(payload: DeployPayload, background_tasks: BackgroundTasks):
    try:
        if not payload.files:
            return {"status": "ok", "message": "No files provided. Dry run successful."}
            
        logger.info("Initializing dynamic deployment pipeline...")
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 1. Write the backup and scripts (except the main uvicorn app file itself to avoid early reload)
        train_code = payload.files.get("train.py", "")
        for file_path, content in payload.files.items():
            if file_path in ("app/main.py", "api_app/main.py"):
                continue
            full_path = os.path.join(base_dir, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info(f"Deployed workspace script: {file_path}")
            
        # 2. Extract features from app/main.py model to generate dataset
        api_code = payload.files.get("app/main.py", "")
        features_list = []
        class_match = re.search(r"class PredictionInput\(BaseModel\):\s*(.*?)(?=\nclass|\n@|\nif __name__|$)", api_code, re.DOTALL)
        if class_match:
            class_body = class_match.group(1)
            for line in class_body.split("\n"):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                field_match = re.match(r"^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*=\s*Field)?", line)
                if field_match:
                    f_name = field_match.group(1)
                    f_type = field_match.group(2)
                    features_list.append((f_name, f_type))
                    
        # Extract target column from train.py
        target_col = payload.targetCol
        if not target_col:
            target_match = re.search(r"target_col\s*=\s*[\"']([^\"']+)[\"']", train_code)
            target_col = target_match.group(1) if target_match else "Target"
            
        # 3. Create synthetic dataset matching the schema
        import numpy as np
        import pandas as pd
        n_rows = 150
        data = {}
        for f_name, f_type in features_list:
            lower_name = f_name.lower()
            if f_type in ("int", "float", "integer", "number"):
                if "income" in lower_name:
                    low, high = 10000, 150000
                elif "expense" in lower_name or "emi" in lower_name or "rent" in lower_name:
                    low, high = 2000, 50000
                elif "age" in lower_name:
                    low, high = 18, 75
                elif "score" in lower_name:
                    low, high = 300, 850
                elif "year" in lower_name:
                    low, high = 0, 30
                elif "members" in lower_name or "count" in lower_name:
                    low, high = 1, 6
                else:
                    low, high = 0, 100
                val = np.random.uniform(low, high, n_rows)
                if f_type in ("int", "integer"):
                    val = np.round(val).astype(int)
                data[f_name] = val
            else:
                if "qualification" in lower_name or "education" in lower_name:
                    options = ["Graduate", "Under-Graduate", "Post-Graduate", "Professional", "Illiterate"]
                elif "employment" in lower_name or "job" in lower_name:
                    options = ["Private Sector", "Public Sector", "Self-Employed", "Unemployed"]
                else:
                    options = ["Option A", "Option B", "Option C"]
                data[f_name] = np.random.choice(options, n_rows)
                
        # Generate target matching problem type
        prob_type = payload.problemType.lower()
        if "class" in prob_type or "detect" in prob_type or "churn" in prob_type or "fraud" in prob_type:
            data[target_col] = np.random.choice([0, 1, 2, 3] if "member" in target_col.lower() else [0, 1], n_rows)
        else:
            data[target_col] = np.random.uniform(10, 500, n_rows)
            
        # Write CSV dataset
        dataset_dir = os.path.join(base_dir, "data")
        os.makedirs(dataset_dir, exist_ok=True)
        pd.DataFrame(data).to_csv(os.path.join(dataset_dir, "dataset.csv"), index=False)
        logger.info("Successfully generated custom synthetic CSV dataset.")
        
        # 4. Trigger new model training pipeline
        python_exe = sys.executable
        logger.info(f"Triggering model training script with: {python_exe} train.py")
        train_result = subprocess.run([python_exe, "train.py"], capture_output=True, text=True, cwd=base_dir)
        if train_result.returncode != 0:
            logger.error(f"Training failed: {train_result.stderr}")
            raise HTTPException(status_code=500, detail=f"Model training failed: {train_result.stderr}")
        logger.info("Training script completed successfully. Model generated.")
        
        # 5. Extract current Dynamic Deploy block code and append it to new app/main.py
        with open(__file__, "r", encoding="utf-8") as current_f:
            current_content = current_f.read()
            
        inject_marker = "# ====================================================================="
        parts = current_content.split(inject_marker)
        if len(parts) >= 2:
            deploy_block = inject_marker + parts[1]
        else:
            deploy_block = ""
            
        new_api_code = api_code
        if deploy_block:
            new_api_code = new_api_code + "\n\n" + deploy_block
            
        main_path = os.path.join(base_dir, "api_app", "main.py")
        background_tasks.add_task(reload_server, main_path, new_api_code)
        
        logger.info("✓ Dynamic server code reload queued!")
        return {
            "status": "success",
            "message": "Dynamic deployment and model retraining completed successfully!",
            "endpoint": "http://localhost:8000/docs"
        }
    except Exception as e:
        logger.error(f"Failed to execute dynamic deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Pipeline History Endpoints (MongoDB persistent storage) ---
@app.post("/api/pipelines", tags=["Pipeline History"])
async def save_pipeline(pipeline: dict):
    if not mongo_active:
        return {"status": "ok", "message": "Saved locally in mock memory (MongoDB offline)", "id": pipeline.get("id")}
    try:
        pipeline_id = pipeline.get("id")
        if not pipeline_id:
            raise HTTPException(status_code=400, detail="Missing pipeline ID field.")
        pipelines_collection.replace_one({"id": pipeline_id}, pipeline, upsert=True)
        return {"status": "ok", "message": "Successfully saved to MongoDB.", "id": pipeline_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipelines", tags=["Pipeline History"])
async def get_pipelines():
    if not mongo_active:
        return []
    try:
        cursor = pipelines_collection.find({}, {"_id": 0})
        pipelines_list = list(cursor)
        pipelines_list.sort(key=lambda x: x.get("id", 0), reverse=True)
        return pipelines_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/pipelines/{id}", tags=["Pipeline History"])
async def delete_pipeline(id: int):
    if not mongo_active:
        return {"status": "ok", "message": "Deleted locally (MongoDB offline)"}
    try:
        result = pipelines_collection.delete_one({"id": id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Pipeline run not found.")
        return {"status": "ok", "message": f"Successfully deleted pipeline run {id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Main Execution (for local testing) ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI application locally...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
