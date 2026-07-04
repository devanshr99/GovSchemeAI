# Changelog

All notable changes to the YojanaAI project will be documented in this file.

## [1.0.0] - 2026-07-03

### Added
- **Multi-language support (i18n)**: Fully integrated English and Hindi dictionaries, fallback mapping configuration, dynamic document language injection, and aria-live announcements.
- **Indian Locale Formatting**: Standard DD/MM/YYYY date formats and INR Rupee currency patterns.
- **Accessibility Enhancements**: WCAG 2.1 AA compliant LanguagePicker keyboard arrow key navigation, explicit label associations, and global high-contrast focus rings.
- **AI Recommendation Engine**: Score-based personalized recommendation matching and eligibility checks with explainability rules.
- **High Availability & Disaster Recovery**: Secondary read-replica failovers, automated backup schedules (S3/Local storage), and health monitoring status checking.
- **Observability System**: Prometheus instrument hooks (latencies, counts), JSON structured logging configuration, and threshold-based alert triggers.
- **Security Hardening**: Secure session storage mapping, XSS boundary sanitizers, and parameter checking.

### Fixed
- Fixed API `/api/eligibility/check` compatibility matching logic with `RecommendationProfile` schemas.
- Fixed database cleanup integration tests event loop closed crashes under pytest-asyncio environment.
