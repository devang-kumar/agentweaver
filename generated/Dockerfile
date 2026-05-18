FROM python:3.11-slim

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
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1

# Command to run the application
CMD ["uvicorn", "api_app.main:app", "--host", "0.0.0.0", "--port", "8000"]
