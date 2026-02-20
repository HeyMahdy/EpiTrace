#!/usr/bin/env bash

set -euo pipefail

export GH_PROMPT_DISABLED=1

agent_message="${1:-}"
REPO_URL="${2:-}"
TOKEN="${3:-}"
TOKEN="$(printf '%s' "$TOKEN" | tr -d '\r\n')"

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

echo "Waking up Agent 'cline' to handle fixes and testing..."

CLINE_INSTRUCTION=$(cat <<EOF
You are in the root of the target repository. Apply a real code fix based on the issue description below.

Issue description:
$agent_message

Required workflow:
1) Locate the relevant files and implement the fix directly in code.
2) Analyze the repository to determine if unit tests exist (e.g., look for package.json scripts, pytest files, Makefile, etc.).
3) If tests exist, execute the correct test command in the terminal to verify your changes.
4) If tests fail, debug and update your code iteratively until they pass.
5) If no tests exist in the repository, simply skip the testing phase.

Output rules:
- Your final output must be exactly ONE line in this exact format:
  STATUS | COMMIT_MESSAGE
- STATUS must be exactly one of: PASSED (if tests ran and passed), SKIPPED (if no tests exist), or FAILED (if tests exist but you could not get them to pass).
- COMMIT_MESSAGE must be a highly descriptive Conventional Commit message (max 72 chars, e.g., "fix(auth): resolve null pointer in login flow").
- Do not output any markdown, explanations, or code blocks.
EOF
)

# Run the agent and capture its formatted output
AGENT_OUTPUT=$(cline -y "$CLINE_INSTRUCTION")
echo "Agent finished. Raw Output: $AGENT_OUTPUT"
echo "------------------------------------------------"

# Parse the agent's output using bash string manipulation
TEST_STATUS="${AGENT_OUTPUT%% | *}"
COMMIT_MSG="${AGENT_OUTPUT#* | }"

# Fallback: If the agent hallucinated the format and didn't include the " | " delimiter
if [[ "$TEST_STATUS" == "$AGENT_OUTPUT" ]]; then
  echo "⚠️ Warning: Agent did not use the exact STATUS | MESSAGE format."
  TEST_STATUS="UNKNOWN"
  COMMIT_MSG="$AGENT_OUTPUT"
fi

# Gatekeeper based on the agent's reported test status
if [[ "$TEST_STATUS" == "FAILED" ]]; then
  echo "❌ Error: The agent reported that it could not get the unit tests to pass. Aborting pipeline." >&2
  exit 1
elif [[ "$TEST_STATUS" == "SKIPPED" ]]; then
  echo "⚠️ Agent reported no tests found. Skipping test verification."
elif [[ "$TEST_STATUS" == "PASSED" ]]; then
  echo "✅ Agent successfully verified the fix against the test suite!"
else
  echo "⚠️ Unrecognized test status: $TEST_STATUS. Proceeding with caution."
fi

echo "------------------------------------------------"

# Check for actual file modifications before committing
if [ -n "$(git status --porcelain)" ]; then
  echo "Changes detected! Committing..."

  git add .
  git commit -m "$COMMIT_MSG"
  git -c http.extraHeader="$GIT_AUTH_HEADER" push origin "$BRANCH_NAME"

  echo "Creating Pull Request..."
  PR_URL=$(GH_TOKEN="$TOKEN" gh pr create \
    --repo "$REPO_URL" \
    --title "$COMMIT_MSG" \
    --body "Automated fix by AI Agent.
    
**Triggered by Error:**
\`$agent_message\`

**Agent Testing Status:** \`$TEST_STATUS\`" \
    --head "$BRANCH_NAME" \
    --base "main")

  echo ":::PR_LINK:::"
  echo "$PR_URL"
  echo ":::PR_BRANCH:::"
  echo "$BRANCH_NAME"
  
else
  echo "No changes were made by the agent."
fi