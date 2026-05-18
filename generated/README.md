# Income-Expense Earning Members Classification API

This is a complete, production-grade Machine Learning classification system. It cleans and processes household financial profiles, trains a Support Vector Machine (SVC) classifier to predict the number of earning members in a family, and deploys a fully documented FastAPI server.

## Project Directory Layout
```
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
```

---

## 🚀 Setup & Execution (Real-World Pipeline)

Follow these simple steps to run the pipeline, train the model, execute tests, and serve predictions.

### Step 1: Initialize Virtual Environment
Create and activate a virtual environment to isolate python dependencies:
```bash
python -m venv venv

# On Windows (PowerShell/CMD)
.\venv\Scripts\activate

# On Linux/macOS
source venv/bin/activate
```

### Step 2: Install Dependencies
Install all required libraries (FastAPI, Scikit-Learn, Pandas, NumPy, Pytest, Uvicorn, etc.):
```bash
pip install -r requirements.txt
```

### Step 3: Run Model Training Pipeline
The training script will load your dataset from `data/dataset.csv`, split features, handle scaling and categorical one-hot encoding, run 5-fold cross-validation, and write `model/model.pkl`:
```bash
python train.py
```

### Step 4: Run the API Server
Start the local FastAPI development server:
```bash
uvicorn app.main:app --reload
```
*The server will boot up locally at `http://127.0.0.1:8000`.*

### Step 5: Test the API
You can access a fully interactive **Swagger UI** to send real prediction payloads directly from your browser!
*   **Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **Health Status:** `GET http://127.0.0.1:8000/health`
*   **Model Info:** `GET http://127.0.0.1:8000/metrics`

#### Example Predict Request Payload (`POST /predict`):
```json
{
  "Mthly_HH_Income": 50000.0,
  "Mthly_HH_Expense": 20000.0,
  "No_of_Fly_Members": 4,
  "Emi_or_Rent_Amt": 5000.0,
  "Annual_HH_Income": 600000.0,
  "Highest_Qualified_Member": "Graduate"
}
```

### Step 6: Run Test Suite
To verify model loading and API input-output schema integrity, execute the automated testing suite:
```bash
pytest tests/
```

---

## 🐳 Running with Docker / Docker Compose

If you have Docker installed, you can build and start the fully containerized API without configuring python locally:
```bash
# Build and launch container
docker-compose up --build
```
*The API is now served at `http://localhost:8000`.*

---

## ☁️ Production Deployment on AWS

Because the `Dockerfile` is built to standard container requirements, you can deploy this live on AWS:
1.  **AWS Elastic Container Registry (ECR):** Build, tag, and push the image to AWS ECR.
2.  **AWS Lambda (Container Image) or AWS ECS:** Create a new service and select your ECR image. The structured logging, JSON exception handling, and `/health` checkers are built to cloud-native standards!
