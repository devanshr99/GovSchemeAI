from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.dashboard import verify_admin
from app.models.backup import BackupJob, BackupHistory, RestoreHistory, DisasterEvent, FailoverEvent
from app.services.backup_manager import backup_restore_manager
from app.services.failover_manager import failover_manager

router = APIRouter(prefix="/api/admin/backup", tags=["backups"])

@router.post("/trigger", response_model=dict, dependencies=[Depends(verify_admin)])
async def trigger_backup(
    backup_type: str = Query("manual", regex="^(manual|daily|weekly|monthly)$"),
    targets: List[str] = Query(default=["database", "files", "configs", "logs", "index"]),
    db: AsyncSession = Depends(get_db)
):
    """Triggers an instantaneous, validated backup run."""
    try:
        history = await backup_restore_manager.run_backup(
            db,
            job_name=f"Manual API Trigger",
            backup_type=backup_type,
            targets=targets
        )
        return {
            "status": "success",
            "message": "Backup completed successfully.",
            "backup_id": history.id,
            "size_bytes": history.size_bytes,
            "checksum": history.checksum,
            "path": history.backup_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup run failed: {str(e)}")

@router.post("/restore", response_model=dict, dependencies=[Depends(verify_admin)])
async def trigger_restore(
    backup_id: str = Body(..., embed=True),
    target: str = Body("full", regex="^(full|database|configs|index|files)$"),
    actor: str = Query("admin"),
    db: AsyncSession = Depends(get_db)
):
    """Restores database tables, files, or indexes from an existing backup history reference."""
    try:
        restore_log = await backup_restore_manager.run_restore(
            db,
            history_id=backup_id,
            initiated_by=actor,
            target=target
        )
        return {
            "status": "success",
            "message": f"Restore operation completed successfully for target '{target}'.",
            "restore_id": restore_log.id,
            "duration_seconds": restore_log.duration_seconds
        }
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore operation failed: {str(e)}")

@router.get("/history", response_model=list, dependencies=[Depends(verify_admin)])
async def get_backup_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Lists history logs of executed backups."""
    stmt = select(BackupHistory).order_by(desc(BackupHistory.created_at)).limit(limit)
    res = await db.execute(stmt)
    history = res.scalars().all()
    return [
        {
            "id": h.id,
            "backup_type": h.backup_type,
            "status": h.status,
            "duration_seconds": h.duration_seconds,
            "size_bytes": h.size_bytes,
            "backup_path": h.backup_path,
            "checksum": h.checksum,
            "targets": h.targets,
            "error_message": h.error_message,
            "created_at": h.created_at.isoformat() + "Z"
        }
        for h in history
    ]

@router.get("/status", response_model=dict, dependencies=[Depends(verify_admin)])
async def get_backup_status(db: AsyncSession = Depends(get_db)):
    """Fetches high-level recovery metrics, volumes, and last success timestamps."""
    last_backup_stmt = select(BackupHistory).where(BackupHistory.status == "Completed").order_by(desc(BackupHistory.created_at)).limit(1)
    last_backup = (await db.execute(last_backup_stmt)).scalars().first()

    avg_duration = (await db.execute(select(func.avg(BackupHistory.duration_seconds)).where(BackupHistory.status == "Completed"))).scalar() or 0.0
    avg_size = (await db.execute(select(func.avg(BackupHistory.size_bytes)).where(BackupHistory.status == "Completed"))).scalar() or 0.0
    failed_backups = (await db.execute(select(func.count(BackupHistory.id)).where(BackupHistory.status == "Failed"))).scalar() or 0
    failovers = (await db.execute(select(func.count(FailoverEvent.id)).where(FailoverEvent.status == "Succeeded"))).scalar() or 0

    return {
        "last_backup_time": last_backup.created_at.isoformat() + "Z" if last_backup else None,
        "last_backup_checksum": last_backup.checksum if last_backup else None,
        "average_duration_seconds": round(avg_duration, 2),
        "average_size_bytes": round(avg_size, 2),
        "failed_runs_count": failed_backups,
        "failover_events_count": failovers
    }

@router.get("/disasters", response_model=list, dependencies=[Depends(verify_admin)])
async def list_disaster_events(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Lists logged disaster recovery logs and infrastructure outages."""
    stmt = select(DisasterEvent).order_by(desc(DisasterEvent.detected_at)).limit(limit)
    res = await db.execute(stmt)
    events = res.scalars().all()
    return [
        {
            "id": e.id,
            "target": e.target,
            "severity": e.severity,
            "description": e.description,
            "detected_at": e.detected_at.isoformat() + "Z",
            "resolved_at": e.resolved_at.isoformat() + "Z" if e.resolved_at else None,
            "resolution_notes": e.resolution_notes
        }
        for e in events
    ]

@router.post("/disasters/{event_id}/resolve", response_model=dict, dependencies=[Depends(verify_admin)])
async def resolve_disaster_event(
    event_id: str,
    notes: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Manually flags an outage or disaster report resolved."""
    event = await db.get(DisasterEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Disaster event not found.")
    
    event.resolved_at = datetime.utcnow()
    event.resolution_notes = notes
    await db.commit()
    return {
        "status": "success",
        "message": f"Disaster event {event_id} marked as resolved."
    }

@router.post("/failover/trigger", response_model=dict, dependencies=[Depends(verify_admin)])
async def manual_failover_trigger(
    replica_url: str = Body(None, embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Manually forces a HA failover connection swap to simulated/real replicas."""
    # If replica URL isn't custom passed, use config Settings replica URL
    url = replica_url or failover_manager.settings.replica_database_url
    if not url:
        raise HTTPException(status_code=400, detail="No replica database URL available to switch to.")

    # Override Settings URL and execute failover
    failover_manager.settings.replica_database_url = url
    await failover_manager.trigger_failover()
    return {
        "status": "success",
        "message": "Manual DB connection failover initiated successfully."
    }
