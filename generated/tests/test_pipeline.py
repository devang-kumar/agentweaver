import pytest
import httpx
import pandas as pd
import joblib
from app.main import app, PredictionRequest
from sklearn.pipeline import Pipeline

TEST_URL = "http://localhost:8000"

@pytest.fixture(scope="module")
def client():
    # Use httpx's ASGITestClient to test the FastAPI app directly
    with httpx.Client(app=app, base_url=TEST_URL) as client:
        yield client

@pytest.pytest.fixture(autouse=True, scope="module")
def setup_model():
    # Ensure model.pkl exists for testing
    # In a real scenario, this might involve running train.py or having a pre-built model
    try:
        # Attempt to load the model to ensure it's available
        model = joblib.load('model.pkl')
        assert isinstance(model, Pipeline)
        print("\nModel loaded successfully for testing.")
    except FileNotFoundError:
        pytest.fail("model.pkl not found. Please run train.py first.")
    except Exception as e:
        pytest.fail(f"Failed to load model.pkl: {e}")


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_predict_success(client):
    # Create a sample request matching the Pydantic model
    sample_data = {
        "Mthly_HH_Income": 60000.0,
        "Mthly_HH_Expense": 30000.0,
        "No_of_Fly_Members": 5,
        "Emi_or_Rent_Amt": 20000.0,
        "Annual_HH_Income": 720000.0
    }
    response = client.post("/predict", json=sample_data)
    assert response.status_code == 200
    response_data = response.json()
    assert "prediction" in response_data
    assert "probability" in response_data
    assert isinstance(response_data["prediction"], int)
    assert isinstance(response_data["probability"], float)
    # Basic validation on prediction range (assuming binary classification 0 or 1)
    assert response_data["prediction"] in [0, 1]
    assert 0.0 <= response_data["probability"] <= 1.0

def test_predict_validation_error(client):
    # Missing a required field
    sample_data = {
        "Mthly_HH_Income": 60000.0,
        "Mthly_HH_Expense": 30000.0,
        # Missing No_of_Fly_Members
        "Emi_or_Rent_Amt": 20000.0,
        "Annual_HH_Income": 720000.0
    }
    response = client.post("/predict", json=sample_data)
    assert response.status_code == 422 # Unprocessable Entity

def test_predict_invalid_data_type(client):
    # Invalid data type for a field
    sample_data = {
        "Mthly_HH_Income": "invalid_float",
        "Mthly_HH_Expense": 30000.0,
        "No_of_Fly_Members": 5,
        "Emi_or_Rent_Amt": 20000.0,
        "Annual_HH_Income": 720000.0
    }
    response = client.post("/predict", json=sample_data)
    assert response.status_code == 422 # Unprocessable Entity

def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    response_data = response.json()
    assert "model_name" in response_data
    assert "model_version" in response_data
    assert response_data["model_name"] == "LightGBM Classifier"
    assert response.json() == {"model_name": "LightGBM Classifier", "model_version": "1.0"}

def test_model_loading_failure_scenario():
    # This test assumes we can temporarily make the model unavailable
    # In a real setup, you might mock the joblib.load function
    original_model_path = os.environ.get("MODEL_PATH", "model.pkl")
    os.environ["MODEL_PATH"] = "non_existent_model.pkl"
    
    # Re-initialize FastAPI app to trigger lifespan event
    from app.main import app as test_app
    from contextlib import asynccontextmanager
    
    @asynccontextmanager
    async def mock_lifespan(app):
        # Simulate loading failure
        global model
        model = None
        print("\nSimulating model loading failure.")
        yield

    test_app.lifespan_context = mock_lifespan
    
    # Need to create a client for the potentially re-initialized app
    # This part is tricky as FastAPI app instance is global. 
    # A better approach would be dependency injection for the model path.
    # For now, we'll just check if the health check fails.
    
    # Temporarily create a client for the app
    with httpx.Client(app=test_app, base_url=TEST_URL) as client:
        response = client.get("/health")
        assert response.status_code == 503
        assert "Model not loaded" in response.text

    # Restore original model path and potentially reload model if needed elsewhere
    os.environ["MODEL_PATH"] = original_model_path
    # Re-run the actual load_model to reset state if necessary for subsequent tests
    from app.main import load_model
    load_model()

