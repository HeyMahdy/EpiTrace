#!/usr/bin/env bash

set -euo pipefail

ENDPOINT="${1:-}"
REPO_URL="${2:-}"
ERROR_MSG="${3:-}"

if [ -z "$ENDPOINT" ] || [ -z "$REPO_URL" ] || [ -z "$ERROR_MSG" ]; then
  echo "Usage: $0 <endpoint> <repo_url> <error_message>" >&2
  exit 1
fi

echo "--- Starting New Job ---"
echo "Target Repo: $REPO_URL"
echo "Target Endpoint: $ENDPOINT"
echo "Fixing Error: $ERROR_MSG"

JOB_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vm-worker-XXXXXX")"
REPO_DIR="$JOB_DIR/repo"

cleanup() {
  rm -rf "$JOB_DIR"
}
trap cleanup EXIT

mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

echo "Cloning repository..."

git clone "$REPO_URL" .

echo "Waking up agent 'cline' to do the job..."

ANALYSIS_PROMPT=$(cat <<EOF
Investigate the backend error described below and produce a high-quality technical analysis.

Endpoint:
$ENDPOINT

Observed error/context:
$ERROR_MSG

Required analysis process:
1) Locate the endpoint handler and related service/db code.
2) Trace request flow from route params/body/query to the failing operation.
3) Identify the exact root cause in code.
4) Validate root cause with concrete evidence from the codebase.
5) Propose the minimal safe fix (do not implement it in this task).

Output format (use these exact section headers):
1. Summary
2. Root Cause
3. Evidence (file paths and key lines/functions)
4. Reproduction Path
5. Impact and Risk
6. Recommended Fix
7. Verification Plan

Quality requirements:
- Be specific, technical, and repository-grounded.
- Reference real file paths and symbols.
- Avoid generic statements and avoid conversational filler.
EOF
)

AGENT_RESULT=$(cline -y "$ANALYSIS_PROMPT")

echo ":::FINAL_ANALYSIS:::"
echo "$AGENT_RESULT"
