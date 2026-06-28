# Voice-to-EMR Microservice Deployment

This directory contains the Docker setup for the Voice-to-EMR service, including the Ray Serve inference engine (Whisper + Pyannote) and the main FastAPI application.

## Prerequisites

1. **Environment Variables**: Create a `.env` file in this directory (based on `core/config.py` defaults if needed).
2. **Google Credentials**: Ensure `conv-ai-sa-key.json` is present in this directory for GCS access.
3. **GPU**: An NVIDIA GPU with valid drivers (tested on L4/A100). The host must have the NVIDIA Container Toolkit installed.

## How to Run

### Option 1: Standard Deployment (Single Server)
Run the full stack (including Ray Serve for Whisper) on a GPU-enabled server:
```bash
docker compose up -d --build
```
This starts:
- `ray-serve` (Port 9000, Dashboard on 8265)
- `redis` (Port 6379)
- `app` (Port 8020)

### Option 2: CPU-only Deployment (Distributed)
If you have deployed `ray-serve` on a separate GPU server, run only the app and database here:
```bash
# 1. Update your .env with the Ray server's internal IP
# RAY_SERVE_URL=http://<GPU_SERVER_IP>:9000

# 2. Run the CPU-only stack
docker compose -f docker-compose.cpu.yml up -d --build
```
This starts only:
- `redis` (Port 6379)
- `app` (Port 8020)

### 2. Verify Status
Check if containers are running:
```bash
docker compose ps
```
All services should be `Up`. `ray-serve` might take ~1-2 minutes to become "healthy" while loading the Whisper model.

Check Ray Serve health:
```bash
curl http://localhost:9000/health
# Expected: {"status": "healthy", "model": "large-v2", ...}
```

### 3. Monitor Logs
To view logs for all services:
```bash
docker compose logs -f
```
To view logs for a specific service (e.g., ray-serve):
```bash
docker compose logs -f ray-serve
```

### 4. Stop the Stack
To stop without deleting volumes:
```bash
docker compose stop
```
To stop and remove containers/networks:
```bash
docker compose down
```

## Key Configuration
- **Concurrency**: `MAX_ONGOING_REQUESTS` in `docker-compose.yml` controls max concurrent transcriptions (Default: 1).
- **GPU Memory**: `ray-serve` cleans GPU memory after every request to prevent OOM.
- **Resilience**: All services restart automatically on failure (`restart: unless-stopped`).
