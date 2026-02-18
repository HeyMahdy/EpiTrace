#!/usr/bin/env bash

set -euo pipefail

agent_message="${1:-}"
REPO_URL="${2:-}"

# FIX 1: Corrected syntax for OR (||) check
if [[ -z "$agent_message" || -z "$REPO_URL" ]]; then
  echo "Error: message or repo url missing" >&2
  exit 1
fi

echo "--- Starting New Job ---"

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

BRANCH_NAME="agent-fix-$(openssl rand -hex 4)"
git checkout -b "$BRANCH_NAME"

echo "Waking up agent 'cline' to do the job..."

# FIX 2: Changed $ERROR_MSG to $agent_message so it matches your input variable
COMMIT_MSG=$(cline -y "I am providing an error and its solution here: $agent_message. Please implement this solution in the code. Once the fix is applied, your final output to me must be a single, concise Git commit message describing exactly what you changed. Do not write 'Done' or any conversational text. Just the commit message.")

echo "Agent finished. Checking for changes..."

# FIX 3: Fixed indentation for the whole block
if [ -n "$(git status --porcelain)" ]; then
  echo "Changes detected! Committing..."

  git add .
  git commit -m "$COMMIT_MSG"
  git push origin "$BRANCH_NAME"

  COMMIT_HASH=$(git rev-parse HEAD)
  
  # FIX 4: Calculated WEB_URL (it was missing before, which would crash the echo below)
  WEB_URL=${REPO_URL%.git}

  echo ":::COMMIT_LINK:::"
  echo "$WEB_URL/commit/$COMMIT_HASH"
  echo ":::PR_BRANCH:::"
  echo "$BRANCH_NAME"
else
  echo "No changes were made by the agent."
fi
