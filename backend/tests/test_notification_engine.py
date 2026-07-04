import pytest
import asyncio
from datetime import datetime
from sqlalchemy import select

from app.database import get_db, init_db
from app.models.notification import Notification, NotificationLog
from app.services.notification_engine import notification_engine


@pytest.mark.asyncio
async def test_notification_publishing_and_sanitization():
    """Verify notifications publish successfully and redact sensitive keys from payloads."""
    await init_db()

    async for db in get_db():
        # Setup details with sensitive fields
        details = {
            "normal_key": "ordinary value",
            "api_key": "secret-token-12345",
            "db_password": "super-private-db-pw",
            "nested_config": {
                "secret_key": "nested-token",
                "safe_port": 8000
            }
        }

        # 1. Publish notification event
        note = await notification_engine.publish_event(
            db,
            event_type="test_event",
            severity="INFO",
            title="Sanitization Test",
            message="Validating sanitization filter works.",
            details=details
        )

        assert note is not None
        assert note.title == "Sanitization Test"
        assert note.details is not None
        assert note.details["normal_key"] == "ordinary value"
        
        # Redactions assert
        assert note.details["api_key"] == "[REDACTED]"
        assert note.details["db_password"] == "[REDACTED]"
        assert note.details["nested_config"]["secret_key"] == "[REDACTED]"
        assert note.details["nested_config"]["safe_port"] == 8000

        # Wait for delivery dispatch task to complete
        await asyncio.sleep(0.5)

        # Verify logs were created
        stmt = select(NotificationLog).where(NotificationLog.notification_id == note.id)
        logs = (await db.execute(stmt)).scalars().all()
        assert len(logs) >= 2  # At least 'in_app' and 'email' channels
        channels = [log.channel for log in logs]
        assert "in_app" in channels
        assert "email" in channels

        # Cleanup
        for log in logs:
            await db.delete(log)
        await db.delete(note)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_notification_cooldown_and_deduplication():
    """Verify duplicate notification events within the cooldown window are ignored."""
    await init_db()

    async for db in get_db():
        # Publish first alert
        note_1 = await notification_engine.publish_event(
            db,
            event_type="rate_limited_event",
            severity="WARNING",
            title="Disk Space Warning",
            message="System disk space is low."
        )
        assert note_1 is not None

        # Publish duplicate alert within cooldown period
        note_2 = await notification_engine.publish_event(
            db,
            event_type="rate_limited_event",
            severity="WARNING",
            title="Disk Space Warning",
            message="System disk space is low."
        )
        # Should be None due to cooldown deduplication
        assert note_2 is None

        # Clean up
        stmt = select(NotificationLog).where(NotificationLog.notification_id == note_1.id)
        logs = (await db.execute(stmt)).scalars().all()
        for log in logs:
            await db.delete(log)
        await db.delete(note_1)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_notification_delivery_retries():
    """Verify notification delivery failures log retry attempts correctly."""
    await init_db()

    async for db in get_db():
        # Create a notification
        note = Notification(
            event_type="failed_delivery_event",
            severity="ERROR",
            title="Failed Event Test",
            message="Testing channel failures."
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)

        # Register a failing log entry
        log = NotificationLog(
            notification_id=note.id,
            channel="mock_failing_channel",
            status="pending"
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)

        # Trigger delivery channel fail manually
        # If we execute delivery on a custom channel that has no delivery logic,
        # it throws exceptions in deliver_to_channel, prompting retries
        await notification_engine._deliver_to_channel(
            log.id, note.title, note.message, note.severity, note.details
        )

        # Refresh log to inspect retry status
        await db.refresh(log)
        assert log.status == "retrying"
        assert log.retry_count == 1
        assert log.error_message is not None

        # Cleanup
        await db.delete(log)
        await db.delete(note)
        await db.commit()
        break
