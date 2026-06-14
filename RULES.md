# 🤖 AI Assistant Guidelines (Do's and Don'ts)

This file serves as the strict operating rules for the AI assistant working on the **Blindspot** project. The AI must refer to these rules to ensure consistency, prevent architectural drift, and respect the hackathon strategy.

## 🛠️ 1. Technology Stack
- **DO** use **React + Vite + TypeScript + Tailwind CSS** for the frontend.
- **DO** use **FastAPI + Python** for the backend.
- **DON'T** rewrite the app into Next.js or introduce Node.js backend frameworks. We explicitly chose the FastAPI + Vite stack (Option A).
- **DO** use `framer-motion` for frontend animations and `recharts` for radar/sparkline charts.

## 🗃️ 2. Data & Backend Infrastructure
- **DO** always use the **Data Freshness Engine** (`cache_manager.py` and `data_verifier.py`) when dealing with external APIs (Numbeo, ILO, etc.).
- **DON'T** make raw, uncached API calls to external services.
- **DO** strictly enforce the 30-day staleness threshold. If data is stale, fetch fresh data and update the `api_cache` table.
- **DO** ensure the `data_health` object is attached to the `event: done` payload so the frontend can render the Data Freshness Badge.

## 🌍 3. UI & Product Features
- **DO** display all monetary gaps in **Local Currency first**, followed by PPP-adjusted USD as secondary context. This is a strict design rule.
- **DO** ensure the AXIS agent triggers the **Human Advisory Flag** (routing to the nearest career center/office) if the Blindspot Score falls below 40.
- **DO** respect the user persona (e.g., student vs. professional). If the decision isn't a relocation, location fields are optional.

## 🌿 4. Git & Workflow
- **DO** respect the branching strategy. The user owns the `frontend` branch, the teammate owns the `backend` branch.
- **DO** update `API_CONTRACT.md` anytime a change is made to the expected request/response formats.
- **DON'T** force pushes to `main` without ensuring both frontend and backend are aligned on the contract.

## 🧠 5. Agents & Streaming
- **DO** use Server-Sent Events (SSE) for the Live Debate Stream.
- **DO** remember that `ATLAS` streams optimism, `VERA` streams realism, and `AXIS` waits, calculates, and returns the final JSON payload (`event: done`).
