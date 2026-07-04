import json
import logging
import sys
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """
    Structured logging formatter that outputs log records as JSON objects.
    """
    def format(self, record: logging.LogRecord) -> str:
        # Lazy import of contextvars to prevent import circular loops
        from app.utils.observability import trace_id_var, request_id_var, job_id_var, user_id_var

        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": record.levelname,
            "service": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "filename": record.filename,
            "lineno": record.lineno,
            "trace_id": trace_id_var.get() or None,
            "request_id": request_id_var.get() or None,
            "job_id": job_id_var.get() or None,
            "user_id": user_id_var.get() or None,
        }

        # Include traceback details if an exception is present as error_details
        if record.exc_info:
            log_data["error_details"] = self.formatException(record.exc_info)

        # Include additional extra parameters if present
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_data.update(record.extra)

        return json.dumps(log_data)


def setup_production_logging(level: int = logging.INFO):
    """
    Sets up structured JSON logging for production.
    Replaces all root logger handlers with a StreamHandler configured to output JSON.
    """
    root_logger = logging.getLogger()
    
    # Remove existing handlers to avoid duplicate formats
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)
        
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    root_logger.addHandler(handler)
    root_logger.setLevel(level)

    # Set third-party logs level to prevent spam
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
