"""
End-to-end test for the full /api/analyze SSE pipeline.
Run from blindspot-backend/: python tests/test_analyze.py

Requires the server to be running:
  python -m uvicorn main:app --port 8000
"""
import httpx
import json

API_URL = "http://localhost:8000/api/analyze"

PAYLOAD = {
    "session_id": "test-e2e-001",
    "decision_text": "Should I move from Kigali to Dubai for a new job?",
    "user_persona": "Software engineer, 3 years experience",
    "origin_city": "Kigali",
    "destination_city": "Dubai",
    "assumptions": {"salary_increase": 40, "confidence": 65, "expected_rent": 800, "savings_rate": 20},
    "values_rank": ["growth", "financial", "stability", "family"],
    "alternative_text": "Stay in Kigali and grow locally",
}


def main():
    print("Sending request to /api/analyze ...\n")
    print("=" * 60)

    current_event = None
    atlas_chars = 0
    vera_chars = 0
    axis_chars = 0

    with httpx.Client(timeout=120.0) as client:
        with client.stream("POST", API_URL, json=PAYLOAD) as response:
            if response.status_code != 200:
                print(f"ERROR: HTTP {response.status_code}")
                response.read()
                print(response.text)
                return

            for line in response.iter_lines():
                if line.startswith("event:"):
                    current_event = line.split(":", 1)[1].strip()
                    if current_event in ("atlas", "vera", "axis", "done", "error"):
                        print(f"\n[{current_event.upper()}] ", end="", flush=True)

                elif line.startswith("data:"):
                    data = line.split(":", 1)[1].strip()

                    if current_event == "atlas":
                        print(data, end="", flush=True)
                        atlas_chars += len(data)

                    elif current_event == "vera":
                        print(data, end="", flush=True)
                        vera_chars += len(data)

                    elif current_event == "axis":
                        print(data, end="", flush=True)
                        axis_chars += len(data)

                    elif current_event == "done":
                        print("\n\n" + "=" * 60)
                        print("DONE PAYLOAD:")
                        try:
                            done = json.loads(data)
                            print(f"  score           : {done.get('score')} ({done.get('grade')})")
                            print(f"  components      : {done.get('components')}")
                            advisory = done.get("advisory_action", {})
                            print(f"  advisory_flag   : {advisory.get('flagged')}")
                            bs = done.get("blindspots", [])
                            print(f"  blindspots ({len(bs)}): {bs[0][:80] if bs else 'none'}...")
                            tl = done.get("timeline", {})
                            print(f"  timeline keys   : {list(tl.keys())}")
                            print(f"  provider        : {done.get('provider_used')}")
                        except json.JSONDecodeError:
                            print(f"  (raw) {data[:200]}")

                    elif current_event == "error":
                        print(f"\nERROR EVENT: {data}")

    print("\n\n" + "=" * 60)
    print("SUMMARY:")
    print(f"  ATLAS chars  : {atlas_chars}")
    print(f"  VERA chars   : {vera_chars}")
    print(f"  AXIS summary : {axis_chars} chars")


if __name__ == "__main__":
    main()
