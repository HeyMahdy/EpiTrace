require("dotenv").config();

const path = require("path");
const { spawn } = require("child_process");
const { Worker, Job } = require("bullmq");
const axios = require("axios");
const myRedisConnection = require("../shared/redisConnection");


const agent_worker = new Worker(
  "agent",
  async (Job) => {
    // 1. Data Validation
    const { error_message, endpoint, git_hub_repo } = Job.data;

    if (!error_message || !endpoint || !git_hub_repo) {
      throw new Error(`Job ${Job.id} is missing required data. Check the payload.`);
    } 

    // 2. Return the Promise
    return new Promise((resolve, reject) => {
      // 3. Spawn the child process
      const child = spawn('bash', ['run-cline-job.sh', endpoint, git_hub_repo, error_message]);

      let fullLogOutput = "";

      child.stdout.on('data', (data) => {
        console.log(`[Logs]: ${data.toString().trim()}`);
         fullLogOutput = fullLogOutput + data.toString().trim();

      });

      child.stderr.on('data', (data) => {
        console.error(`[Error/Warning]: ${data.toString().trim()}`);
      });

      child.on('close', async (code) => {
        if (code === 0) {
          // Exit code 0 means pure success in Linux!
          console.log(`Job ${Job.id} completed successfully!`);
          const extractedAnalysis = fullLogOutput.split(':::FINAL_ANALYSIS:::')[1];
          const finalAnalysis = extractedAnalysis ? extractedAnalysis.trim() : "No analysis found.";
          console.log(finalAnalysis);

          try {
            const response = await axios.post(endpoint, {
              extractedAnalysis: finalAnalysis,
              jobId: Job.id,
              git_hub_repo,
              error_message,
            });
            console.log(`Analysis sent to ${endpoint} with status ${response.status}`);
            resolve(finalAnalysis);
          } catch (error) {
            const errMsg = error.response?.data || error.message;
            reject(new Error(`Failed to send analysis to endpoint ${endpoint}: ${JSON.stringify(errMsg)}`));
          }
        } else {
          // Any other code (1, 2, 127, etc.) means something broke.
          reject(new Error(`Bash script failed with exit code ${code}`));
        }
      });
    }); // <-- Closes the Promise
  }, // <-- Closes the async function (This was missing!)
  {
    // BullMQ options: Make sure it connects to your Redis instance!
    connection: myRedisConnection,
    concurrency: 10
  }
); // <-- Closes the

