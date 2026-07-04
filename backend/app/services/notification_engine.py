import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

import httpx
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.config import get_settings
from app.models.notification import Notification, NotificationLog

logger = logging.getLogger("yojana.notification")
settings = get_settings()


class NotificationAdapterInterface:
    """Interface for notification delivery adapters."""
    async def deliver(self, title: str, message: str, severity: str, details: Optional[Dict[str, Any]] = None) -> bool:
        raise NotImplementedError


class SlackAdapter(NotificationAdapterInterface):
    """Slack delivery adapter using Webhooks."""
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    async def deliver(self, title: str, message: str, severity: str, details: Optional[Dict[str, Any]] = None) -> bool:
        if not self.webhook_url:
            return False
        payload = {
            "text": f"*{severity}*: {title}\n{message}\nDetails: {details or ''}"
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(self.webhook_url, json=payload)
                return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Slack delivery failed: {e}")
            return False


class DiscordAdapter(NotificationAdapterInterface):
    """Extension Point: Discord Webhook adapter."""
    async def deliver(self, title: str, message: str, severity: str, details: Optional[Dict[str, Any]] = None) -> bool:
        logger.info("Discord notification adapter extension point - not active.")
        return False


class TelegramAdapter(NotificationAdapterInterface):
    """Extension Point: Telegram Bot API adapter."""
    async def deliver(self, title: str, message: str, severity: str, details: Optional[Dict[str, Any]] = None) -> bool:
        logger.info("Telegram notification adapter extension point - not active.")
        return False


class NotificationEngineService:
    """
    Core engine managing system alerts, deduplications, rate limits, cooldowns,
    and concurrent multi-channel notifications delivery.
    """

    def __init__(self):
        self.cooldown_minutes = settings.notification_cooldown_minutes
        self.admin_email = settings.admin_email

    async def publish_event(
        self,
        db: AsyncSession,
        event_type: str,
        severity: str,
        title: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[Notification]:
        """
        Publishes a new system alert.
        Applies deduplication and cooldown rate limiting rules.
        """
        # Deduplication / Cooldown Check
        # Check if an identical notification was sent within the cooldown period
        cooldown_threshold = datetime.utcnow() - timedelta(minutes=self.cooldown_minutes)
        stmt = select(Notification).where(
            (Notification.event_type == event_type) &
            (Notification.title == title) &
            (Notification.created_at >= cooldown_threshold)
        ).order_by(desc(Notification.created_at)).limit(1)

        res = await db.execute(stmt)
        recent = res.scalar_one_or_none()

        if recent:
            logger.info(f"Notification Ignored: Duplicate event '{event_type}' inside cooldown period.")
            return None

        # Sanitize notification details content (prevent sensitive variables leak)
        sanitized_details = self._sanitize_payload(details)

        notification = Notification(
            event_type=event_type,
            severity=severity,
            title=title,
            message=message,
            details=sanitized_details
        )
        db.add(notification)
        await db.flush()

        # Create logs in the same session
        channels = ["in_app", "email"]
        if settings.slack_webhook_url:
            channels.append("slack")

        log_ids = []
        for channel in channels:
            log = NotificationLog(
                notification_id=notification.id,
                channel=channel,
                status="pending"
            )
            db.add(log)
            await db.flush()
            log_ids.append(log.id)

        logger.info(f"Notification Created: {notification.id} | Type: {event_type} | Severity: {severity}")

        # Dispatch async delivery across all configured channels
        asyncio.create_task(self.dispatch_delivery_by_ids(notification.id, log_ids))
        return notification

    def _sanitize_payload(self, details: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Sanitizes sensitive environment variables/keys from logged details payload."""
        if not details:
            return None

        sanitized = dict(details)
        sensitive_keys = ["api_key", "password", "secret", "token", "auth", "jwt"]
        for key in list(sanitized.keys()):
            key_lower = key.lower()
            if any(k in key_lower for k in sensitive_keys):
                sanitized[key] = "[REDACTED]"
            elif isinstance(sanitized[key], dict):
                sanitized[key] = self._sanitize_payload(sanitized[key])
        return sanitized

    async def dispatch_delivery_by_ids(self, notification_id: str, log_ids: List[str]):
        """Asynchronously triggers deliveries across channels after let the transaction commit."""
        await asyncio.sleep(0.5)
        async with async_session() as db:
            notification = await db.get(Notification, notification_id)
            if not notification:
                # If not committed yet (e.g. database delay), sleep a bit longer and retry once
                await asyncio.sleep(1.0)
                notification = await db.get(Notification, notification_id)
                if not notification:
                    logger.warning(f"Notification {notification_id} not found in database for delivery. Skipping.")
                    return

            # Execute delivery concurrently
            await asyncio.gather(*[
                self._deliver_to_channel(log_id, notification.title, notification.message, notification.severity, notification.details)
                for log_id in log_ids
            ])

    async def _deliver_to_channel(
        self,
        log_id: str,
        title: str,
        message: str,
        severity: str,
        details: Optional[Dict[str, Any]]
    ):
        """Orchestrates delivery attempt and retry handling on failure."""
        async with async_session() as db:
            log = await db.get(NotificationLog, log_id)
            if not log:
                return

            channel = log.channel
            log.status = "delivering"
            await db.commit()

        success = False
        error_msg = None

        try:
            if channel == "in_app":
                success = True  # Writing to notification_logs table IS the in-app delivery
            elif channel == "email":
                success = await self._send_email(title, message, severity)
                if not success:
                    error_msg = "SMTP email send failed"
            elif channel == "slack":
                slack = SlackAdapter(settings.slack_webhook_url)
                success = await slack.deliver(title, message, severity, details)
                if not success:
                    error_msg = "Slack webhook deliver failed"
            else:
                error_msg = f"Unsupported delivery channel: {channel}"
        except Exception as e:
            success = False
            error_msg = str(e)

        async with async_session() as db:
            log = await db.get(NotificationLog, log_id)
            if not log:
                return

            from app.utils.observability import NOTIFICATION_DELIVERY_RATE
            if success:
                log.status = "delivered"
                log.delivered_at = datetime.utcnow()
                db.add(log)
                await db.commit()
                logger.info(f"Notification Delivered: {log_id} via {channel}")
                
                # Telemetry record (Phase 21)
                NOTIFICATION_DELIVERY_RATE.labels(channel=channel, status="success").inc()
            else:
                log.error_message = error_msg
                logger.warning(f"Notification Failed: {log_id} via {channel}. Reason: {error_msg}")
                
                # Telemetry record (Phase 21)
                NOTIFICATION_DELIVERY_RATE.labels(channel=channel, status="failed").inc()
                
                # Retry boundary logic (max 3 retries)
                if log.retry_count < 3:
                    log.status = "retrying"
                    log.retry_count += 1
                    db.add(log)
                    await db.commit()
                    logger.info(f"Notification Retried: {log_id} scheduling retry attempt {log.retry_count}")
                    asyncio.create_task(self._wait_and_retry(log_id, title, message, severity, details))
                else:
                    log.status = "failed"
                    db.add(log)
                    await db.commit()

    async def _wait_and_retry(
        self,
        log_id: str,
        title: str,
        message: str,
        severity: str,
        details: Optional[Dict[str, Any]]
    ):
        """Wait for a brief cooldown period and re-execute delivery."""
        await asyncio.sleep(2.0)  # 2 second retry spacing delay
        await self._deliver_to_channel(log_id, title, message, severity, details)

    async def _send_email(self, title: str, message: str, severity: str) -> bool:
        """Helper utilizing smtplib in executor to deliver SMTP emails without blocking."""
        loop = asyncio.get_running_loop()
        
        def blocking_send():
            try:
                # Prepare MIME message
                msg = MIMEText(f"Severity: {severity}\n\n{message}")
                msg["Subject"] = f"[GovSchemeAI ALERT] {title}"
                msg["From"] = "system@govscheme.gov.in"
                msg["To"] = self.admin_email

                # Attempt SMTP connection with low timeout bounds to fail fast
                # (smtp port defaults to 1025 for dev testing stubs)
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=3.0) as server:
                    server.send_message(msg)
                return True
            except Exception as e:
                # Log and fail gracefully so SMTP down does not crash app core threads
                logger.warning(f"SMTP delivery failed: {e}. Falling back to logging.")
                return False

        # Run block in threadpool executor to remain async non-blocking
        return await loop.run_in_executor(None, blocking_send)


# Singleton
notification_engine = NotificationEngineService()
