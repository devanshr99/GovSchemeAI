# Background Scheduler Architecture

This document describes the design, execution flow, persistence strategies, and error-recovery mechanisms of the **GovSchemeAI** Background Scheduler.

---

## 🛠️ Scheduler Design Overview

To keep the government schemes dataset fresh without manual admin interventions, the system runs an asynchronous scheduling daemon using **APScheduler** (`AsyncIOScheduler`).

Instead of simple in-memory timers which disappear when the server restarts, GovSchemeAI implements a **database-backed state machine** to manage job registrations, execution audits, crash recovery, and retry metrics.

```
       +-----------------------+
       |   FastAPI Startup     |
       +-----------+-----------+
                   |
                   v
       +-----------------------+          Registers Recurring
       |   SchedulerEngine     |--------> default_update_pipeline
       |   (APScheduler)       |          (Based on settings cron)
       +-----------+-----------+
                   |
                   v
       +-----------+-----------+
       |    Crash Recovery     | Checks for queued/running jobs
       |    Engine Daemon      | in DB and marks interrupted tasks
       +-----------+-----------+
                   |
        If retry_count < max_retries
                   v
       +-----------------------+
       |    Trigger Retry      | Schedules new execution history
       |    Execution Task     | row and runs in asyncio task loop
       +-----------------------+
```

---

## 🗄️ Database Models & State Machine

Two main tables under `app/models/scheduler.py` manage the state of tasks:

1. **`SchedulerJob`**:
   * Stores task configurations: name, description, cron expression (e.g. `0 0 * * *`), timeout thresholds, active flag, and max retries parameters.
2. **`JobExecutionHistory`**:
   * Logs individual executions.
   * Tracks timestamps (`started_at`, `completed_at`), execution status (`Pending`, `Queued`, `Running`, `Completed`, `Failed`), retry count, and a list of occurred errors.

### State Transitions
```
[Pending] ---> [Queued] ---> [Running] ---> [Completed] (Success)
                                 |
                                 +---------> [Failed] (Attempts < Max)
                                                |
                                                v
                                         [Pending (Retry)]
```

---

## 🚀 Scheduler Lifecycle Operations

### 1. Registration (`register_recurring_job`)
* During backend startup, the engine queries the database.
* If a registered job (like `default_update_pipeline`) does not exist, a new `SchedulerJob` record is created.
* The job is attached to APScheduler using a `CronTrigger` constructed from the configured cron expression.

### 2. Execution Orchestration (`execute_job_history`)
* When triggered (by cron or manually via `/admin/updates/trigger`), the engine:
  1. Inserts/updates the execution row to `Running`.
  2. Spawns the update orchestrator workflow asynchronously.
  3. Updates status to `Completed` on success, or `Failed` on exception.

---

## 🛡️ Crash Recovery & Retry Logic

### Crash Recovery Protocol (`run_crash_recovery`)
If the server crashes or restarts while a scheduled job is in the middle of executing (status `Running` or `Queued`), the state gets desynchronized.
* **On Server Boot**: The scheduler engine runs a recovery loop.
* It selects all `JobExecutionHistory` rows marked as `Running` or `Queued`.
* It transitions them to `Failed` with the error: `"Job interrupted by system restart/crash"`.
* If the job configuration allows retries (`retry_count < max_retries`), it automatically schedules a new retry run.

### Retry Backoff Loop
* If a scraper fails due to network dropouts or API rate-limits, the engine delays the next attempt by the configured `retry_delay` seconds.
* The retry run increment logs details in the database history, ensuring visibility of transient scraper failures.
