# Scraper & Data Pipeline Guide

This document describes the design of the background crawler engine, schema normalization rules, multi-agent duplicate detection formulas, and LLM structured extraction pipelines in **GovSchemeAI**.

---

## 🏗️ Pipeline Overview

The update orchestrator (`app/scrapers/orchestrator.py`) runs in a pipeline to discover and ingest new scheme details into active tables:

```
+------------------+     BS4 selectors & API gets
| Scraper Daemons  |----------------------------------> Fetches raw payloads
+--------+---------+
         |
         v
+--------+---------+     Field maps (app/scrapers/normalizer.py)
| Normalizer       |----------------------------------> Standardized JSON schema
+--------+---------+
         |
         v
+--------+---------+     Fuzzy string comparisons (thefuzz)
| Dedup Engine     |----------------------------------> Weighted similarity scoring
+--------+---------+
         |
         v
+--------+---------+     RAG context & translators
| AI Enrichment    |----------------------------------> Hindi translations & DSL rules
+--------+---------+
         |
         v
+--------+---------+     Transaction locks
| Database Sync    |----------------------------------> Merged schemes & rules
+------------------+
```

---

## 📡 1. Scraper Modules

GovSchemeAI implements an abstract scraper template (`app/scrapers/base.py`) which is subclassed by three scraping engines:
* **myScheme Scraper (`myscheme_scraper.py`)**: Crawls indices, extracting tags, categories, requirements, and benefits from `myScheme.gov.in`.
* **Data.gov.in API Scraper (`datagov_scraper.py`)**: Interacts with governmental open data REST interfaces, importing metadata catalogs.
* **Gazette Scraper (`gazette_scraper.py`)**: Parses PDF links and publication notices from the official Gazette of India feed.

---

## 🔄 2. Schema Normalization

Raw scraped schemas vary widely between sources. The `SchemaNormalizer` transforms heterogeneous inputs into a standardized JSON structure conforming to database parameters:
* Text fields are trimmed and stripped of trailing whitespace.
* Launch dates are parsed into `YYYY-MM-DD` ISO dates, defaulting to `None` if missing.
* Categorical labels are matched to standard ID lists defined in category index tables.

---

## 👥 3. Deduplication Engine (Fuzzy Logic)

To prevent cluttering database searches with duplicate entries, the `DuplicateEngine` runs incoming staging candidates against active schemes using the following weighted similarity formulas:

### Similarity Weight Parameters

| Field | Weight | Description | Match Algorithm |
| :--- | :--- | :--- | :--- |
| **Scheme Name** | `35%` | Name of the scheme | Exact string check or `thefuzz.token_sort_ratio` |
| **Official URL** | `25%` | Portal site address | Domain-level string comparison |
| **Benefits** | `15%` | Financial / aid details | Fuzzy token matching |
| **Eligibility** | `15%` | Participant criteria | Fuzzy string comparison |
| **Ministry** | `10%` | Department / Ministry | Direct or fuzzy matching |

* If the cumulative weighted similarity score exceeds `85%`, the candidate is flagged as a duplicate of an existing scheme, and updates are queued into staging instead of generating new records.

---

## 🤖 4. AI-Powered Enrichment (LLM Pipeline)

Once normalized and deduplicated, staging candidates are enriched via LLMs using two specialized processes:

### A. Hindi Translation Agent
Translates English scheme descriptions, benefits text, and application instructions into grammatically correct Hindi (Devanagari script), populating columns like `benefits_hi` and `description_hi`.

### B. Eligibility Rules Extraction Agent
Parses unstructured eligibility text into a structured JSON array representing rule parameters:
```json
[
  {
    "rule_type": "age",
    "operator": "between",
    "value": { "min": 18, "max": 60 },
    "is_mandatory": true,
    "description": "Applicant must be between 18 and 60 years old."
  }
]
```
These rules are then inserted into the `eligibility_rules` table, allowing the rules checker engine to execute programmatic checks on user profiles.

---

## 💾 5. Database Sync Engine

After scoring and AI enrichment, candidates reside in `scheme_staging` where an admin can review edits. If auto-approve thresholds are configured:
* The sync engine executes a single transactional block:
  1. Compares timestamps.
  2. Updates scheme fields if they have changed.
  3. Re-creates `eligibility_rules` for the scheme.
  4. Records the audit trail in `scheme_versions`.
