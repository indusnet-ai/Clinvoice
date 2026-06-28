"""
ARQ Worker Entrypoint

Run this script to start the background worker process.

Usage:
    python run_worker.py

Docker:
    docker-compose up worker
"""

import asyncio
import logging
from arq import run_worker

from workers.tasks import WorkerSettings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


if __name__ == "__main__":
    logger.info("Starting ARQ worker...")
    run_worker(WorkerSettings)
