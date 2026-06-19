# Blindspot — Backend API Reference

Backend runs at `http://localhost:8000` locally, and at the Render URL in production.
Vite proxies `/api/*` to localhost automatically in dev, so call `/api/analyze` directly.

Interactive docs: **http://localhost:8000/docs**

---

## Endpoints

### `GET /api/health`
Check if all services are up before starting a session.
```json
{
  "status": "ok",
  "timestamp": "2026-06-19T10:00:00Z",
  "services": {
    "azure_openai": "configured",
    "supabase": "configured",
    "getwherenext": "configured",
    "open_exchange_rates": "configured"
  }
}
```

---

### `POST /api/analyze` — SSE stream

Send the user's decision, get back a **4-turn live debate** stream followed by a scored result.

**Request body**
```json
{
  "session_id": "string — stable UUID per user, stored in localStorage (required for memory)",
  "decision_text": "string",
  "user_persona": "student | professional | freelancer",
  "origin_city": "string (optional)",
  "destination_city": "string (optional)",
  "assumptions": { "expected_rent": 1500, "savings_rate": 20, "confidence": 85 },
  "alternative_text": "string",
  "values_rank": ["financial", "growth", "stability", "family"]
}
```

**`EventSource` won't work — this is a POST endpoint.** Use `fetch()` + `ReadableStream`:
```js
const res = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
const reader = res.body.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })

  // SSE frames are separated by blank lines: "event: atlas\ndata: chunk\n\n"
  const frames = buffer.split('\n\n')
  buffer = frames.pop() // keep incomplete frame for next read
  for (const frame of frames) {
    const event = frame.match(/^event: (.+)$/m)?.[1]
    const data  = frame.match(/^data: (.+)$/m)?.[1]
    if (event === 'atlas') appendAtlas(data)   // multiple bursts — keep appending
    if (event === 'vera')  appendVera(data)    // multiple bursts — keep appending
    if (event === 'axis')  appendAxis(data)    // AXIS summary — keep appending
    if (event === 'done')  handleDone(JSON.parse(data))
    if (event === 'error') handleError(data)
  }
}
```

**SSE events — debate order**

| Event | Turns | Data |
|---|---|---|
| `atlas` | 2 bursts (opening + counter-argument) | Plain text — append to ATLAS panel as it arrives |
| `vera`  | 2 bursts (rebuttal + closing argument) | Plain text — append to VERA panel as it arrives |
| `axis`  | 1 burst (debate summary/verdict) | Plain text — append to AXIS panel |
| `done`  | Once at the end | JSON string — see shape below |
| `error` | Only on failure | Error message string |

> The debate alternates: ATLAS opens → VERA rebuts → ATLAS counters → VERA closes → AXIS judges.
> Both `atlas` and `vera` events arrive in **two separate bursts** per request — just keep appending
> to the same panel; do not clear between bursts.

**`done` payload shape**
```json
{
  "score": 54,
  "grade": "C+",
  "axes": null,
  "timeline": {
    "path_taken": {
      "label": "Move to Dubai",
      "milestones": [
        {"year": 1, "trajectory_score": 54, "narrative": "Adjusting to higher CoL..."},
        {"year": 3, "trajectory_score": 67, "narrative": "Role unlocks promotion track..."},
        {"year": 5, "trajectory_score": 73, "narrative": "Compounding career gain..."}
      ]
    },
    "path_not_taken": {
      "label": "Stay in Kigali and grow locally",
      "milestones": [
        {"year": 1, "trajectory_score": 66, "narrative": "Stable, no relocation risk..."},
        {"year": 3, "trajectory_score": 57, "narrative": "Growth plateau..."},
        {"year": 5, "trajectory_score": 50, "narrative": "Market positioning lags..."}
      ]
    }
  },
  "blindspots": [
    "Savings rate assumption is at risk given the actual CoL delta",
    "Professional network reset cost not accounted for in the timeline",
    "Tax implications in the UAE not modelled"
  ],
  "advisory_action": {
    "flagged": false,
    "message": null,
    "office_contact": null
  },
  "components": {
    "values_alignment": 48.4,
    "debate_verdict": 31,
    "estimation_score": 82.7,
    "assumption_accuracy": 83.0,
    "confidence_calibration": 82.0
  },
  "data_health": {
    "status": "GREEN",
    "warning": null,
    "score_penalty": 0,
    "is_estimated": false,
    "sources": {
      "getwherenext": { "status": "GREEN", "last_fetched": "ISO8601 | null", "age_days": 0 },
      "fx": { "status": "GREEN", "last_fetched": "ISO8601 | null", "age_days": 0 }
    }
  },
  "provider_used": "azure_openai",
  "share_uuid": "uuid-string"
}
```

**Key notes on the payload:**
- `axes` is permanently `null` — no radar chart in this version.
- `timeline.milestones[].trajectory_score` is 0–100 — plot both paths on the same line chart (year 1/3/5).
- `advisory_action.flagged = true` when `score < 40` or `data_health.status = "RED"` — show a human-advisor prompt with `office_contact` links.
- `advisory_action.office_contact` is a list of `{ "name": "...", "url": "..." }` objects when flagged, otherwise `null`.
- `components` — use this to show a score breakdown panel ("why this score").
- `data_health.sources` uses `getwherenext` as the CoL source key (not `numbeo` — that was replaced).
- `share_uuid` — build the share link as `/report/<share_uuid>`, hits `GET /api/report/<share_uuid>`.

---

### `GET /api/decisions?session_id=<string>` — Past decisions
Returns all past analyses for a user, newest first. Used for the history panel.
```json
[
  {
    "id": "uuid",
    "session_id": "string",
    "created_at": "ISO8601",
    "origin_city": "string",
    "destination_city": "string",
    "decision_text": "string",
    "score": 62,
    "grade": "B-",
    "advisory_flag": false,
    "share_uuid": "uuid"
  }
]
```

---

### `GET /api/report/{share_uuid}` — Shareable report card
Returns a single decision row with full `timeline`, `blindspots`, `components`, and `data_health`.
Returns `404` if not found.

---

### `POST /api/rerun/{decision_id}` — Re-run with fresh data
Same SSE stream as `/api/analyze`. Loads the original request from the database and re-runs
the full pipeline with fresh GetWhereNext + FX data.

---

## Session ID — Required for agent memory

**This is critical.** Agents now have memory — they read the user's past decisions and reference
them in the debate and timeline. For this to work, `session_id` must be the **same value across
all sessions for the same user**.

Generate once on first load and persist to `localStorage`:
```js
function getSessionId() {
  let id = localStorage.getItem('blindspot_session')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('blindspot_session', id)
  }
  return id
}
```

Always pass this as `session_id` in every `/api/analyze` and `/api/rerun` request. If you pass
a different UUID each time, the agents will never see the user's history.

**What memory enables:**
- ATLAS can say: *"This builds on your previous analysis of the London move..."*
- VERA can call out: *"You scored 61 on a similar decision — your confidence was higher than your accuracy warranted"*
- AXIS timeline references: *"Having previously considered X, year 1 may feel familiar but the cost gap here is wider"*

---

## What's live now

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/health` | ✅ Live | Now shows `azure_openai` and `getwherenext` |
| `POST /api/analyze` | ✅ Live | 4-turn debate (ATLAS→VERA→ATLAS→VERA), AXIS judges, memory-grounded |
| `GET /api/decisions` | ✅ Live | Real Supabase query |
| `GET /api/report/:uuid` | ✅ Live | Real Supabase query |
| `POST /api/rerun/:id` | ✅ Live | Re-runs full SSE pipeline with fresh data |

## AI provider
All agents (ATLAS, VERA, AXIS) now run on **Azure OpenAI** (`gpt-5.4` deployment).
`provider_used` in the done payload will be `"azure_openai"`.
