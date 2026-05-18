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

# --- Pipeline History Endpoints (MongoDB persistent storage) ---
@app.post("/api/pipelines", tags=["Pipeline History"])
async def save_pipeline(pipeline: dict):
    """Saves a completed pipeline run to MongoDB."""
    if not mongo_active:
        logger.warning("MongoDB is offline. Saving run history mock-successfully.")
        return {"status": "ok", "message": "Saved locally in mock memory (MongoDB offline)", "id": pipeline.get("id")}
    try:
        pipeline_id = pipeline.get("id")
        if not pipeline_id:
            raise HTTPException(status_code=400, detail="Missing pipeline ID field.")
        
        # Upsert: Replace the document if id matches, otherwise insert
        pipelines_collection.replace_one({"id": pipeline_id}, pipeline, upsert=True)
        logger.info(f"Pipeline run {pipeline_id} successfully saved to MongoDB.")
        return {"status": "ok", "message": "Successfully saved to MongoDB.", "id": pipeline_id}
    except Exception as e:
        logger.error(f"Error saving pipeline to MongoDB: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipelines", tags=["Pipeline History"])
async def get_pipelines():
    """Retrieves the history of all pipeline runs from MongoDB."""
    if not mongo_active:
        logger.warning("MongoDB is offline. Returning empty history list.")
        return []
    try:
        cursor = pipelines_collection.find({}, {"_id": 0})
        # Exclude MongoDB Internal ObjectId completely to prevent JSON serialization errors
        pipelines_list = list(cursor)
        # Sort by startedAt or id descending (most recent first)
        pipelines_list.sort(key=lambda x: x.get("id", 0), reverse=True)
        logger.info(f"Retrieved {len(pipelines_list)} pipeline runs from MongoDB.")
        return pipelines_list
    except Exception as e:
        logger.error(f"Error retrieving pipelines from MongoDB: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/pipelines/{id}", tags=["Pipeline History"])
async def delete_pipeline(id: int):
    """Deletes a specific pipeline run from MongoDB by its ID."""
    if not mongo_active:
        return {"status": "ok", "message": "Deleted locally (MongoDB offline)"}
    try:
        result = pipelines_collection.delete_one({"id": id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Pipeline run not found.")
        logger.info(f"Pipeline run {id} deleted successfully from MongoDB.")
        return {"status": "ok", "message": f"Successfully deleted pipeline run {id}"}
    except Exception as e:
        logger.error(f"Error deleting pipeline run {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Main Execution (for local testing) ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI application locally...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
