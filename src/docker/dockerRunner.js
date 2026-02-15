import { spawn } from "node:child_process";
import path from "node:path";
import "dotenv/config";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

export async function runDockerInvestigation({
  incidentId,
  incidentDir,
  projectPath,
}) {
  const image = process.env.ANALYSIS_DOCKER_IMAGE || "alpine:3.21";
  const clineAgentCommand = process.env.CLINE_AGENT_CMD || "";
  const openAiApiKey = process.env.OPENAI_API_KEY || "";
  const agentOutputPath = "/incident/agent-output.md";

  if (!clineAgentCommand.trim()) {
    throw new Error("CLINE_AGENT_CMD is required and cannot be empty");
  }
  const absoluteIncidentDir = path.resolve(incidentDir);
  const absoluteProjectPath = path.resolve(projectPath);

  const script = [
    "set -eu",
    'echo "# Incident Investigation"',
    'echo ""',
    'echo "Incident ID: $INCIDENT_ID"',
    'echo "Generated At: $(date -u +%Y-%m-%dT%H:%M:%SZ)"',
    'echo ""',
    'echo "## Error Details"',
    'cat /incident/prompt.txt',
    'echo ""',
    'echo "## Agent Output"',
    'sh -lc "$CLINE_AGENT_CMD" > "$AGENT_OUTPUT_PATH" 2>&1',
    'cat "$AGENT_OUTPUT_PATH"',
  ].join("; ");

  const args = [
    "run",
    "--rm",
    "--user",
    `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
    "-e",
    `INCIDENT_ID=${incidentId}`,
    "-e",
    `CLINE_AGENT_CMD=${clineAgentCommand}`,
    "-e",
    `OPENAI_API_KEY=${openAiApiKey}`,
    "-e",
    `AGENT_OUTPUT_PATH=${agentOutputPath}`,
    "-v",
    `${absoluteProjectPath}:/workspace:ro`,
    "-v",
    `${absoluteIncidentDir}:/incident:rw`,
    image,
    "sh",
    "-lc",
    script,
  ];

  const result = await runCommand("docker", args);

  if (result.code !== 0) {
    const stdout = result.stdout?.trim();
    const stderr = result.stderr?.trim();
    throw new Error(
      [
        `Docker investigation failed (code ${result.code}).`,
        stderr ? `stderr: ${stderr}` : "stderr: <empty>",
        stdout ? `stdout: ${stdout}` : "stdout: <empty>",
      ].join(" "),
    );
  }

  return {
    image,
    agentOutputPath,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

export default runDockerInvestigation;
