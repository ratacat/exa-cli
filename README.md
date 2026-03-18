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
exa-cli search "AI regulation" --category news --after 2025-01-01
exa-cli search "react hooks" --include-domains github.com stackoverflow.com
exa-cli search "latest Fed rate decision" --max-age 0
exa-cli search "transformer architecture" --text -c 10000
```

Options:
- `-n, --num-results <number>` - Number of results, max 100 (default: 8)
- `-t, --type <type>` - Search type: auto, neural, fast, instant (default: auto)
- `-c, --max-chars <number>` - Max characters for highlights per result (default: 4000)
- `--text` - Return full page text instead of highlights
- `--category <category>` - Filter: company, research paper, news, tweet, personal site, financial report, people
- `--include-domains <domains...>` - Only include results from these domains
- `--exclude-domains <domains...>` - Exclude results from these domains
- `--after <date>` - Only results published after this date (YYYY-MM-DD)
- `--before <date>` - Only results published before this date (YYYY-MM-DD)
- `--include-text <text>` - Results must contain this string (max 5 words)
- `--exclude-text <text>` - Results must not contain this string (max 5 words)
- `--max-age <hours>` - Max age of cached content in hours (0 = always livecrawl)
- `--raw` - Output raw JSON response

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
- `-n, --num-results <number>` - Number of results, max 100 (default: 5)
- `-q, --queries <queries...>` - Additional search query variations for better coverage
- `-s, --system-prompt <prompt>` - Instructions to guide search planning and synthesis
- `--schema <json>` - JSON output schema for structured results
- `--schema-file <path>` - Path to JSON file containing output schema
- `--reasoning` - Use deep-reasoning type (more thorough, higher latency)
- `--category <category>` - Filter: company, research paper, news, tweet, personal site, financial report, people
- `--include-domains <domains...>` - Only include results from these domains
- `--exclude-domains <domains...>` - Exclude results from these domains
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
