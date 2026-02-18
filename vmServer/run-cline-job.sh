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

AGENT_RESULT=$(cline -y "Please check the following error: $ERROR_MSG at this endpoint: $ENDPOINT . after finding the error write a analysis on why this error is coming")

echo ":::FINAL_ANALYSIS:::"
echo "$AGENT_RESULT"
