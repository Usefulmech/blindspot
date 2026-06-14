# Blindspot - Decision Intelligence Tool

Blindspot is an AI-powered decision intelligence tool where three AI agents (ATLAS, VERA, and AXIS) debate high-stakes career or relocation decisions in real-time. 

This repository contains both the React + Vite frontend and the FastAPI backend.

## 🤝 How to Collaborate

The repository is structured with three main branches:
- `main`: The stable source of truth.
- `frontend`: For React UI and client-side logic.
- `backend`: For FastAPI, AI agent orchestration, and Supabase integration.

**For the Backend Developer:**
1. Clone the repository: `git clone https://github.com/Usefulmech/blindspot.git`
2. Checkout your branch: `git checkout backend`
3. When you complete a feature, push to your branch and create a Pull Request against `main`.

**For the Frontend Developer:**
1. Clone the repository: `git clone https://github.com/Usefulmech/blindspot.git`
2. Checkout your branch: `git checkout frontend`
3. When you complete a feature, push to your branch and create a Pull Request against `main`.

---

## 🚀 Running the Project Locally

### 1. Backend Setup (FastAPI)
Open a terminal and navigate to the backend folder:
```bash
cd blindspot-backend
```
Install the Python dependencies:
```bash
pip install -r requirements.txt
```
Set up your environment variables by copying the template:
```bash
cp .env.example .env
```
*(Fill in your Supabase, Anthropic, Numbeo, and Open Exchange Rates API keys in the `.env` file).*

Start the development server:
```bash
uvicorn main:app --reload
```
The backend will run at `http://localhost:8000`.

### 2. Frontend Setup (React + Vite)
Open a second terminal and navigate to the frontend folder:
```bash
cd blindspot-frontend
```
Install the Node dependencies:
```bash
npm install
```
Start the development server:
```bash
npm run dev
```
The frontend will run at `http://localhost:5173`. (API requests are proxied automatically to the backend on port 8000).

---

## 📂 Folder Structure

```text
blindspot/
├── blindspot-backend/          # Python backend (FastAPI)
│   ├── agents/                 # ATLAS (Optimist), VERA (Realist), AXIS (Synthesiser)
│   ├── db/                     # Supabase client and SQL schema
│   ├── memory/                 # Decision history fetching
│   ├── routers/                # API route definitions
│   ├── services/               # External APIs (Numbeo, FX) & Context builder
│   ├── .env.example            # API keys template
│   ├── main.py                 # FastAPI application entry point
│   └── requirements.txt        # Python dependencies
│
├── blindspot-frontend/         # React frontend (Vite + TypeScript + Tailwind)
│   ├── src/                    # React components, contexts, and hooks
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── vite.config.ts          # Vite configuration (includes API proxy proxying)
└── README.md
```

---

## 🔌 API Contract (Frontend <-> Backend)

To ensure the frontend and backend teams are aligned, here are the expected endpoints the backend will expose and the frontend will consume:

### 1. `POST /api/analyze` (Core Analysis & SSE Stream)
- **Purpose**: Takes user inputs, triggers the agents, and streams the debate back.
- **Request Body (JSON)**:
  ```json
  {
    "session_id": "string",
    "origin_city": "string",
    "destination_city": "string",
    "decision_text": "string"
  }
  ```
- **Response**: Server-Sent Events (SSE) stream.
  - The backend should yield chunks formatted with specific event tags:
    - `event: atlas\ndata: <chunk>\n\n`
    - `event: vera\ndata: <chunk>\n\n`
    - `event: done\ndata: { "score": 85, "grade": "B+", "timeline": [...], "blindspots": [...] }\n\n`

### 2. `GET /api/decisions` (Fetch Past Sessions)
- **Purpose**: Returns all past analyses for the user session (My Decisions page).
- **Query Parameter**: `?session_id=123`
- **Response (JSON)**: Array of decision objects from the Supabase `decisions` table.

### 3. `POST /api/rerun/:id` (Re-run Decision)
- **Purpose**: Re-fetches fresh live data for a past decision and re-runs the agents.
- **Response**: Same Server-Sent Events (SSE) stream as `/api/analyze`.

### 4. `GET /api/report/:share_uuid` (Shareable Report Card)
- **Purpose**: Fetches a specific decision by its share UUID.
- **Response (JSON)**: Single decision object payload.
