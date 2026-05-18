import pytest
import os
from fastapi.testclient import TestClient
from api_app.main import app, MODEL_PATH

@pytest.fixture(scope="session")
def client():
    """Provides a TestClient for the FastAPI app."""
    # Check if model file exists before running tests that depend on it
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
    assert response.status_code == 422 # Pydantic type validation error

def test_predict_missing_features(client):
    """Tests /predict when required keys are missing."""
    payload = {
        "Mthly_HH_Income": 50000.0,
        "Mthly_HH_Expense": 20000.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 # Validation error for missing fields

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
