# Release Notes - YojanaAI v1.0.0

We are proud to announce the final release of **YojanaAI v1.0.0**, an enterprise-ready government scheme recommendations engine.

## Highlights
1. **Intelligent Recommendations**: High-accuracy eligibility matcher utilizing a multi-weighted ranking matrix (50% Eligibility, 20% Benefits, 15% Location, 10% Freshness, 5% Popularity).
2. **Indian Regional Customization**: Built-in support for Hindi/English with formatters for Indian Rupee (`₹1,50,000`) and standard calendars.
3. **Accessibility First (WCAG 2.1 AA)**: Interactive keyboard-focusable picker widgets, explicit inputs association, and high-contrast outline focus states.
4. **Resiliency & Fault Tolerance**: Health-monitoring loop daemon with dynamic db failovers and automated localized backup cron engines.
5. **Robust Monitoring**: Structured JSON logs, trace propagation headers, and Prometheus-ready HTTP endpoint scraping.

## Upgrade & Verification
To execute the backend verification tests:
```bash
$env:PYTHONPATH="."
.\.venv\Scripts\pytest -v
```

All 119 unit and integration test specs pass successfully.
