import axios from "axios";
import { pool } from "../config/db.js";
import { connection } from "../config/redis.js";

function getServerBaseUrl() {
  if (process.env.SERVER_PUBLIC_URL) {
    return process.env.SERVER_PUBLIC_URL.replace(/\/$/, "");
  }
  const port = process.env.PORT || 8080;
  return `http://localhost:${port}`;
}

async function createAgentTriggerLink(data) {
  if (!data.jobId || !data.git_hub_repo || !data.extractedAnalysis) {
    return null;
  }

  try {
    const triggerKey = `agent-trigger:${data.jobId}`;
    const triggerPayload = {
      agent_message: data.extractedAnalysis,
      git_hub_repo: data.git_hub_repo,
    };
    await connection.setex(triggerKey, 24 * 60 * 60, JSON.stringify(triggerPayload));

    return `${getServerBaseUrl()}/alert/trigger-agent?jobId=${encodeURIComponent(String(data.jobId))}`;
  } catch (error) {
    console.error("Failed to create magic trigger link:", error.message);
    return null;
  }
}

/**
 * Format and send alert to Slack
 */
async function sendToSlack(data, webhookUrl) {
  if (!webhookUrl) throw new Error("Webhook URL not configured");

  const isAiAlert =
    data.monitorId !== undefined ||
    data.jobId !== undefined ||
    data.git_hub_repo !== undefined;

  if (isAiAlert && !data.extractedAnalysis) {
    const aiErrorMessage = data.error_message || "Analysis failed";
    const endpointUrl = data.endpoint || data.url;
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
            ...(endpointUrl
              ? [{ title: "Endpoint", value: endpointUrl, short: false }]
              : []),
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

    return axios.post(webhookUrl, payload);
  }

  if (data.extractedAnalysis) {
    const endpointUrl = data.endpoint || data.url;
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
            ...(endpointUrl
              ? [{ title: "Endpoint", value: endpointUrl, short: false }]
              : []),
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
            ...(data.trigger_link
              ? [
                  {
                    title: "Auto-Fix",
                    value: `<${data.trigger_link}|🛠️ Click Here to Launch Auto-Fix>`,
                    short: false,
                  },
                ]
              : []),
          ],
          footer: "EpiTrace AI Worker",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return axios.post(webhookUrl, payload);
  }

  throw new Error("Unsupported alert payload: expected AI analysis data");
}

/**
 * Format and send alert to Discord
 */
async function sendToDiscord(data, webhookUrl) {
  if (!webhookUrl) throw new Error("Discord webhook URL not configured");

  const isAiAlert =
    data.monitorId !== undefined ||
    data.jobId !== undefined ||
    data.git_hub_repo !== undefined;

  if (isAiAlert && !data.extractedAnalysis) {
    const aiErrorMessage = data.error_message || "Analysis failed";
    const endpointUrl = data.endpoint || data.url;
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
            ...(endpointUrl
              ? [{ name: "Endpoint", value: endpointUrl, inline: false }]
              : []),
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

    return axios.post(webhookUrl, payload);
  }

  if (data.extractedAnalysis) {
    const endpointUrl = data.endpoint || data.url;
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
            ...(endpointUrl
              ? [{ name: "Endpoint", value: endpointUrl, inline: false }]
              : []),
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
            ...(data.trigger_link
              ? [
                  {
                    name: "Auto-Fix",
                    value: `[🛠️ Click Here to Launch Auto-Fix](${data.trigger_link})`,
                    inline: false,
                  },
                ]
              : []),
          ],
          footer: { text: "EpiTrace AI Worker" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return axios.post(webhookUrl, payload);
  }

  throw new Error("Unsupported alert payload: expected AI analysis data");
}

async function getMonitorWebhooks(monitorId) {
  const { rows } = await pool.query(
    `SELECT uw.* FROM user_webhooks uw
     INNER JOIN monitor_webhooks mw ON uw.id = mw.webhook_id
     WHERE mw.monitor_id = $1 AND uw.is_active = true`,
    [monitorId],
  );

  if (!rows.length) throw new Error("No webhooks configured for this monitor");

  return rows;
}

/**
 * Send alert to all configured webhooks for a monitor
 */
export async function sendAlert(data) {
  const webhooks = await getMonitorWebhooks(data.monitorId);
  const trigger_link = await createAgentTriggerLink(data);
  const alertData = trigger_link ? { ...data, trigger_link } : data;
  
  if (!webhooks.length) {
    console.warn(`No webhooks configured for monitor ${data.monitorId}`);
    return;
  }

  const results = [];
  for (const webhook of webhooks) {
    try {
      let result;
      if (webhook.provider === "slack") {
        result = await sendToSlack(alertData, webhook.webhook_url);
      } else if (webhook.provider === "discord") {
        result = await sendToDiscord(alertData, webhook.webhook_url);
      } else {
        console.warn(`Unknown notification provider: ${webhook.provider}`);
        continue;
      }
      results.push({ webhookId: webhook.id, provider: webhook.provider, success: true });
    } catch (error) {
      console.error(`Failed to send alert to ${webhook.provider} webhook:`, error.message);
      results.push({ webhookId: webhook.id, provider: webhook.provider, success: false, error: error.message });
    }
  }

  return results;
}
