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

**SSE events**
| Event | Data |
|---|---|
| `atlas` | Plain text chunk — append to ATLAS column as it arrives |
| `vera` | Plain text chunk — append to VERA column as it arrives |
| `done` | JSON string — parse and render score/timeline/blindspots |

**`done` payload shape**
```json
{
  "score": 62,
  "grade": "B-",
  "axes": {
    "financial_realism": 58,
    "optimism_bias": 65,
    "planning_fallacy_risk": 55,
    "regret_alignment": 70
  },
  "timeline": [
    { "year": 1, "path_taken": "...", "path_not_taken": "..." },
    { "year": 3, "path_taken": "...", "path_not_taken": "..." },
    { "year": 5, "path_taken": "...", "path_not_taken": "..." }
  ],
  "blindspots": [
    { "title": "...", "detail": "...", "source": "..." }
  ],
  "advisory_action": { "flagged": false, "message": null, "office_contact": null },
  "data_health": { "status": "GREEN", "is_stale": false, "last_fetched": "...", "fallback_used": false, "warning": null },
  "provider_used": "claude | gpt4o | gemini | stub"
}
```

> `advisory_action.flagged = true` when `score < 40` — show human advisor banner.
> `data_health.status = "RED"` forces the flag regardless of score.

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
| `POST /api/analyze` | ✅ Live (stub SSE stream — real agents Day 3) |
| `GET /api/decisions` | ✅ Live (stub row) |
| `GET /api/report/:uuid` | ✅ Live (stub) |
| `POST /api/rerun/:id` | 🔜 June 18 |
| Real agents + Supabase | 🔜 June 16–18 |

---

## Advisor Hub Integration (Planned)

### `GET /api/advisors?location=<string>&type=<physical|online|student>`
Returns a list of relevant counselors or advisors based on the user's persona and location.

**Backend Implementation Notes:**
- **Physical (`type=physical`):** Proxy a query to Google Places API (or Yelp Fusion) for "therapists", "career counselors", or "financial advisors" near the requested location.
- **Online (`type=online`):** Partner/scrape directories (e.g., Psychology Today, BetterHelp) or use a static pool of remote-first services via Apify integrations.
- **Student (`type=student`):** For student personas, query the College Scorecard API (US) or use a scoped Google Custom Search JSON API (`site:.edu "student counseling"`) to find relevant university counseling endpoints.
