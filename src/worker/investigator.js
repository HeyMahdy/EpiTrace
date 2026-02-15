import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import runDockerInvestigation from "../docker/dockerRunner.js";

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

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

export async function investigateIncident({
  incidentId,
  incidentDir,
  promptPath,
  repoUrl,
}) {
  const absolutePromptPath = path.resolve(promptPath);
  const absoluteIncidentDir = path.resolve(incidentDir);
  const repoDir = path.join(absoluteIncidentDir, "repo");

  if (typeof repoUrl !== "string" || !repoUrl.trim()) {
    throw new Error("repo_url must be a non-empty string");
  }

  await access(absolutePromptPath);
  const promptContent = await readFile(absolutePromptPath, "utf8");

  await mkdir(repoDir, { recursive: true });
  const cloneResult = await runCommand("git", [
    "clone",
    "--depth",
    "1",
    repoUrl,
    repoDir,
  ]);
  if (cloneResult.code !== 0) {
    const stderr = cloneResult.stderr?.trim() || "unknown error";
    throw new Error(`git clone failed: ${stderr}`);
  }

  const projectStats = await stat(repoDir);
  if (!projectStats.isDirectory()) {
    throw new Error("cloned repo path is not a directory");
  }

  const dockerResult = await runDockerInvestigation({
    incidentId,
    incidentDir: absoluteIncidentDir,
    projectPath: repoDir,
  });
  const agentOutputFilePath = path.join(absoluteIncidentDir, "agent-output.md");
  let agentOutput = dockerResult.stdout || "No output from Docker investigator.";
  try {
    const fileOutput = await readFile(agentOutputFilePath, "utf8");
    if (fileOutput.trim()) {
      agentOutput = fileOutput.trim();
    }
  } catch {
    // Agent output file is optional; fall back to docker stdout.
  }

  const reportPath = path.join(absoluteIncidentDir, "report.md");
  const report = [
    "# Analysis Report",
    "",
    `Incident ID: ${incidentId}`,
    `Project Path: ${repoDir}`,
    `Prompt Path: ${absolutePromptPath}`,
    "",
    "## Input Error Details",
    promptContent.trim(),
    "",
    "## Investigator Output",
    agentOutput,
    "",
  ].join("\n");

  await writeFile(reportPath, report, "utf8");

  return {
    reportPath,
    agentOutputPath: agentOutputFilePath,
    dockerImage: dockerResult.image,
  };
}

export default investigateIncident;
