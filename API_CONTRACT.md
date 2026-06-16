# 🔌 API Contract (Frontend <-> Backend)

To ensure the frontend and backend teams are aligned, here are the expected endpoints the backend will expose and the frontend will consume:

### 1. `POST /api/analyze` (Core Analysis & SSE Stream)
- **Purpose**: Takes user inputs, triggers the agents, and streams the debate back.
- **Request Body (JSON)**:
  ```json
  {
    "session_id": "string",
    "decision_text": "string",
    "user_persona": "string (e.g., 'student', 'professional', 'freelancer')",
    "origin_city": "string (optional, if relocation is involved)",
    "destination_city": "string (optional, if relocation is involved)",
    "assumptions": {
      "expected_rent": 1500,
      "savings_rate": 20,
      "confidence": 85
    },
    "alternative_text": "string",
    "values_rank": ["financial", "growth", "balance", "roots"]
  }
  ```
- **Response**: Server-Sent Events (SSE) stream.
  - The backend should yield chunks formatted with specific event tags:
    - `event: atlas\ndata: <chunk>\n\n` *(ATLAS streams optimistic points)*
    - `event: vera\ndata: <chunk>\n\n` *(VERA streams realistic counterpoints)*
    - `event: done\ndata: { "score": 35, "grade": "F", "timeline": [...], "blindspots": [...], "advisory_action": {"flagged": true, "message": "High risk. Routing to nearest university career center / nonprofit office.", "office_contact": "..."}, "data_health": {...} }\n\n` *(AXIS outputs final payload, including routing info if score < 40)*
  - *Note: The `data_health` object is used by the frontend to render the Data Freshness Badge.*

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
