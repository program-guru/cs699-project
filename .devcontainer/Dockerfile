# Dev Container base
FROM mcr.microsoft.com/devcontainers/javascript-node:26

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

ENV UV_INSTALL_DIR=/usr/local/bin \
    UV_NO_MODIFY_PATH=1

RUN curl -LsSf https://astral.sh/uv/0.12.19/install.sh | sh

WORKDIR /workspaces/