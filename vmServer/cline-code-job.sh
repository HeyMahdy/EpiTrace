#!/usr/bin/env bash

set -euo pipefail

export GH_PROMPT_DISABLED=1

agent_message="${1:-}"
REPO_URL="${2:-}"
TOKEN="${3:-}"
TOKEN="$(printf '%s' "$TOKEN" | tr -d '\r\n')"

# FIX 1: Ensure required inputs exist
if [[ -z "$agent_message" || -z "$REPO_URL" || -z "$TOKEN" ]]; then
  echo "Error: message, repo url, or github token missing" >&2
  exit 1
fi

echo "--- Starting New Job ---"

GIT_AUTH_B64="$(printf 'x-access-token:%s' "$TOKEN" | base64 | tr -d '\n')"
GIT_AUTH_HEADER="Authorization: Basic $GIT_AUTH_B64"

JOB_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vm-worker-XXXXXX")"
REPO_DIR="$JOB_DIR/repo"

cleanup() {
  rm -rf "$JOB_DIR"
}
trap cleanup EXIT

mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

echo "Cloning repository..."
git -c http.extraHeader="$GIT_AUTH_HEADER" clone "$REPO_URL" .

BRANCH_NAME="agent-fix-$(openssl rand -hex 4)"
git checkout -b "$BRANCH_NAME"

echo "Waking up agent 'cline' to do the job..."

CLINE_INSTRUCTION=$(cat <<EOF
You are in the root of the target repository. Apply a real code fix based on the issue description below.

Issue description:
$agent_message

Required workflow:
1) Locate the relevant files using repository search.
2) Implement the fix directly in code (not documentation-only).
3) Ensure at least one tracked source file is modified.
4) Verify with "git diff --name-only" that files changed.
5) Do not stop at analysis; make the code changes.

Output rules:
- Your final output must be exactly one line.
- That line must be a concise Git commit message title (max 72 chars).
- No markdown, no code blocks, no explanations, no conversational text.
EOF
)

COMMIT_MSG=$(cline -y "$CLINE_INSTRUCTION")

echo "Agent finished. Checking for changes..."

# FIX 3: Fixed indentation for the whole block
if [ -n "$(git status --porcelain)" ]; then
  echo "Changes detected! Committing..."

  git add .
  git commit -m "$COMMIT_MSG"
  git -c http.extraHeader="$GIT_AUTH_HEADER" push origin "$BRANCH_NAME"

  
  
  # FIX 4: Calculated WEB_URL (it was missing before, which would crash the echo below)
  echo "Creating Pull Request..."
  PR_URL=$(GH_TOKEN="$TOKEN" gh pr create \
    --repo "$REPO_URL" \
    --title "$COMMIT_MSG" \
    --body "Automated fix by Agent.
    **Triggered by Error:**
    \`$agent_message\`" \
    --head "$BRANCH_NAME" \
    --base "main")


    echo ":::PR_LINK:::"
    echo "$PR_URL"
    echo ":::PR_BRANCH:::"
    echo "$BRANCH_NAME"

  
else
  echo "No changes were made by the agent."
fi
