# SDK Best Practices Reference

Production patterns for Perplexity SDKs.

## Contents

- Security Best Practices
- Error Types
- Retry Logic
- Request Batching
- Production Configuration
- Error Handling Patterns

## Security Best Practices

### Environment Variables

```python
import os
from perplexity import Perplexity

client = Perplexity(api_key=os.environ.get("PERPLEXITY_API_KEY"))
```

```typescript
import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY
});
```

**Never hardcode API keys** in source code.

## Error Types

```python
import perplexity

try:
    response = client.chat.completions.create(...)
except perplexity.AuthenticationError:
    # Invalid API key
except perplexity.RateLimitError:
    # Rate limit exceeded - implement backoff
except perplexity.APIConnectionError as e:
    # Network failure - e.__cause__ has details
except perplexity.APIStatusError as e:
    # API error - check e.status_code, e.message, e.type
except perplexity.ValidationError:
    # Invalid request parameters
```

```typescript
try {
    const response = await client.chat.completions.create(...);
} catch (error: any) {
    if (error.constructor.name === 'AuthenticationError') {
        // Invalid API key
    } else if (error.constructor.name === 'RateLimitError') {
        // Rate limit exceeded
    } else if (error.constructor.name === 'APIConnectionError') {
        // Network failure - check error.cause
    } else if (error.constructor.name === 'APIStatusError') {
        // API error - check error.status, error.message, error.type
    } else if (error.constructor.name === 'ValidationError') {
        // Invalid request parameters
    }
}
```

## Retry Logic

Use exponential backoff with jitter for `RateLimitError`:

```python
import time
import random
import perplexity

def with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except perplexity.RateLimitError:
            if attempt == max_retries - 1:
                raise
            delay = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
        except perplexity.APIConnectionError:
            if attempt == max_retries - 1:
                raise
            delay = 1 + random.uniform(0, 1)
            time.sleep(delay)
```

```typescript
async function withRetry<T>(
    func: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await func();
        } catch (error: any) {
            if (attempt === maxRetries - 1) throw error;
            
            if (error.constructor.name === 'RateLimitError') {
                const delay = (2 ** attempt + Math.random()) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (error.constructor.name === 'APIConnectionError') {
                const delay = (1 + Math.random()) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}
```

## Request Batching

Process multiple requests concurrently with rate limit protection:

```python
import asyncio
from perplexity import AsyncPerplexity

async def process_batch(queries, batch_size=5, delay=1.0):
    async with AsyncPerplexity() as client:
        results = []
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i + batch_size]
            tasks = [client.search.create(query=q) for q in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend([r for r in batch_results if not isinstance(r, Exception)])
            if i + batch_size < len(queries):
                await asyncio.sleep(delay)
        return results
```

```typescript
async function processBatch(
    queries: string[],
    batchSize: number = 5,
    delay: number = 1000
) {
    const client = new Perplexity();
    const results = [];
    for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        const tasks = batch.map(q => 
            client.search.create({ query: q }).catch(e => e)
        );
        const batchResults = await Promise.all(tasks);
        results.push(...batchResults.filter(r => !(r instanceof Error)));
        if (i + batchSize < queries.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return results;
}
```

**Guidelines:** Batch size 5-10, 1s delay between batches.

## Production Configuration

```python
import httpx
from perplexity import Perplexity, DefaultHttpxClient

timeout = httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=10.0)
limits = httpx.Limits(
    max_keepalive_connections=20,
    max_connections=100,
    keepalive_expiry=60.0
)

client = Perplexity(
    api_key=os.getenv("PERPLEXITY_API_KEY"),
    max_retries=3,
    timeout=timeout,
    http_client=DefaultHttpxClient(limits=limits)
)
```

```typescript
import Perplexity from '@perplexity-ai/perplexity_ai';
import https from 'https';

const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxSockets: 100,
    maxFreeSockets: 20,
    timeout: 30000
});

const client = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY,
    maxRetries: 3,
    timeout: 30000,
    httpAgent: httpsAgent
});
```

## Error Handling Patterns

### Comprehensive Error Handling

```python
import perplexity

try:
    response = client.chat.completions.create(...)
except perplexity.APIConnectionError as e:
    # Network failure - log e.__cause__ for debugging
except perplexity.RateLimitError as e:
    # Rate limit - implement backoff or queue request
except perplexity.APIStatusError as e:
    # API error - check e.status_code, e.type, e.message
    # Request ID available in e.response.headers.get('X-Request-ID')
except perplexity.AuthenticationError:
    # Invalid API key - check environment variable
except perplexity.ValidationError as e:
    # Invalid parameters - check request structure
```

### Graceful Degradation

```python
def get_response(query, fallback="Service temporarily unavailable"):
    try:
        response = client.chat.completions.create(...)
        return response.choices[0].message.content
    except (perplexity.RateLimitError, perplexity.APIConnectionError):
        return fallback  # Or try alternative model/cached response
```
