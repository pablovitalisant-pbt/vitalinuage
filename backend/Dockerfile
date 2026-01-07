FROM python:3.11-slim

# Install system dependencies for WeasyPrint/ReportLab
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libgobject-2.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
