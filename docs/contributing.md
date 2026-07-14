# Contributing to GovSchemeAI

Thank you for your interest in contributing to **GovSchemeAI**! We welcome bug fixes, documentation improvements, new features, and design revisions.

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Contributors are expected to behave professionally, respect other developers, and follow standard code review feedback workflows.

---

## 🛠️ Contribution Workflow

We follow a standard Git branching and Pull Request (PR) workflow:

```
                  +-----------------------------------+
                  |   Fork or Clone Main Repository   |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  | Create Feature Branch (feat/bug/) |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  |   Write Code & Execute Pytest/    |
                  |          Build Checks             |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  | Push Branch & Open Pull Request   |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  | Review, Merge, & Deploy to Prod   |
                  +-----------------------------------+
```

### Step-by-Step Instructions
1. **Fork or Clone**:
   Clone the repository and set up upstream handles:
   ```bash
   git clone https://github.com/devanshr99/GovSchemeAI.git
   cd GovSchemeAI
   ```
2. **Create Feature Branch**:
   Use descriptive branch names (e.g. `feat/whatsapp-notifications` or `bug/eligibility-range-fix`):
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Set Up Local Environments**:
   Ensure dependencies are installed and test configurations run cleanly (see [README Quickstart](file:///c:/Users/devan/Desktop/government%20schemes/GovSchemeAI/README.md)).
4. **Write Tests**:
   For any backend feature or database change, write corresponding tests in the `backend/tests` directory.
5. **Run Pre-Commit Checks & Lints**:
   * **Backend (Python)**:
     Format your code using `black` or `flake8` standards:
     ```bash
     black backend/app
     ```
     Run tests using `pytest` to make sure all 119+ test cases pass:
     ```bash
     pytest backend
     ```
   * **Frontend (TypeScript)**:
     Verify Next.js build compilation and static type-checks:
     ```bash
     cd frontend
     npm run lint
     npm run build
     ```
6. **Commit Changes**:
   Write clear, semantic commit messages (e.g., `feat: implement SMS alerts on failover events`).
7. **Submit PR**:
   Open a Pull Request against the `main` branch. Ensure the description contains detail on what was changed and why.

---

## 🐛 Submitting Issues & Feature Requests

* **Bug Reports**: Open an issue describing the bug. Provide clear steps to reproduce, console logs, environment context, and screenshots.
* **Feature Requests**: Outline why the feature is valuable, what problem it solves, and any proposed design patterns or API endpoints.
