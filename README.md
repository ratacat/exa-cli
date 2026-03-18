# exa-cli

CLI for [Exa AI](https://exa.ai) search using `EXA_API_KEY` from your shell environment.

By [Mike Kelly](https://github.com/mikekelly).

## Installation

```bash
npm install -g @realmikekelly/exa-cli
```

## Prerequisites

1. **Exa API key** - Get one at [exa.ai](https://exa.ai)
2. **Set `EXA_API_KEY` in your shell environment**

## Configuration

```bash
export EXA_API_KEY=your-exa-api-key
```

## Usage

### Web Search

```bash
exa-cli search "your query"
exa-cli search "anthropic claude" -n 10 -t fast
```

Options:
- `-n, --num-results <number>` - Number of results (default: 8)
- `-t, --type <type>` - Search type: auto, fast, instant (default: auto)
- `-l, --livecrawl <mode>` - Livecrawl mode: fallback, preferred (default: fallback)
- `-c, --context-max <chars>` - Max characters for context (default: 10000)

### Code Search

```bash
exa-cli code "react hooks typescript"
exa-cli code "express middleware authentication" -t 10000
```

Options:
- `-t, --tokens <number>` - Number of tokens to return, 1000-50000 (default: 5000)

### Exa Deep

Agentic search with synthesized output, grounding citations, query expansion, and optional structured schemas.

```bash
exa-cli deep "what are the latest Claude model releases"
exa-cli deep "compare top cloud providers" --show-sources
exa-cli deep "climate change solutions" -q "renewable energy" "carbon capture"
exa-cli deep "top AI startups" --schema '{"type":"object","required":["startups"],"properties":{"startups":{"type":"array","items":{"type":"object","required":["name","focus"],"properties":{"name":{"type":"string"},"focus":{"type":"string"}}}}}}'
exa-cli deep "explain transformer architecture" --reasoning
exa-cli deep "summarize recent SpaceX launches" --raw
```

Options:
- `-n, --num-results <number>` - Number of results (default: 5)
- `-q, --queries <queries...>` - Additional search query variations for better coverage
- `-s, --system-prompt <prompt>` - Instructions to guide search planning and synthesis
- `--schema <json>` - JSON output schema for structured results
- `--schema-file <path>` - Path to JSON file containing output schema
- `--reasoning` - Use deep-reasoning type (more thorough, higher latency)
- `--show-sources` - Show grounding citations and confidence
- `--raw` - Output raw JSON response

### URL Crawling

```bash
exa-cli crawl "https://example.com/article"
exa-cli crawl "https://docs.example.com" -c 5000
```

Options:
- `-c, --max-chars <number>` - Maximum characters to extract (default: 3000)

### LinkedIn Search

```bash
exa-cli linkedin "software engineer san francisco"
exa-cli linkedin "CEO startup" -n 10
```

Options:
- `-n, --num-results <number>` - Number of results (default: 5)

### Company Research

```bash
exa-cli company "Anthropic"
exa-cli company "OpenAI" -n 10
```

Options:
- `-n, --num-results <number>` - Number of results (default: 5)

### Deep Research

Start a comprehensive AI research task:

```bash
exa-cli research start "implications of quantum computing on cryptography"
exa-cli research start "renewable energy adoption" -m exa-research-pro
```

Options:
- `-m, --model <model>` - Model: exa-research or exa-research-pro (default: exa-research)

Check research status:

```bash
exa-cli research check <taskId>
```

## License

MIT
