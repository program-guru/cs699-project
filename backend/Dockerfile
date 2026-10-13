FROM python:3.12-slim

WORKDIR /workspace

RUN apt-get update && apt-get install -y \
    git curl nano vim \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    requests beautifulsoup4 lxml \
    "pydantic>=2,<3" PyYAML \
    fastapi uvicorn pytest debugpy

CMD ["bash"]