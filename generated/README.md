# Healthcare Classification API

This project provides a REST API for a healthcare classification model that predicts the 'No_of_Earning_Members' based on various household financial and demographic features.

## Features

- **Prediction Endpoint (`/predict`)**: Accepts household financial data and returns the predicted number of earning members and the associated probability.
- **Health Check (`/health`)**: Checks the status of the API and the model.
- **Metrics (`/metrics`)**: Provides information about the deployed model.
- **HIPAA Compliance**: Designed with considerations for sensitive data handling (though actual HIPAA compliance requires infrastructure and process validation).
- **Deployment**: Dockerized for easy deployment on platforms like AWS Lambda (via container image) or Kubernetes.

## Technologies Used

- **Python**: 3.11
- **FastAPI**: For building the web API.
- **Pydantic**: For data validation.
- **Scikit-learn**: For data preprocessing and model training.
- **LightGBM**: The chosen machine learning model.
- **Pandas & NumPy**: For data manipulation.
- **Joblib**: For saving and loading the trained model.
- **Docker**: For containerization.
- **Uvicorn**: ASGI server.
- **pytest**: For testing.

## Project Structure

```
.
├── app/
│   └── main.py         # FastAPI application
├── model.pkl           # Trained machine learning model
├── healthcare_dataset.csv # Dataset
├── requirements.txt    # Python dependencies
├── train.py            # Script to train the model
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose for local development
└── tests/
    └── test_pipeline.py # Pytest test cases
└── README.md           # This file
```

## Setup and Running

### 1. Prerequisites

- Docker installed and running.
- Python 3.11 installed (optional, for local testing without Docker).

### 2. Build and Run with Docker Compose

This is the recommended way to run the application locally.

**Step 1: Train the Model**

Before running the API, you need to train the model and save it as `model.pkl`. Ensure you have the `healthcare_dataset.csv` file in the root directory.

```bash
pip install -r requirements.txt # Install dependencies if not using Docker for training
python train.py
```

**Step 2: Build and Run the Docker Containers**

Navigate to the root directory of the project in your terminal.

```bash
docker-compose up --build
```

This command will:
- Build the Docker image based on the `Dockerfile`.
- Start the FastAPI application inside a container.
- Map port 8000 on your host machine to port 8000 in the container.
- Mount `model.pkl` and `healthcare_dataset.csv` into the container.

### 3. Accessing the API

Once the containers are running, you can access the API endpoints:

- **Health Check**: `http://localhost:8000/health`
- **Prediction**: `http://localhost:8000/predict` (POST request with JSON body)
- **Metrics**: `http://localhost:8000/metrics`

**Example Prediction Request (using `curl`)**:

```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "Mthly_HH_Income": 60000.0,
       "Mthly_HH_Expense": 30000.0,
       "No_of_Fly_Members": 5,
       "Emi_or_Rent_Amt": 20000.0,
       "Annual_HH_Income": 720000.0
     }'
```

### 4. Running Tests

To run the automated tests:

```bash
# Ensure model.pkl is generated first by running python train.py
python -m pytest tests/test_pipeline.py
```

Or, if Docker Compose is running:

```bash
docker-compose exec api pytest tests/test_pipeline.py
```

### 5. Stopping the Application

To stop the Docker containers:

```bash
docker-compose down
```

## Deployment Considerations (AWS Lambda)

To deploy this application on AWS Lambda using a container image:

1.  **Package**: Ensure `model.pkl` and `healthcare_dataset.csv` are included in the build context or uploaded separately.
2.  **Image**: Build the Docker image.
3.  **Push**: Push the image to Amazon ECR (Elastic Container Registry).
4.  **Lambda Function**: Create a Lambda function using the ECR container image. Configure environment variables (like `MODEL_PATH`) and memory/timeout settings appropriately.
5.  **API Gateway**: Set up an API Gateway to expose the Lambda function as a REST API.
6.  **HIPAA**: For HIPAA compliance, ensure your AWS environment is configured correctly (e.g., using services within a HIPAA-eligible region, signing a Business Associate Addendum (BAA) with AWS, and implementing appropriate security controls).

**Note**: AWS Lambda has limitations on deployment package size and execution time. For larger models or longer processing times, consider AWS Fargate or SageMaker endpoints.
