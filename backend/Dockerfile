# ==========================================
# Builder Stage
# ==========================================
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ==========================================
# Final Runtime Runner Stage
# ==========================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime dependencies (like libpq for PostgreSQL connectivity)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Create a non-privileged system user/group to run the application
RUN groupadd -g 10001 yojana && \
    useradd -u 10001 -g yojana -s /bin/sh yojana

# Copy application backend codebase and assign ownership
COPY --chown=yojana:yojana app/ /app/app/

# Create data volumes and staging directory for sqlite and database migrations
RUN mkdir -p /app/data && chown -R yojana:yojana /app/data
VOLUME /app/data

USER yojana

EXPOSE 8000

# Portable dependency-free Python health check command
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
