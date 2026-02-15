FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# Base tooling commonly needed by local code-analysis agents.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    ripgrep \
  && rm -rf /var/lib/apt/lists/*

# Optional: install your Cline/agent CLI here when you decide exact package.
# Example:
# RUN npm install -g <your-cline-cli-package>

# dockerRunner.js passes a runtime shell command, so no fixed ENTRYPOINT is required.
RUN npm install -g cline  
