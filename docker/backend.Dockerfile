FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Ensure baidusearch/googlesearch-python are installed if not in requirements.txt (they are in my context edit, but safe to ensure)
RUN pip install --no-cache-dir baidusearch googlesearch-python

# Install Playwright browsers
RUN playwright install --with-deps chromium

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
