# n8n-nodes-nvidia-nim

This is an n8n community node package that lets you use **NVIDIA NIM** (NVIDIA Inference Microservices) in your n8n workflows.

NVIDIA NIM provides GPU-accelerated inference for large language models (LLMs) via an OpenAI-compatible API. It supports popular open-source models such as Meta Llama, Mistral, and NVIDIA Nemotron, accessible through NVIDIA's hosted endpoint or a self-hosted NIM microservice.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

---

## Table of Contents

- [Installation](#installation)
- [Nodes](#nodes)
- [Credentials](#credentials)
- [Operations](#operations)
- [Parameters](#parameters)
- [Supported Models](#supported-models)
- [Base URL Override](#base-url-override)
- [AI Agent Workflows](#ai-agent-workflows)
- [Compatibility](#compatibility)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## Installation

### Via n8n UI (recommended)

1. Open your n8n instance.
2. Go to **Settings → Community Nodes**.
3. Click **Install**.
4. Enter the package name: `n8n-nodes-nvidia-nim`.
5. Click **Install** and confirm.

### Via CLI

```bash
# In your n8n data directory:
npm install n8n-nodes-nvidia-nim
# or
pnpm add n8n-nodes-nvidia-nim
```

---

## Nodes

This package provides two nodes:

| Node | Type | Description |
|------|------|-------------|
| **NVIDIA NIM** | Action / HTTP | Execute chat completions directly; output includes choices, usage, and metadata |
| **NVIDIA NIM Chat Model** | AI Language Model | Supply an NVIDIA NIM model to AI Agent, AI Chain, or other AI sub-nodes |

---

## Credentials

Before using any NVIDIA NIM node, you must set up **NVIDIA NIM API** credentials:

### Prerequisites

1. Create a free NVIDIA developer account at [build.nvidia.com](https://build.nvidia.com/).
2. Navigate to any model page and click **Get API Key** to generate your key.

### Credential Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| **API Key** | ✅ Yes | — | Your NVIDIA NIM API key (starts with `nvapi-...`) |
| **Base URL** | No | `https://integrate.api.nvidia.com/v1` | Override for self-hosted NIM instances |

---

## Operations

### NVIDIA NIM (Action Node)

**Resource: Chat**

| Operation | Description |
|-----------|-------------|
| **Completions** | Send messages to a NIM model and receive a completion |

---

## Parameters

### Chat → Completions

| Parameter | Type | Description |
|-----------|------|-------------|
| **Model** | Dropdown / Text | Model to use. Loaded dynamically from `/models`; use *Or Enter Model ID* for custom models. |
| **Or Enter Model ID** | Text | Free-text model override (e.g. `mistralai/mistral-nemo`). Overrides the dropdown when non-empty. |
| **Messages** | Collection | Conversation messages (role + content). Supports `system`, `user`, and `assistant` roles. |
| **Simplify Output** | Boolean | When `true`, returns only the assistant's text. When `false`, returns the full API response. |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| **Temperature** | `0.7` | Controls randomness (0 = deterministic, 2 = very random). |
| **Max Tokens** | `1024` | Maximum tokens to generate. |
| **Top P** | `1` | Nucleus sampling threshold. |
| **Frequency Penalty** | `0` | Penalise repeated tokens. |
| **Presence Penalty** | `0` | Penalise tokens already present. |
| **Stop Sequences** | — | Comma-separated stop sequences. |
| **Stream** | `false` | Enable server-sent event streaming. |

---

## Supported Models

The node automatically lists all models available from the configured endpoint. Popular models include:

| Model ID | Description |
|----------|-------------|
| `meta/llama-3.1-8b-instruct` | Meta Llama 3.1 8B — fast and efficient |
| `meta/llama-3.1-70b-instruct` | Meta Llama 3.1 70B — high quality reasoning |
| `meta/llama3-8b-instruct` | Meta Llama 3 8B |
| `meta/llama3-70b-instruct` | Meta Llama 3 70B |
| `mistralai/mistral-nemo` | Mistral Nemo — compact |
| `mistralai/mixtral-8x7b-instruct-v0.1` | Mixtral MoE |
| `nvidia/llama-3.1-nemotron-70b-instruct` | NVIDIA Nemotron 70B |
| `google/gemma-7b` | Google Gemma 7B |

Browse all available models at [build.nvidia.com](https://build.nvidia.com/explore/discover).

---

## Base URL Override

By default, the nodes call `https://integrate.api.nvidia.com/v1`. To use a self-hosted NIM microservice:

1. Edit your **NVIDIA NIM API** credential.
2. Change **Base URL** to your instance address, e.g. `http://my-nim-server:8000/v1`.

---

## AI Agent Workflows

To use NVIDIA NIM as the language model in an **AI Agent** or **AI Chain** workflow:

1. Add the **NVIDIA NIM Chat Model** node to your canvas.
2. Connect it to the **Model** input of an **AI Agent**, **Basic LLM Chain**, or similar node.
3. Configure your NVIDIA NIM credentials and select a model.

The Chat Model node uses the OpenAI-compatible API of NVIDIA NIM, so any model that supports chat completions will work.

---

## Compatibility

- **Minimum n8n version:** 1.0.0
- **Node.js:** ≥ 18
- **API compatibility:** OpenAI Chat Completions API (`/v1/chat/completions`)

---

## Troubleshooting

### 401 / 403 — Authentication Failed

- Ensure your API key is correct and has not expired.
- API keys must start with `nvapi-`. Regenerate at [build.nvidia.com](https://build.nvidia.com/).

### 429 — Rate Limit Exceeded

- You have exceeded the request quota for your API key.
- Wait a few seconds and retry, or upgrade your NVIDIA API credits plan.
- Consider adding a **Wait** node before the NVIDIA NIM node in high-volume workflows.

### 404 — Model Not Found

- Double-check the model ID (e.g. `meta/llama-3.1-8b-instruct`).
- Not all models are available on every endpoint — confirm availability at [build.nvidia.com](https://build.nvidia.com/explore/discover).
- If using a self-hosted NIM instance, ensure the model is deployed.

### Model list not loading

- Verify the **Base URL** in credentials ends with `/v1` (not `/v1/`).
- Check network connectivity from your n8n instance to `integrate.api.nvidia.com`.

---

## Resources

- [NVIDIA NIM documentation](https://docs.nvidia.com/nim/)
- [NVIDIA API reference](https://docs.api.nvidia.com/nim/reference/)
- [Available models](https://build.nvidia.com/explore/discover)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [n8n community forum](https://community.n8n.io/)
