require("dotenv").config();

const { spawn } = require("child_process");
const { Worker } = require("bullmq");
const myRedisConnection = require("./radis.config");


const coder_agent = new Worker(
  "code_queue",
  async (Job) => {
    const agent_message = Job.data.agent_message;
    const git_hub_repo = Job.data.git_hub_repo;
    const github_access_token = Job.data.github_access_token

    console.log(agent_message);

    const missingFields = [];
    if (!agent_message) missingFields.push("agent_message");
    if (!git_hub_repo) missingFields.push("git_hub_repo");
    if(!github_access_token) missingFields.push("github_access_token");
    if (missingFields.length) {
      throw new Error(
        `Job ${Job.id} is missing required data: ${missingFields.join(", ")}. Payload=${JSON.stringify(
          Job.data,
        )}`,
      );
    }

    return new Promise((resolve, reject) => {
      const child = spawn("bash", ["cline-code-job.sh", agent_message, git_hub_repo,github_access_token]);

      let fullLogOutput = "";

      child.stdout.on("data", (data) => {
        console.log(`[Logs]: ${data.toString().trim()}`);
        fullLogOutput += data.toString();
      });

      child.stderr.on("data", (data) => {
        console.error(`[Error/Warning]: ${data.toString().trim()}`);
      });

      child.on("close", async (code) => {
        if (code !== 0) {
          reject(new Error(`Bash script failed with exit code ${code}`));
          return;
        }

        console.log(`Job ${Job.id} completed successfully!`);
        const commitLinkChunk = fullLogOutput.split(":::COMMIT_LINK:::")[1];
        const linkLine = commitLinkChunk
          ? commitLinkChunk
              .trim()
              .split("\n")
              .map((line) => line.trim())
              .find((line) => /^https?:\/\//.test(line))
          : "";
        const commit_link = linkLine || "";

        if (!commit_link) {
          reject(
            new Error(
              `No commit link found in script output for job ${Job.id}. Output=${fullLogOutput}`,
            ),
          );
          return;
        }

        resolve(commit_link);
      });
    });
  },
  {
    connection: myRedisConnection,
    concurrency: 5,
  },
);

console.log("Code worker running on queue: code_queue");
