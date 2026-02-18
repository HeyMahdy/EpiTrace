import axios from "axios";

/**
 * Format and send alert to Slack
 */
async function sendToSlack(data) {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) throw new Error("SLACK_WEBHOOK_URL not configured");

  const isAiAlert = data.jobId !== undefined || data.git_hub_repo !== undefined;

  if (isAiAlert && !data.extractedAnalysis) {
    const aiErrorMessage = data.error_message || "Analysis failed";
    const payload = {
      attachments: [
        {
          color: "danger",
          title: "Ai analysis failed",
          fields: [
            {
              title: "Job ID",
              value: String(data.jobId),
              short: true,
            },
            {
              title: "Error",
              value: aiErrorMessage,
              short: false,
            },
            {
              title: "Repository",
              value: `<${data.git_hub_repo}|View Repo>`,
              short: false,
            },
          ],
          footer: "EpiTrace AI Worker",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return axios.post(slackUrl, payload);
  }

  if (data.extractedAnalysis) {
    const payload = {
      attachments: [
        {
          color: "#d97706",
          title: "AI Incident Analysis",
          fields: [
            {
              title: "Job ID",
              value: String(data.jobId),
              short: true,
            },
            ...(data.error_message
              ? [{ title: "Error", value: data.error_message, short: false }]
              : []),
            {
              title: "Repository",
              value: `<${data.git_hub_repo}|View Repo>`,
              short: false,
            },
            {
              title: "Analysis",
              value: data.extractedAnalysis,
              short: false,
            },
          ],
          footer: "EpiTrace AI Worker",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return axios.post(slackUrl, payload);
  }

  throw new Error("Unsupported alert payload: expected AI analysis data");
}

/**
 * Format and send alert to Discord
 */
async function sendToDiscord(data) {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!discordUrl) throw new Error("DISCORD_WEBHOOK_URL not configured");

  const isAiAlert = data.jobId !== undefined || data.git_hub_repo !== undefined;

  if (isAiAlert && !data.extractedAnalysis) {
    const aiErrorMessage = data.error_message || "Analysis failed";
    const payload = {
      embeds: [
        {
          title: "Ai analysis failed",
          color: 16711680,
          fields: [
            {
              name: "Job ID",
              value: String(data.jobId),
              inline: true,
            },
            {
              name: "Error",
              value: aiErrorMessage,
              inline: false,
            },
            {
              name: "Repository",
              value: `[View](${data.git_hub_repo})`,
              inline: false,
            },
          ],
          footer: { text: "EpiTrace AI Worker" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return axios.post(discordUrl, payload);
  }

  if (data.extractedAnalysis) {
    const payload = {
      embeds: [
        {
          title: "AI Incident Analysis",
          color: 16760576,
          fields: [
            {
              name: "Job ID",
              value: String(data.jobId),
              inline: true,
            },
            ...(data.error_message
              ? [{ name: "Error", value: data.error_message, inline: false }]
              : []),
            {
              name: "Repository",
              value: `[View](${data.git_hub_repo})`,
              inline: false,
            },
            {
              name: "Analysis",
              value: data.extractedAnalysis,
              inline: false,
            },
          ],
          footer: { text: "EpiTrace AI Worker" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return axios.post(discordUrl, payload);
  }

  throw new Error("Unsupported alert payload: expected AI analysis data");
}

/**
 * Send alert to configured provider
 */
export async function sendAlert(data) {
  const provider = process.env.NOTIFICATION_PROVIDER || "slack";

  if (provider === "slack") {
    return sendToSlack(data);
  } else if (provider === "discord") {
    return sendToDiscord(data);
  } else {
    throw new Error(`Unknown notification provider: ${provider}`);
  }
}
