# Blindspot — Backend API Reference

Backend runs at `http://localhost:8000`. Vite proxies `/api/*` there automatically, so call `/api/analyze` directly (no full host needed in dev).

Interactive docs: **http://localhost:8000/docs**

---

## Endpoints

### `GET /api/health`
Check if backend is up.
```json
{
  "status": "ok",
  "timestamp": "2026-06-15T10:00:00Z",
  "services": { "cencori_gateway": "configured", "supabase": "not configured" }
}
```

---

### `POST /api/analyze` — SSE stream
Send the user's decision, get back a live debate stream.

**Request body**
```json
{
  "session_id": "string",
  "decision_text": "string",
  "user_persona": "student | professional | freelancer",
  "origin_city": "string (optional)",
  "destination_city": "string (optional)",
  "assumptions": { "expected_rent": 1500, "savings_rate": 20, "confidence": 85 },
  "alternative_text": "string",
  "values_rank": ["financial", "growth", "balance", "roots"]
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
    const data = frame.match(/^data: (.+)$/m)?.[1]
    if (event === 'atlas') appendAtlas(data)
    if (event === 'vera') appendVera(data)
    if (event === 'done') handleDone(JSON.parse(data))
  }
}
```

**SSE events**
| Event | Data |
|---|---|
| `atlas` | Plain text chunk — append to ATLAS column as it arrives |
| `vera` | Plain text chunk — append to VERA column as it arrives |
| `done` | JSON string — see shape below |

**`done` payload shape**
```json
{
  "score": 72,
  "grade": "B",
  "axes": null,
  "timeline": {
    "path_taken": {
      "label": "Take the new role",
      "milestones": [
        {"year": 1, "trajectory_score": 60, "narrative": "Adjusting to higher CoL, savings dip short-term."},
        {"year": 3, "trajectory_score": 75, "narrative": "Role unlocks promotion track, network cost recovering."},
        {"year": 5, "trajectory_score": 85, "narrative": "Compounding career gain outweighs early friction."}
      ]
    },
    "path_not_taken": {
      "label": "Stay in current role",
      "milestones": [
        {"year": 1, "trajectory_score": 65, "narrative": "Stable, no relocation risk."},
        {"year": 3, "trajectory_score": 60, "narrative": "Growth plateau without the title change."},
        {"year": 5, "trajectory_score": 55, "narrative": "Market positioning lags peers who moved earlier."}
      ]
    }
  },
  "blindspots": [
    "Network reset cost — 12-18 months to rebuild local professional relationships",
    "Savings rate assumption may be optimistic given actual CoL delta",
    "Equity/vesting cliff at current employer not accounted for in the timeline"
  ],
  "advisory_action": { "flagged": false, "message": null, "office_contact": null },
  "data_health": {
    "status": "GREEN | YELLOW | RED",
    "warning": "string | null",
    "score_penalty": 0,
    "adjusted_score": null,
    "is_estimated": false,
    "sources": {
      "numbeo": { "status": "GREEN", "last_fetched": "ISO8601 | null", "age_days": 2 },
      "fx": { "status": "GREEN", "last_fetched": "ISO8601 | null", "age_days": 0 }
    }
  },
  "provider_used": "claude"
}
```

> `axes` is permanently `null` — no radar chart in this version.
> `timeline.milestones[].trajectory_score` is a 0-100 narrative momentum score for the line chart — plot both tracks on the same axis (year 1/3/5).
> `advisory_action.flagged = true` when `score < 40` or `data_health.status = "RED"` — show a human-advisor prompt when flagged.

---

### `GET /api/decisions?session_id=<string>` — Past decisions
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
Returns a single decision with full axes, timeline, blindspots, and data_health.
Test UUID: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`

---

### `POST /api/rerun/{decision_id}` — Re-run (coming Day 5)
Same SSE stream as `/api/analyze`. Returns `501` until June 18.

---

## Session ID
No auth in MVP. Generate a UUID on first load and persist to `localStorage`.
```js
function getSessionId() {
  let id = localStorage.getItem('blindspot_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('blindspot_session', id) }
  return id
}
```

---

## What's live now

| Endpoint | Status |
|---|---|
| `GET /api/health` | ✅ Live |
| `POST /api/analyze` | ✅ Live — real ATLAS + VERA streaming + AXIS scoring. Full `done` payload populated |
| `GET /api/decisions` | ✅ Live (stub row) |
| `GET /api/report/:uuid` | ✅ Live (stub) |
| `POST /api/rerun/:id` + Supabase persistence | 🔜 June 18 |
