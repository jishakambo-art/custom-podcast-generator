---
name: perplexity-docs
description: "Provides Perplexity API integration for web-grounded AI responses and search. Use when user needs current web information, search-powered responses, citations, third-party models with web search tools, document analysis with web context, or mentions Perplexity, Sonar models, web search, citations, or real-time information."
---

# Perplexity API

## Quick Navigation

- Models & pricing: `references/models.md`
- Agentic Research API (third-party models): `references/agentic-research.md`
- Search API patterns: `references/search-api.md`
- Chat Completions guide: `references/chat-completions.md`
- Structured outputs: `references/structured-outputs.md`
- Filters (domain/language/date/location): `references/filters.md`
- Media (images/videos/attachments): `references/media.md`
- Pro Search: `references/pro-search.md`
- Prompting best practices: `references/prompting.md`
- SDK best practices: `references/sdk-best-practices.md`

## When to Use

Use when user needs:
- Current web information or search-powered responses
- Citations and source verification
- Third-party models (OpenAI, Anthropic, Google, xAI) with web search tools
- Document/image analysis with web context
- Presets for common use cases
- Model fallback for high availability

## Installation

```bash
# Python
pip install perplexityai

# TypeScript/JavaScript
npm install @perplexityai/perplexity
```

## Authentication

```bash
# macOS/Linux
export PERPLEXITY_API_KEY="your_api_key_here"

# Windows
setx PERPLEXITY_API_KEY "your_api_key_here"
```


## Quick Start — Chat Completions API

```python
from perplexity import Perplexity

client = Perplexity()

completion = client.chat.completions.create(
    model="sonar-pro",
    messages=[{"role": "user", "content": "What is the latest news on AI?"}]
)

print(completion.choices[0].message.content)
```

## Quick Start — Search API

```python
from perplexity import Perplexity

client = Perplexity()

search = client.search.create(
    query="artificial intelligence trends",
    max_results=5
)

for result in search.results:
    print(f"{result.title}: {result.url}")
```

## Quick Start — Agentic Research API

```python
from perplexity import Perplexity

client = Perplexity()

# Using third-party model with web search tool
response = client.responses.create(
    model="openai/gpt-5.2",
    input="What are the latest developments in AI?",
    tools=[{"type": "web_search"}],
    instructions="You have access to a web_search tool. Use it for current information.",
)

for item in response.output:
    if hasattr(item, 'content'):
        print(item.content[0].text)
        break

# Or use a preset
response = client.responses.create(
    preset="pro-search",
    input="What are the latest developments in AI?",
)

for item in response.output:
    if hasattr(item, 'content'):
        print(item.content[0].text)
        break
```

## Critical Prohibitions

**DO NOT:**
- Request links/URLs in prompts — use `citations` field (model will hallucinate URLs)
- Use recursive JSON schemas — not supported
- Use `dict[str, Any]` in Pydantic models for structured outputs
- Mix allowlist and denylist in `search_domain_filter`
- Exceed 5 queries in multi-query search
- Use Pro Search without `stream=True` — will fail
- Send images to `sonar-deep-research` — not supported
- Include `data:` prefix for file attachments base64 (only for images)
- Control search via prompts — use API parameters instead
- Assume all third-party models support all features — check model capabilities
- Exceed 5 models in Agentic Research API fallback chain
- Use reasoning parameter with non-reasoning models — ignored

## Model Selection

### Perplexity Sonar Models

**Quick factual query?** → `sonar`  
**Complex analysis?** → `sonar-pro`  
**Multi-step reasoning?** → `sonar-reasoning-pro`  
**Exhaustive research?** → `sonar-deep-research` (async only)

See `references/models.md` for pricing and details.

### Third-Party Models (Agentic Research API)

Available via `/v1/responses` endpoint with web search tools:

**Anthropic:**
- `anthropic/claude-opus-4-5`: $5/$25 per 1M tokens (input/output)
- `anthropic/claude-sonnet-4-5`: $3/$15 per 1M tokens
- `anthropic/claude-haiku-4-5`: $1/$5 per 1M tokens

**OpenAI:**
- `openai/gpt-5.2`: $1.75/$14 per 1M tokens
- `openai/gpt-5.1`: $1.25/$10 per 1M tokens
- `openai/gpt-5-mini`: $0.25/$2 per 1M tokens

**Google:**
- `google/gemini-3-pro-preview`: $2/$12 per 1M tokens (≤200k context)
- `google/gemini-2.5-pro`: $1.25/$10 per 1M tokens (≤200k context)
- `google/gemini-2.5-flash`: $0.30/$0.30 per 1M tokens

**xAI:**
- `xai/grok-4-1-fast-non-reasoning`: $0.20/$0.50 per 1M tokens

**Note:** All pricing reflects direct provider pricing with no markup. Tool calls incur additional costs ($0.005/search, $0.0005/fetch). See `references/agentic-research.md` for complete details.

## API Selection Workflow

1. Determine use case:
   **Need raw search results?** → Use Search API
   **Need Sonar models with built-in search?** → Use Chat Completions API
   **Need third-party models with tools?** → Use Agentic Research API

2. For Chat Completions API:
   **Quick factual query?** → `sonar`
   **Complex analysis?** → `sonar-pro`
   **Multi-step reasoning?** → `sonar-reasoning-pro`
   **Exhaustive research?** → `sonar-deep-research` (async only)

## Key Patterns

### Streaming

```python
stream = client.chat.completions.create(
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    model="sonar",
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### Web Search Options

```python
completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Latest renewable energy news"}],
    model="sonar",
    web_search_options={
        "search_recency_filter": "week",
        "search_domain_filter": ["energy.gov", "iea.org"]
    }
)
```

### Pro Search

**REQUIRES `stream=True`**

```python
completion = client.chat.completions.create(
    model="sonar-pro",
    messages=[{"role": "user", "content": "Research solar panel ROI"}],
    search_type="pro",
    stream=True
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
```

See `references/pro-search.md` for details.

### Media Attachments

**Image:**
```python
messages=[{
    "role": "user",
    "content": [
        {"type": "text", "text": "Describe this image"},
        {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
    ]
}]
```

**File (PDF):**
```python
messages=[{
    "role": "user",
    "content": [
        {"type": "text", "text": "Summarize this document"},
        {"type": "file_url", "file_url": {"url": "https://example.com/report.pdf"}}
    ]
}]
```

See `references/media.md` for details.

### Search API Patterns

**Domain filtering:**
```python
search = client.search.create(
    query="climate research",
    search_domain_filter=["science.org", "nature.com"]  # Allowlist
    # OR ["-reddit.com"]  # Denylist
)
```

**Multi-query:**
```python
search = client.search.create(
    query=["AI trends", "machine learning healthcare"],
    max_results=5
)
```

See `references/search-api.md` and `references/filters.md` for details.

### Structured Outputs

```python
from pydantic import BaseModel

class ContactInfo(BaseModel):
    email: str
    phone: str

completion = client.chat.completions.create(
    model="sonar-pro",
    messages=[{"role": "user", "content": "Find contact for Tesla IR"}],
    response_format={
        "type": "json_schema",
        "json_schema": {"schema": ContactInfo.model_json_schema()}
    }
)
```

See `references/structured-outputs.md` for details.

## Workflows

### Research Synthesis Workflow

Copy this checklist:
- [ ] Step 1: Use Search API to gather sources with domain/recency filters
- [ ] Step 2: Use Chat Completions API with citations enabled
- [ ] Step 3: Verify all claims have citations from search results
- [ ] Step 4: Format response with source links from `citations` field

### Document Analysis Workflow

Copy this checklist:
- [ ] Step 1: Attach document via `file_url` in Chat Completions API
- [ ] Step 2: Use web search to find related/current information
- [ ] Step 3: Combine document content with web context in response
- [ ] Step 4: Include citations for web sources

### Multi-API Integration Workflow

Copy this checklist:
- [ ] Step 1: Use Search API to identify relevant sources
- [ ] Step 2: Filter results by domain/recency as needed
- [ ] Step 3: Use Chat Completions API with filtered sources
- [ ] Step 4: Cross-reference Search API results with Chat Completions citations

## Pricing

See `references/models.md` for complete pricing details.

## Error Handling

```python
import perplexity

try:
    completion = client.chat.completions.create(...)
except perplexity.BadRequestError as e:
    print(f"Invalid parameters: {e}")
except perplexity.RateLimitError:
    print("Rate limited, retry later")
except perplexity.APIStatusError as e:
    print(f"API error: {e.status_code}")
```

See `references/sdk-best-practices.md` for production patterns.

## API Overview

### Three Main APIs

1. **Chat Completions API** (`/chat/completions`): Sonar models with built-in web search
2. **Agentic Research API** (`/v1/responses`): Third-party models (OpenAI, Anthropic, Google, xAI) with tools and presets
3. **Search API** (`/search`): Raw web search results with filtering

See `references/agentic-research.md` for complete Agentic Research API documentation.

## Links

- [API Portal](https://www.perplexity.ai/settings/api)
- [Documentation](https://docs.perplexity.ai/)
- [Python SDK (PyPI)](https://pypi.org/project/perplexityai/)
- [TypeScript SDK (npm)](https://www.npmjs.com/package/@perplexity-ai/perplexity_ai)
