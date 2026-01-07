FROM python:3.11-slim-bookworm

# --- System ---
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV PYTHONPATH=/app

WORKDIR /app

# --- Dependencies ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Application code ---
COPY . .

# --- Runtime ---
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
