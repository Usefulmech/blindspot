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

## ✨ Product Features

### 1. The Input Matrix
A 5-step animated form for user input:
- **Persona Context**: Specify if the user is a student, career changer, or professional.
- **Location**: Origin & Destination cities (Optional — only if the decision involves relocation. Otherwise, can be omitted for general career/life decisions).
- **The Decision**: Free-text description of the career/life move.
- **Your Assumptions**: Expected monthly rent, savings rate, and confidence level.
- **The Alternative**: A counterfactual scenario.
- **Your Values**: Forced rank of Financial Security, Career Growth, Work-Life Balance, Geographic Roots.

### 2. Live Debate Stream
A two-column UI showing ATLAS (Optimist) and VERA (Realist) debating the decision in real-time. Every figure cites its source, and currency gaps appear in local terms first.

### 3. 5-Year Parallel Reality Simulator
A split-screen timeline showing the path taken vs. path not taken across 1, 3, and 5-year milestones.

### 4. Blindspot Score Dashboard
A radar chart scoring the decision across 4 axes: Financial Realism, Optimism Bias, Planning Fallacy Risk, and Regret Alignment. 
- **Human Advisory Routing**: If the score falls below 40, a Human Advisory Flag is triggered, and the user is explicitly routed to the nearest career counselor, nonprofit office, or university center for human intervention.

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
  └── vite.config.ts          # Vite configuration (includes API proxy proxying)
└── README.md
```

