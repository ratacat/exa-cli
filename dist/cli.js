#!/usr/bin/env node
import { Command } from 'commander';
import { create as createAxiosExa, isAxiosError } from './utils/axiosExa.js';
import { API_CONFIG } from './tools/config.js';
const program = new Command();
// Create axios instance using EXA_API_KEY from the shell environment
function getAxios() {
    return createAxiosExa();
}
program
    .name('exa-cli')
    .description('CLI for Exa AI search using EXA_API_KEY from the environment')
    .version('1.0.4');
// Web Search
program
    .command('search <query>')
    .description('Search the web using Exa AI')
    .option('-n, --num-results <number>', 'Number of results (max 100)', '8')
    .option('-t, --type <type>', 'Search type: auto, neural, fast, instant', 'auto')
    .option('-c, --max-chars <number>', 'Max characters for highlights per result', '4000')
    .option('--text', 'Return full page text instead of highlights')
    .option('--category <category>', 'Filter by category: company, research paper, news, tweet, personal site, financial report, people')
    .option('--include-domains <domains...>', 'Only include results from these domains')
    .option('--exclude-domains <domains...>', 'Exclude results from these domains')
    .option('--after <date>', 'Only results published after this date (YYYY-MM-DD)')
    .option('--before <date>', 'Only results published before this date (YYYY-MM-DD)')
    .option('--include-text <text>', 'Results must contain this string (max 5 words)')
    .option('--exclude-text <text>', 'Results must not contain this string (max 5 words)')
    .option('--max-age <hours>', 'Max age of cached content in hours (0 = always livecrawl)')
    .option('--raw', 'Output raw JSON response')
    .action(async (query, options) => {
    try {
        const axios = getAxios();
        const contents = {};
        if (options.text) {
            contents.text = { maxCharacters: parseInt(options.maxChars) };
        }
        else {
            contents.highlights = { maxCharacters: parseInt(options.maxChars) };
        }
        if (options.maxAge !== undefined) {
            contents.maxAgeHours = parseInt(options.maxAge);
        }
        const searchRequest = {
            query,
            type: options.type,
            numResults: parseInt(options.numResults),
            contents
        };
        if (options.category)
            searchRequest.category = options.category;
        if (options.includeDomains)
            searchRequest.includeDomains = options.includeDomains;
        if (options.excludeDomains)
            searchRequest.excludeDomains = options.excludeDomains;
        if (options.after)
            searchRequest.startPublishedDate = options.after;
        if (options.before)
            searchRequest.endPublishedDate = options.before;
        if (options.includeText)
            searchRequest.includeText = [options.includeText];
        if (options.excludeText)
            searchRequest.excludeText = [options.excludeText];
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`, searchRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 25000
        });
        if (options.raw) {
            console.log(JSON.stringify(response.data, null, 2));
            return;
        }
        const data = response.data;
        if (!data.results?.length) {
            console.log('No results found.');
            return;
        }
        for (const result of data.results) {
            console.log(`\n## ${result.title}`);
            console.log(result.url);
            if (result.publishedDate)
                console.log(`Published: ${result.publishedDate}`);
            if (options.text && result.text) {
                console.log(`\n${result.text}`);
            }
            else if (result.highlights?.length) {
                console.log(`\n${result.highlights.join('\n\n')}`);
            }
            else if (result.text) {
                console.log(`\n${result.text}`);
            }
        }
        if (data.costDollars) {
            console.error(`\nCost: $${data.costDollars.total.toFixed(4)}`);
        }
    }
    catch (error) {
        handleError(error, 'Search');
    }
});
// Code Search
program
    .command('code <query>')
    .description('Search for code context using Exa AI')
    .option('-t, --tokens <number>', 'Number of tokens to return (1000-50000)', '5000')
    .action(async (query, options) => {
    try {
        const axios = getAxios();
        const codeRequest = {
            query,
            tokensNum: parseInt(options.tokens)
        };
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTEXT}`, codeRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 30000
        });
        if (response.data?.response) {
            console.log(response.data.response);
        }
        else {
            console.log('No code context found.');
        }
    }
    catch (error) {
        handleError(error, 'Code search');
    }
});
// Exa Deep - agentic search with synthesized output, grounding, and structured schemas
program
    .command('deep <query>')
    .description('Exa Deep: agentic search with synthesized output, grounding, and structured schemas')
    .option('-n, --num-results <number>', 'Number of results (max 100)', '5')
    .option('-q, --queries <queries...>', 'Additional search query variations for better coverage')
    .option('-s, --system-prompt <prompt>', 'Instructions to guide search planning and synthesis')
    .option('--schema <json>', 'JSON output schema for structured results')
    .option('--schema-file <path>', 'Path to JSON file containing output schema')
    .option('--reasoning', 'Use deep-reasoning type (more thorough, higher latency)')
    .option('--category <category>', 'Filter by category: company, research paper, news, tweet, personal site, financial report, people')
    .option('--include-domains <domains...>', 'Only include results from these domains')
    .option('--exclude-domains <domains...>', 'Exclude results from these domains')
    .option('--show-sources', 'Show grounding citations and confidence')
    .option('--raw', 'Output raw JSON response')
    .action(async (query, options) => {
    try {
        const axios = getAxios();
        const searchRequest = {
            query,
            type: options.reasoning ? 'deep-reasoning' : 'deep',
            numResults: parseInt(options.numResults),
            contents: {
                text: true
            }
        };
        if (options.queries?.length) {
            searchRequest.additionalQueries = options.queries;
        }
        if (options.systemPrompt) {
            searchRequest.systemPrompt = options.systemPrompt;
        }
        if (options.category)
            searchRequest.category = options.category;
        if (options.includeDomains)
            searchRequest.includeDomains = options.includeDomains;
        if (options.excludeDomains)
            searchRequest.excludeDomains = options.excludeDomains;
        // Handle output schema from --schema or --schema-file
        if (options.schema) {
            try {
                searchRequest.outputSchema = JSON.parse(options.schema);
            }
            catch {
                console.error('Error: --schema must be valid JSON');
                process.exit(1);
            }
        }
        else if (options.schemaFile) {
            try {
                const fs = await import('fs');
                const schemaContent = fs.readFileSync(options.schemaFile, 'utf-8');
                searchRequest.outputSchema = JSON.parse(schemaContent);
            }
            catch (err) {
                console.error(`Error reading schema file: ${err instanceof Error ? err.message : String(err)}`);
                process.exit(1);
            }
        }
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`, searchRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 120000
        });
        if (options.raw) {
            console.log(JSON.stringify(response.data, null, 2));
            return;
        }
        const data = response.data;
        // Print synthesized output
        if (data.output?.content) {
            if (typeof data.output.content === 'string') {
                console.log(data.output.content);
            }
            else {
                console.log(JSON.stringify(data.output.content, null, 2));
            }
        }
        else if (data.context) {
            console.log(data.context);
        }
        else {
            console.log('No results found.');
            return;
        }
        // Print grounding if requested
        if (options.showSources && data.output?.grounding?.length) {
            console.log('\n--- Sources ---');
            for (const g of data.output.grounding) {
                const confidence = g.confidence ? ` [${g.confidence}]` : '';
                console.log(`\n${g.field}${confidence}`);
                for (const c of g.citations) {
                    console.log(`  ${c.title}`);
                    console.log(`  ${c.url}`);
                }
            }
        }
        // Print cost if available
        if (data.costDollars) {
            console.error(`\nCost: $${data.costDollars.total.toFixed(4)}`);
        }
    }
    catch (error) {
        handleError(error, 'Deep search');
    }
});
// Crawl URL
program
    .command('crawl <url>')
    .description('Extract content from a URL')
    .option('-c, --max-chars <number>', 'Maximum characters to extract', '3000')
    .action(async (url, options) => {
    try {
        const axios = getAxios();
        const crawlRequest = {
            ids: [url],
            contents: {
                text: {
                    maxCharacters: parseInt(options.maxChars)
                },
                livecrawl: 'preferred'
            }
        };
        const response = await axios.post(`${API_CONFIG.BASE_URL}/contents`, crawlRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 25000
        });
        if (response.data?.results) {
            console.log(JSON.stringify(response.data, null, 2));
        }
        else {
            console.log('No content found.');
        }
    }
    catch (error) {
        handleError(error, 'Crawl');
    }
});
// LinkedIn Search
program
    .command('linkedin <query>')
    .description('Search LinkedIn profiles')
    .option('-n, --num-results <number>', 'Number of results', '5')
    .action(async (query, options) => {
    try {
        const axios = getAxios();
        const searchRequest = {
            query: `${query} LinkedIn profile`,
            type: 'auto',
            numResults: parseInt(options.numResults),
            category: 'people',
            contents: {
                text: {
                    maxCharacters: API_CONFIG.DEFAULT_MAX_CHARACTERS
                }
            }
        };
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`, searchRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 25000
        });
        if (response.data?.results) {
            console.log(JSON.stringify(response.data, null, 2));
        }
        else {
            console.log('No LinkedIn profiles found.');
        }
    }
    catch (error) {
        handleError(error, 'LinkedIn search');
    }
});
// Company Research
program
    .command('company <name>')
    .description('Research a company')
    .option('-n, --num-results <number>', 'Number of results', '5')
    .action(async (name, options) => {
    try {
        const axios = getAxios();
        const searchRequest = {
            query: `${name} company`,
            type: 'auto',
            numResults: parseInt(options.numResults),
            category: 'company',
            contents: {
                text: true
            }
        };
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`, searchRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 25000
        });
        if (response.data?.results) {
            console.log(JSON.stringify(response.data, null, 2));
        }
        else {
            console.log('No company information found.');
        }
    }
    catch (error) {
        handleError(error, 'Company research');
    }
});
// Deep Research - Start
const research = program
    .command('research')
    .description('Deep research commands');
research
    .command('start <instructions>')
    .description('Start a deep research task')
    .option('-m, --model <model>', 'Model: exa-research or exa-research-pro', 'exa-research')
    .action(async (instructions, options) => {
    try {
        const axios = getAxios();
        const researchRequest = {
            model: options.model,
            instructions,
            output: {
                inferSchema: false
            }
        };
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESEARCH_TASKS}`, researchRequest, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            timeout: 25000
        });
        if (response.data?.id) {
            console.log(JSON.stringify({
                taskId: response.data.id,
                model: options.model,
                message: `Research task started. Check status with: exa research check ${response.data.id}`
            }, null, 2));
        }
        else {
            console.log('Failed to start research task.');
        }
    }
    catch (error) {
        handleError(error, 'Research start');
    }
});
research
    .command('check <taskId>')
    .description('Check status of a deep research task')
    .action(async (taskId) => {
    try {
        const axios = getAxios();
        const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESEARCH_TASKS}/${taskId}`, {
            headers: {
                'accept': 'application/json'
            },
            timeout: 25000
        });
        if (response.data) {
            if (response.data.status === 'completed') {
                console.log(JSON.stringify({
                    status: response.data.status,
                    taskId: response.data.id,
                    report: response.data.data?.report || 'No report generated',
                    timeMs: response.data.timeMs,
                    model: response.data.model
                }, null, 2));
            }
            else if (response.data.status === 'running') {
                console.log(JSON.stringify({
                    status: response.data.status,
                    taskId: response.data.id,
                    message: 'Research in progress. Check again shortly.'
                }, null, 2));
            }
            else {
                console.log(JSON.stringify({
                    status: response.data.status,
                    taskId: response.data.id,
                    message: `Research task ${response.data.status}`
                }, null, 2));
            }
        }
        else {
            console.log('No response from research API.');
        }
    }
    catch (error) {
        handleError(error, 'Research check');
    }
});
function handleError(error, context) {
    if (isAxiosError(error)) {
        const statusCode = error.response?.status || 'unknown';
        const errorMessage = error.response?.data?.message || error.message;
        console.error(`${context} error (${statusCode}): ${errorMessage}`);
    }
    else if (error instanceof Error) {
        console.error(`${context} error: ${error.message}`);
    }
    else {
        console.error(`${context} error: ${String(error)}`);
    }
    process.exit(1);
}
program.parse();
