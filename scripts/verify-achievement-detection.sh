#!/usr/bin/env bash
# Repeatable verification pass for the seed-copilot Edge Function's
# Achievement-detection rules (see supabase/functions/seed-copilot/
# prompt.ts and toolSchema.ts).
#
# Hits the REAL deployed Edge Function (whichever AI_PROVIDER is
# configured server-side — Groq/Llama-3.3-70B by default, see
# provider.ts) over HTTPS, never the local mock fallback (localAssistant.
# ts). Only ever sends synthetic, throwaway messages against a fixed
# in-memory seedId ("verification-run") — never reads or writes any real
# candidate data.
#
# Requires VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local, and
# a real Supabase account's credentials (QA_EMAIL/QA_PASSWORD below, or
# override via env vars) since the function requires a valid JWT.
#
# Usage: ./scripts/verify-achievement-detection.sh [output-dir]
# Writes one JSON file per test case (raw request + response) to the
# output directory (default: ./verification-results).

set -euo pipefail
cd "$(dirname "$0")/.."

export QA_EMAIL="${QA_EMAIL:-sg.qa.candidate.0725@mailinator.com}"
export QA_PASSWORD="${QA_PASSWORD:-SeedGrove!QA2026}"
OUT_DIR="${1:-verification-results}"
mkdir -p "$OUT_DIR"

export ANON_KEY
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
export SUPA_URL
SUPA_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d= -f2)

ACCESS_TOKEN=$(curl -s -X POST "$SUPA_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "$(python3 <<'PYEOF'
import json, os
print(json.dumps({"email": os.environ["QA_EMAIL"], "password": os.environ["QA_PASSWORD"]}))
PYEOF
)" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
export ACCESS_TOKEN

# Fixed seed context shared by every case.
export SEED_CONTEXT_JSON='{"title":"Customer Churn Dashboard Project","description":"Analytics project for reducing customer churn.","status":"in_progress","progress":70}'

export CHURN_DASHBOARD_MSG="I built a customer churn dashboard in Power BI connected to PostgreSQL, reducing weekly reporting time from 4 hours to 30 minutes."
export EXISTING_EVIDENCE_JSON='[{"category":"Data Visualization","title":"Customer Churn Dashboard","description":"Built a customer churn dashboard in Power BI connected to PostgreSQL, reducing weekly reporting time from 4 hours to 30 minutes."}]'

REQUEST_BODY_FILE=$(mktemp)
trap 'rm -f "$REQUEST_BODY_FILE"' EXIT

call_copilot() {
  local id="$1"
  local message="$2"
  local evidence_json="$3"

  MESSAGE="$message" EVIDENCE_JSON="$evidence_json" python3 <<'PYEOF' > "$REQUEST_BODY_FILE"
import json, os
print(json.dumps({
    "seedId": "verification-run",
    "seedContext": json.loads(os.environ["SEED_CONTEXT_JSON"]),
    "message": os.environ["MESSAGE"],
    "recentMessages": [],
    "activity": [],
    "evidence": json.loads(os.environ["EVIDENCE_JSON"]),
}))
PYEOF

  # Groq rate-limits a tight burst of requests — retry with backoff on a
  # transient provider error (the fixed PROVIDER_UNAVAILABLE_MESSAGE from
  # index.ts) rather than silently recording it as a result. An error
  # response has neither "evidenceCandidate" nor a real "message", so
  # treating it as a plain miss would misreport an infra hiccup as a
  # genuine model decision.
  local attempt=1
  while true; do
    curl -s -X POST "$SUPA_URL/functions/v1/seed-copilot" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "apikey: $ANON_KEY" \
      -H "Content-Type: application/json" \
      -d @"$REQUEST_BODY_FILE" > "$OUT_DIR/$id.json"

    if RESULT_FILE="$OUT_DIR/$id.json" python3 -c "
import json, os
d = json.load(open(os.environ['RESULT_FILE']))
exit(1 if 'error' in d else 0)
"; then
      break
    fi
    if [ "$attempt" -ge 4 ]; then
      echo "$id: FAILED after $attempt attempts (provider error) — see $OUT_DIR/$id.json" >&2
      break
    fi
    attempt=$((attempt + 1))
    sleep 4
  done
  sleep 1.5

  local has_candidate
  has_candidate=$(RESULT_FILE="$OUT_DIR/$id.json" python3 <<'PYEOF'
import json, os
d = json.load(open(os.environ["RESULT_FILE"]))
if "error" in d:
    print("ERROR")
else:
    print("evidenceCandidate" in d)
PYEOF
)
  echo "$id: evidenceCandidate=$has_candidate"
}

echo "=== Should create an Achievement ==="
call_copilot "S1_built_artifact" "$CHURN_DASHBOARD_MSG" "[]"
call_copilot "S2_technical_decision" "I decided to switch our real-time updates from REST polling to WebSockets, which cut server load by 40% and removed the 5-second polling delay." "[]"
call_copilot "S3_solved_problem" "I fixed a bug where the payment webhook was silently dropping about 15% of transactions because of a race condition in the idempotency check." "[]"
call_copilot "S4_measurable_improvement" "I added composite indexes to our database queries, which reduced average API response time from 800ms to 120ms." "[]"
call_copilot "S5_major_milestone" "I completed the full MVP of our recommendation engine — it's now generating personalized suggestions end-to-end for all 10,000 of our test users." "[]"
call_copilot "S6_deployed_output" "I deployed the fraud detection model to production using Docker and AWS ECS, and it's now scoring live transactions in real time." "[]"
call_copilot "S7_certification" "I earned the AWS Certified Solutions Architect – Associate certification after passing the exam this week." "[]"

echo ""
echo "=== Should NOT create an Achievement ==="
call_copilot "N1_future_plan" "I'm planning to build a Power BI dashboard for churn analysis next sprint." "[]"
call_copilot "N2_question" "What's the best way to handle class imbalance in a churn prediction model?" "[]"
call_copilot "N3_request_for_help" "Can you help me figure out why my Power BI dashboard isn't refreshing correctly?" "[]"
call_copilot "N4_generic_learning" "I learned a lot about Power BI and DAX formulas this week." "[]"
call_copilot "N5_unresolved_bug" "My dashboard keeps crashing when I filter by date range and I can't figure out why." "[]"
call_copilot "N6_vague_progress" "I worked on the dashboard some more today." "[]"
call_copilot "N7_duplicate" "$CHURN_DASHBOARD_MSG" "$EXISTING_EVIDENCE_JSON"
call_copilot "N8_someone_else" "My teammate built the churn dashboard in Power BI — I just reviewed it and gave some feedback on the layout." "[]"

echo ""
echo "=== Extra: verification rule #6 (accept a genuinely new Achievement from the same project) ==="
call_copilot "X1_new_achievement_same_project" "I deployed the churn model to production using Docker and set up a CI pipeline that cut deployment time from 30 minutes to 5 minutes." "$EXISTING_EVIDENCE_JSON"

echo ""
echo "Raw results written to $OUT_DIR/"
