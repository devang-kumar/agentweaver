FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any (e.g., for certain Python packages)
# RUN apt-get update && apt-get install -y --no-install-recommends <package-name> && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ./app /app/app
COPY ./model.pkl /app/model.pkl
COPY ./healthcare_dataset.csv /app/healthcare_dataset.csv

# Create a non-root user for security
RUN adduser --system --group appuser
USER appuser

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3
CMD curl --fail http://localhost:8000/health || exit 1

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
