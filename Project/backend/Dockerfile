FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs staticfiles media

# Set default port
ENV PORT=8000

# Expose port
EXPOSE $PORT

# Run gunicorn with stdout/stderr logs
CMD gunicorn --bind 0.0.0.0:$PORT --workers 3 --access-logfile - --error-logfile - config.wsgi:application
