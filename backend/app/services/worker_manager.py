import asyncio
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.config import get_settings
from app.models.queue_system import QueueJob, WorkerStatus
from app.models.crawler import CrawlQueueItem, CrawlExtraction
from app.models.source import GovernmentSource
from app.services.queue_manager import queue_manager
from app.services.quality_engine import quality_engine
from app.services.ai_pipeline import ai_pipeline
from app.services.sync_engine import sync_engine

logger = logging.getLogger("yojana.worker.manager")
settings = get_settings()


class WorkerManagerService:
    """
    Orchestrates the lifecycle of background worker tasks, coordinates
    worker heartbeats, handles task dispatching, and monitors concurrency constraints.
    """

    def __init__(self):
        self._workers: List[asyncio.Task] = []
        self._running = False
        self.worker_pool_size = settings.worker_pool_size
        self.heartbeat_interval = settings.worker_heartbeat_interval

        # Metrics cache per worker
        self._worker_stats = {}

        # Connection pooled client for worker-triggered HTTP crawls
        self.client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            timeout=httpx.Timeout(10.0, connect=5.0)
        )

    def start_worker_pool(self):
        """Starts the worker loop tasks."""
        if self._running:
            return

        self._running = True
        logger.info(f"Worker Pool Started with {self.worker_pool_size} concurrent workers.")

        for i in range(self.worker_pool_size):
            worker_id = f"worker_{uuid.uuid4().hex[:8]}"
            self._worker_stats[worker_id] = {
                "completed": 0,
                "failed": 0,
                "restarts": 0
            }
            # Start worker loop task
            task = asyncio.create_task(self.worker_loop(worker_id))
            self._workers.append(task)

    def stop_worker_pool(self):
        """Cancels all active worker loop tasks and triggers graceful worker stops."""
        if not self._running:
            return

        self._running = False
        logger.info("Graceful Shutdown: Stopping worker pool...")
        for task in self._workers:
            task.cancel()
        self._workers.clear()

        # Close connection pooled client
        asyncio.create_task(self.client.aclose())

    async def worker_loop(self, worker_id: str):
        """Continuous execution loop polling the queue for jobs and executing them."""
        # Initial worker registration
        async with async_session() as db:
            ws = WorkerStatus(
                id=worker_id,
                status="idle",
                last_heartbeat=datetime.utcnow()
            )
            db.add(ws)
            await db.commit()

        logger.info(f"Worker Started: {worker_id}")
        heartbeat_task = asyncio.create_task(self.heartbeat_loop(worker_id))

        try:
            while self._running:
                # Poll database queue for next job
                async with async_session() as db:
                    job = await queue_manager.get_next_job(db, worker_id)

                if not job:
                    # Queue is empty, sleep and poll again
                    await asyncio.sleep(1.0)
                    continue

                # Transition worker status to active
                await self._update_worker_state(worker_id, status="active", increment_running=1)

                # Set execution context variables for logging and tracing (Phase 21)
                from app.utils.observability import trace_id_var, request_id_var, job_id_var, JOB_SUCCESS_RATE
                import uuid
                import time
                payload = job.payload or {}
                trace_id = payload.get("_trace_id") or f"tr_{uuid.uuid4().hex[:16]}"
                req_id = payload.get("_request_id") or f"req_{uuid.uuid4().hex[:16]}"
                
                t_token = trace_id_var.set(trace_id)
                r_token = request_id_var.set(req_id)
                j_token = job_id_var.set(job.id)

                start_task_time = time.perf_counter()
                try:
                    # Execute task under timeout limits
                    max_duration = float(job.max_retries * 60 or 300)
                    await asyncio.wait_for(
                        self.execute_task(job.id, job.task_name, job.payload),
                        timeout=max_duration
                    )

                    # Update database job state to Completed
                    async with async_session() as db:
                        await queue_manager.handle_job_success(db, job.id)

                    self._worker_stats[worker_id]["completed"] += 1
                    logger.info(f"Worker Finished: job {job.id} executed successfully by {worker_id}")
                    
                    # Record job metrics
                    JOB_SUCCESS_RATE.labels(job_name=job.task_name, status="success").inc()

                except asyncio.TimeoutError:
                    error_msg = f"Task execution exceeded timeout limit of {max_duration} seconds."
                    logger.error(f"Job Failed: worker {worker_id} on job {job.id} timed out.")
                    async with async_session() as db:
                        await queue_manager.handle_job_failure(db, job.id, error_msg)
                    self._worker_stats[worker_id]["failed"] += 1
                    JOB_SUCCESS_RATE.labels(job_name=job.task_name, status="failed").inc()

                except Exception as e:
                    error_msg = str(e)
                    logger.error(f"Job Failed: worker {worker_id} on job {job.id} failed with error: {e}", exc_info=True)
                    async with async_session() as db:
                        await queue_manager.handle_job_failure(db, job.id, error_msg)
                    self._worker_stats[worker_id]["failed"] += 1
                    JOB_SUCCESS_RATE.labels(job_name=job.task_name, status="failed").inc()

                finally:
                    # Reset context variables (Phase 21)
                    trace_id_var.reset(t_token)
                    request_id_var.reset(r_token)
                    job_id_var.reset(j_token)
                    # Transition worker status back to idle
                    await self._update_worker_state(worker_id, status="idle", increment_running=-1)

                # Small spacing delay between task claims
                await asyncio.sleep(0.1)

        except asyncio.CancelledError:
            logger.info(f"Worker stopped: {worker_id}")
        finally:
            heartbeat_task.cancel()
            # Register worker exit/shutdown state
            async with async_session() as db:
                ws = await db.get(WorkerStatus, worker_id)
                if ws:
                    ws.status = "stopped"
                    ws.last_heartbeat = datetime.utcnow()
                    ws.running_jobs_count = 0
                    db.add(ws)
                    await db.commit()

    async def heartbeat_loop(self, worker_id: str):
        """Periodically reports worker CPU/Memory usage and heartbeat check dates."""
        try:
            while self._running:
                # Retrieve metrics safely without psutil dependency requirements
                cpu_val = 1.0
                mem_val = 40.0
                try:
                    import psutil
                    cpu_val = psutil.cpu_percent()
                    mem_val = psutil.virtual_memory().percent
                except ImportError:
                    pass

                async with async_session() as db:
                    ws = await db.get(WorkerStatus, worker_id)
                    if ws:
                        ws.last_heartbeat = datetime.utcnow()
                        ws.cpu_usage = cpu_val
                        ws.memory_usage = mem_val
                        ws.completed_jobs_count = self._worker_stats[worker_id]["completed"]
                        ws.failed_jobs_count = self._worker_stats[worker_id]["failed"]
                        ws.restart_count = self._worker_stats[worker_id]["restarts"]
                        db.add(ws)
                        await db.commit()

                # Queue Statistics logging
                logger.debug(f"Worker Heartbeat: {worker_id} | CPU: {cpu_val}% | Mem: {mem_val}%")
                await asyncio.sleep(float(self.heartbeat_interval))
        except asyncio.CancelledError:
            pass

    async def _update_worker_state(self, worker_id: str, status: str, increment_running: int):
        """Helper to increment/decrement active worker loop execution counts."""
        async with async_session() as db:
            ws = await db.get(WorkerStatus, worker_id)
            if ws:
                ws.status = status
                ws.running_jobs_count = max(0, ws.running_jobs_count + increment_running)
                db.add(ws)
                await db.commit()

    async def execute_task(self, job_id: str, task_name: str, payload: Dict[str, Any]):
        """Dispatches job tasks directly to standard project service modules."""
        async with async_session() as db:
            if task_name == "crawl_source":
                source_id = payload.get("source_id")
                from app.utils.observability import CRAWLER_SUCCESS_RATE, CRAWLER_SUCCESS
                src = None
                try:
                    src = await db.get(GovernmentSource, source_id)
                    if not src:
                        raise ValueError(f"GovernmentSource {source_id} not found")

                    raw_html = None
                    if src.notes and "mock_html:" in src.notes:
                        raw_html = src.notes.split("mock_html:")[1].strip()
                    else:
                        resp = await self.client.get(src.website_url, timeout=10.0)
                        if resp.status_code == 200:
                            raw_html = resp.text
                        else:
                            raise ValueError(f"HTTP crawl error status {resp.status_code}")

                    # Process through quality engine (HTML Clean & Page Filter stages)
                    queue_item, status, info = await quality_engine.process_page(
                        db,
                        url=src.website_url,
                        raw_html=raw_html,
                        http_status=200,
                        response_time=0.1
                    )

                    if queue_item and status == "accepted":
                        # Enqueue next stage: AI Extraction (High Priority)
                        await queue_manager.enqueue_job(
                            db,
                            task_name="process_ai",
                            payload={"queue_item_id": queue_item.id},
                            priority=3  # Higher priority to process incoming crawled items faster
                        )
                    CRAWLER_SUCCESS_RATE.labels(source=src.name, status="success").inc()
                    CRAWLER_SUCCESS.inc()
                except Exception as crawl_err:
                    source_name = src.name if src else f"source_{source_id}"
                    CRAWLER_SUCCESS_RATE.labels(source=source_name, status="failed").inc()
                    raise crawl_err

            elif task_name == "process_ai":
                queue_item_id = payload.get("queue_item_id")
                ext, status, err = await ai_pipeline.process_queue_item(db, queue_item_id)
                if not ext or status != "success":
                    raise ValueError(f"AI Processing failed: {err}")

                # Enqueue next stage: Database Synchronization
                await queue_manager.enqueue_job(
                    db,
                    task_name="database_sync",
                    payload={"extraction_id": ext.id, "scan_id": f"scan_q_{job_id[:8]}"},
                    priority=2
                )

            elif task_name == "database_sync":
                extraction_id = payload.get("extraction_id")
                scan_id = payload.get("scan_id", "scan_worker")

                ext = await db.get(CrawlExtraction, extraction_id)
                if not ext:
                    raise ValueError(f"CrawlExtraction {extraction_id} not found")

                q_item = await db.get(CrawlQueueItem, ext.queue_item_id)
                source_url = q_item.url if q_item else None
                clean_text = q_item.clean_text if q_item else ""

                sync_payload = {
                    "canonical_name": ext.extracted_data.get("scheme_name"),
                    "short_description": ext.extracted_data.get("short_description") or ext.extracted_data.get("description"),
                    "benefits": ext.extracted_data.get("benefits"),
                    "eligibility": ext.extracted_data.get("eligibility"),
                    "required_documents": ext.extracted_data.get("required_documents"),
                    "application_process": ext.extracted_data.get("application_process"),
                    "official_url": ext.extracted_data.get("official_url") or ext.extracted_data.get("application_url"),
                    "department": ext.extracted_data.get("department"),
                    "ministry": ext.extracted_data.get("ministry"),
                    "state": ext.extracted_data.get("state"),
                    "source_url": source_url,
                    "confidence_score": ext.validation_report.get("confidence_score", 0.0) if ext.validation_report else 0.0,
                    "clean_text": clean_text
                }

                # sync_batch handles Sync, Version History, and Lifecycles reviews
                await sync_engine.sync_batch(db, [sync_payload], scan_id)

            else:
                raise ValueError(f"Unsupported task name: {task_name}")


# Singleton
worker_manager = WorkerManagerService()
