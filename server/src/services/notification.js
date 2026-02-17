import axios from "axios";

/**
 * Format and send alert to Slack
 */
async function sendToSlack(data) {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) throw new Error("SLACK_WEBHOOK_URL not configured");

  const color = data.status === "DOWN" ? "danger" : "good";
  const statusEmoji = data.status === "DOWN" ? "🔴" : "🟢";

  const payload = {
    attachments: [
      {
        color,
        title: `${statusEmoji} Monitor ${data.status}`,
        fields: [
          {
            title: "URL",
            value: data.url,
            short: false,
          },
          {
            title: "Status",
            value: data.status,
            short: true,
          },
          ...(data.status_code
            ? [{ title: "Status Code", value: String(data.status_code), short: true }]
            : []),
          ...(data.error_message
            ? [{ title: "Error", value: data.error_message, short: false }]
            : []),
          ...(data.repo_link
            ? [{ title: "Repository", value: `<${data.repo_link}|View Repo>`, short: false }]
            : []),
        ],
        footer: "EpiTrace Monitor",
        ts: Math.floor(new Date(data.timestamp || new Date()).getTime() / 1000),
      },
    ],
  };

  return axios.post(slackUrl, payload);
}

/**
 * Format and send alert to Discord
 */
async function sendToDiscord(data) {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!discordUrl) throw new Error("DISCORD_WEBHOOK_URL not configured");

  const color = data.status === "DOWN" ? 16711680 : 65280; // Red or Green
  const statusEmoji = data.status === "DOWN" ? "🔴" : "🟢";

  const payload = {
    embeds: [
      {
        title: `${statusEmoji} Monitor ${data.status}`,
        color,
        fields: [
          {
            name: "URL",
            value: data.url,
            inline: false,
          },
          {
            name: "Status",
            value: data.status,
            inline: true,
          },
          ...(data.status_code
            ? [{ name: "Status Code", value: String(data.status_code), inline: true }]
            : []),
          ...(data.error_message
            ? [{ name: "Error", value: data.error_message, inline: false }]
            : []),
          ...(data.repo_link
            ? [{ name: "Repository", value: `[View](${data.repo_link})`, inline: false }]
            : []),
        ],
        footer: { text: "EpiTrace Monitor" },
        timestamp: data.timestamp || new Date().toISOString(),
      },
    ],
  };

  return axios.post(discordUrl, payload);
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
