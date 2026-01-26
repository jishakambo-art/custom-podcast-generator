# Agentic Research API Reference

Multi-provider API for accessing third-party models (OpenAI, Anthropic, Google, xAI) with integrated web search tools, presets, reasoning control, and model fallback.

## Contents

- Overview
- Basic Usage
- Input Formats
- Tools
- Model Fallback
- Reasoning Control
- Generation Parameters
- Streaming Responses
- Available Models
- Response Structure
- Error Handling
- Best Practices
- Critical Notes

## Overview

The Agentic Research API (`/v1/responses`) provides a unified interface for multiple LLM providers with:
- **Transparent pricing**: Direct provider pricing with no markup
- **Web search tools**: Built-in `web_search` and `fetch_url` tools
- **Presets**: Pre-configured model setups for common use cases
- **Model fallback**: Automatic failover across multiple models
- **Reasoning control**: Control reasoning effort for reasoning-capable models

## Basic Usage

### Using a Third-Party Model

```python
from perplexity import Perplexity

client = Perplexity()

response = client.responses.create(
    model="openai/gpt-5.2",
    input="What are the latest developments in AI?",
    instructions="You have access to a web_search tool. Use it for questions about current events.",
)

for item in response.output:
    if hasattr(item, 'content'):
        print(item.content[0].text)
        break
```

### Using a Preset

```python
# Using a preset (e.g., pro-search)
response = client.responses.create(
    preset="pro-search",
    input="What are the latest developments in AI?",
)

for item in response.output:
    if hasattr(item, 'content'):
        print(item.content[0].text)
        break
```

### With Web Search Tool

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="What's the weather in San Francisco?",
    tools=[
        {
            "type": "web_search"
        }
    ],
    instructions="You have access to a web_search tool. Use it when you need current information.",
)

if response.status == "completed":
    for item in response.output:
        if hasattr(item, 'content'):
            print(item.content[0].text)
            break
```

## Input Formats

### String Input

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="What are the latest AI developments?",
)
```

### Message Array Input

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What are the latest AI developments?"},
    ],
    instructions="Provide detailed, well-researched answers.",
)
```

## Tools

### web_search Tool

Performs web searches with Search API filtering capabilities.

**Pricing**: $5.00 per 1,000 search calls ($0.005 per search) + token costs

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="What are recent academic findings on renewable energy?",
    tools=[
        {
            "type": "web_search",
            "filters": {
                "search_domain_filter": ["nature.com", "science.org", ".edu"],
                "search_language_filter": ["en"],
                "search_recency_filter": "month"
            }
        }
    ],
    instructions="Search for recent English-language academic publications.",
)
```

**Available filters:**
- `search_domain_filter`: Array of domains (max 20) - allowlist or denylist with `-` prefix
- `search_language_filter`: Array of ISO 639-1 language codes (max 10)
- `search_recency_filter`: `"day"`, `"week"`, `"month"`, `"year"`
- `search_after_date`: `"M/D/YYYY"` format
- `search_before_date`: `"M/D/YYYY"` format
- `last_updated_after_filter`: `"M/D/YYYY"` format
- `last_updated_before_filter`: `"M/D/YYYY"` format
- `max_tokens_per_page`: Control content extraction depth

**User location:**

```python
tools=[
    {
        "type": "web_search",
        "user_location": {
            "latitude": 37.7749,
            "longitude": -122.4194,
            "country": "US",
            "city": "San Francisco",
            "region": "CA"
        }
    }
]
```

### fetch_url Tool

Fetches and extracts content from specific URLs.

**Pricing**: $0.50 per 1,000 requests ($0.0005 per fetch) + token costs

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="Summarize the content at https://example.com/article",
    tools=[
        {
            "type": "fetch_url"
        }
    ],
    instructions="Use fetch_url to retrieve and summarize the article.",
)
```

### Combining Both Tools

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="Find recent articles about quantum computing and summarize the top result",
    tools=[
        {
            "type": "web_search",
            "filters": {
                "search_recency_filter": "week"
            }
        },
        {
            "type": "fetch_url"
        }
    ],
    instructions="First use web_search to find recent articles, then use fetch_url to retrieve the full content.",
)
```

## Model Fallback

Specify multiple models for automatic failover:

```python
response = client.responses.create(
    models=["openai/gpt-5.2", "openai/gpt-5.1", "openai/gpt-5-mini"],
    input="What are the latest developments in AI?",
)
```

**Cross-provider fallback:**

```python
response = client.responses.create(
    models=[
        "openai/gpt-5.2",
        "anthropic/claude-sonnet-4-5",
        "google/gemini-2.5-pro"
    ],
    input="Explain quantum computing in detail",
)
```

**Note**: Billing is based on the model that serves the request, not all models in the chain. Maximum 5 models in fallback chain.

## Reasoning Control

Control reasoning effort for reasoning-capable models:

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="Solve this complex problem step by step",
    reasoning={
        "effort": "high"  # Options: "low", "medium", "high"
    },
)
```

**Note**: Only supported by models with reasoning capabilities. Other models ignore this parameter.

## Generation Parameters

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="Explain quantum computing",
    max_output_tokens=1000,  # Maximum tokens to generate
)
```

## Streaming Responses

```python
response = client.responses.create(
    model="openai/gpt-5.2",
    input="Explain quantum computing in detail",
    stream=True,
)

# Process streaming response
for chunk in response:
    for item in chunk.output:
        if hasattr(item, 'content'):
            print(item.content[0].text, end='', flush=True)
```

## Available Models

### Anthropic Models
- `anthropic/claude-opus-4-5`: $5/$25 per 1M tokens (input/output)
- `anthropic/claude-sonnet-4-5`: $3/$15 per 1M tokens
- `anthropic/claude-haiku-4-5`: $1/$5 per 1M tokens

### OpenAI Models
- `openai/gpt-5.2`: $1.75/$14 per 1M tokens
- `openai/gpt-5.1`: $1.25/$10 per 1M tokens
- `openai/gpt-5-mini`: $0.25/$2 per 1M tokens

### Google Models
- `google/gemini-3-pro-preview`: $2/$12 per 1M tokens (≤200k context)
- `google/gemini-2.5-pro`: $1.25/$10 per 1M tokens (≤200k context)
- `google/gemini-2.5-flash`: $0.30/$0.30 per 1M tokens

### xAI Models
- `xai/grok-4-1-fast-non-reasoning`: $0.20/$0.50 per 1M tokens

**Note**: All pricing reflects direct provider pricing with no markup. Cache read pricing available for some models.

## Response Structure

```json
{
    "id": "resp_1234567890",
    "object": "response",
    "created_at": 1234567890,
    "model": "openai/gpt-5.2",
    "status": "completed",
    "output": [
        {
            "type": "message",
            "id": "msg_1234567890",
            "status": "completed",
            "role": "assistant",
            "content": [
                {
                    "text": "The weather in San Francisco...",
                    "annotations": [
                        {
                            "type": "citation",
                            "start_index": 0,
                            "end_index": 50,
                            "url": "https://example.com/weather",
                            "title": "Weather Report"
                        }
                    ]
                }
            ]
        }
    ],
    "usage": {
        "input_tokens": 100,
        "output_tokens": 200,
        "total_tokens": 300
    }
}
```

## Error Handling

```python
from perplexity import Perplexity, APIError

try:
    response = client.responses.create(
        model="openai/gpt-5.2",
        input="What is AI?",
    )

    if response.status == "completed":
        for item in response.output:
            if hasattr(item, 'content'):
                print(item.content[0].text)
                break
    elif response.status == "failed":
        if response.error:
            print(f"Error: {response.error.message}")

except APIError as e:
    print(f"API Error: {e.message}")
    print(f"Status Code: {e.status_code}")
```

## Best Practices

1. **Tool instructions**: Provide clear instructions on when to use tools
2. **Filter usage**: Use filters to reduce unnecessary searches and token costs
3. **Model selection**: Choose models based on capabilities needed (reasoning, tools support)
4. **Fallback chains**: Order models by preference and pricing
5. **Cost management**: Monitor tool call costs ($0.005/search, $0.0005/fetch) + token costs
6. **Streaming**: Use streaming for better UX with long responses

## Critical Notes

- Tools must be explicitly configured - models don't have tools by default
- Not all models support all features (check model documentation)
- Tool calls incur separate charges beyond token costs
- Model fallback tries models in order until one succeeds
- Presets provide optimized defaults but can be customized
- Reasoning parameter only works with reasoning-capable models
