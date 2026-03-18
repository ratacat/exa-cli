#!/usr/bin/env node
import { Command } from 'commander';
import { create as createAxiosExa, isAxiosError } from './utils/axiosExa.js';
import { API_CONFIG } from './tools/config.js';
import type {
  ExaSearchRequest,
  ExaSearchResponse,
  ExaCodeRequest,
  ExaCodeResponse,
  DeepResearchRequest,
  DeepResearchStartResponse,
  DeepResearchCheckResponse,
  ExaDeepGrounding
} from './types.js';

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
  .option('-n, --num-results <number>', 'Number of results', '8')
  .option('-t, --type <type>', 'Search type: auto, fast, deep', 'auto')
  .option('-l, --livecrawl <mode>', 'Livecrawl mode: fallback, preferred', 'fallback')
  .option('-c, --context-max <chars>', 'Max characters for context', '10000')
  .action(async (query: string, options) => {
    try {
      const axios = getAxios();
      const searchRequest: ExaSearchRequest = {
        query,
        type: options.type as 'auto' | 'fast' | 'deep',
        numResults: parseInt(options.numResults),
        contents: {
          text: true,
          context: {
            maxCharacters: parseInt(options.contextMax)
          },
          livecrawl: options.livecrawl as 'fallback' | 'preferred'
        }
      };

      const response = await axios.post<ExaSearchResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`,
        searchRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data?.context) {
        console.log(response.data.context);
      } else {
        console.log('No results found.');
      }
    } catch (error) {
      handleError(error, 'Search');
    }
  });

// Code Search
program
  .command('code <query>')
  .description('Search for code context using Exa AI')
  .option('-t, --tokens <number>', 'Number of tokens to return (1000-50000)', '5000')
  .action(async (query: string, options) => {
    try {
      const axios = getAxios();
      const codeRequest: ExaCodeRequest = {
        query,
        tokensNum: parseInt(options.tokens)
      };

      const response = await axios.post<ExaCodeResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTEXT}`,
        codeRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data?.response) {
        console.log(response.data.response);
      } else {
        console.log('No code context found.');
      }
    } catch (error) {
      handleError(error, 'Code search');
    }
  });

// Deep Search
program
  .command('deep-search <objective>')
  .description('Deep web search with query expansion')
  .option('-q, --queries <queries...>', 'Additional search queries')
  .action(async (objective: string, options) => {
    try {
      const axios = getAxios();
      const searchRequest: ExaSearchRequest = {
        query: objective,
        type: 'deep',
        contents: {
          context: true
        }
      };

      if (options.queries?.length) {
        searchRequest.additionalQueries = options.queries;
      }

      const response = await axios.post<ExaSearchResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`,
        searchRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data?.context) {
        console.log(response.data.context);
      } else {
        console.log('No results found.');
      }
    } catch (error) {
      handleError(error, 'Deep search');
    }
  });

// Deep Output Search
program
  .command('deep <query>')
  .description('Deep search with synthesized output, grounding, and optional structured schemas')
  .option('-n, --num-results <number>', 'Number of results', '5')
  .option('-s, --system-prompt <prompt>', 'Instructions to guide search planning and synthesis')
  .option('--schema <json>', 'JSON output schema for structured results')
  .option('--schema-file <path>', 'Path to JSON file containing output schema')
  .option('--reasoning', 'Use deep-reasoning type (more thorough, higher latency)')
  .option('--show-sources', 'Show grounding citations and confidence')
  .option('--raw', 'Output raw JSON response')
  .action(async (query: string, options) => {
    try {
      const axios = getAxios();
      const searchRequest: ExaSearchRequest = {
        query,
        type: options.reasoning ? 'deep-reasoning' : 'deep',
        numResults: parseInt(options.numResults),
        contents: {
          text: true
        }
      };

      if (options.systemPrompt) {
        searchRequest.systemPrompt = options.systemPrompt;
      }

      // Handle output schema from --schema or --schema-file
      if (options.schema) {
        try {
          searchRequest.outputSchema = JSON.parse(options.schema);
        } catch {
          console.error('Error: --schema must be valid JSON');
          process.exit(1);
        }
      } else if (options.schemaFile) {
        try {
          const fs = await import('fs');
          const schemaContent = fs.readFileSync(options.schemaFile, 'utf-8');
          searchRequest.outputSchema = JSON.parse(schemaContent);
        } catch (err) {
          console.error(`Error reading schema file: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }
      }

      const response = await axios.post<ExaSearchResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`,
        searchRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (options.raw) {
        console.log(JSON.stringify(response.data, null, 2));
        return;
      }

      const data = response.data;

      // Print synthesized output
      if (data.output?.content) {
        if (typeof data.output.content === 'string') {
          console.log(data.output.content);
        } else {
          console.log(JSON.stringify(data.output.content, null, 2));
        }
      } else if (data.context) {
        console.log(data.context);
      } else {
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
    } catch (error) {
      handleError(error, 'Deep output search');
    }
  });

// Crawl URL
program
  .command('crawl <url>')
  .description('Extract content from a URL')
  .option('-c, --max-chars <number>', 'Maximum characters to extract', '3000')
  .action(async (url: string, options) => {
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

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/contents`,
        crawlRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data?.results) {
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.log('No content found.');
      }
    } catch (error) {
      handleError(error, 'Crawl');
    }
  });

// LinkedIn Search
program
  .command('linkedin <query>')
  .description('Search LinkedIn profiles')
  .option('-n, --num-results <number>', 'Number of results', '5')
  .action(async (query: string, options) => {
    try {
      const axios = getAxios();
      const searchRequest: ExaSearchRequest = {
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

      const response = await axios.post<ExaSearchResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`,
        searchRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data?.results) {
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.log('No LinkedIn profiles found.');
      }
    } catch (error) {
      handleError(error, 'LinkedIn search');
    }
  });

// Company Research
program
  .command('company <name>')
  .description('Research a company')
  .option('-n, --num-results <number>', 'Number of results', '5')
  .action(async (name: string, options) => {
    try {
      const axios = getAxios();
      const searchRequest: ExaSearchRequest = {
        query: `${name} company`,
        type: 'auto',
        numResults: parseInt(options.numResults),
        category: 'company',
        contents: {
          text: true
        }
      };

      const response = await axios.post<ExaSearchResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`,
        searchRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data?.results) {
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.log('No company information found.');
      }
    } catch (error) {
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
  .action(async (instructions: string, options) => {
    try {
      const axios = getAxios();
      const researchRequest: DeepResearchRequest = {
        model: options.model as 'exa-research' | 'exa-research-pro',
        instructions,
        output: {
          inferSchema: false
        }
      };

      const response = await axios.post<DeepResearchStartResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESEARCH_TASKS}`,
        researchRequest,
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data?.id) {
        console.log(JSON.stringify({
          taskId: response.data.id,
          model: options.model,
          message: `Research task started. Check status with: exa research check ${response.data.id}`
        }, null, 2));
      } else {
        console.log('Failed to start research task.');
      }
    } catch (error) {
      handleError(error, 'Research start');
    }
  });

research
  .command('check <taskId>')
  .description('Check status of a deep research task')
  .action(async (taskId: string) => {
    try {
      const axios = getAxios();

      const response = await axios.get<DeepResearchCheckResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESEARCH_TASKS}/${taskId}`,
        {
          headers: {
            'accept': 'application/json'
          },
          timeout: 25000
        }
      );

      if (response.data) {
        if (response.data.status === 'completed') {
          console.log(JSON.stringify({
            status: response.data.status,
            taskId: response.data.id,
            report: response.data.data?.report || 'No report generated',
            timeMs: response.data.timeMs,
            model: response.data.model
          }, null, 2));
        } else if (response.data.status === 'running') {
          console.log(JSON.stringify({
            status: response.data.status,
            taskId: response.data.id,
            message: 'Research in progress. Check again shortly.'
          }, null, 2));
        } else {
          console.log(JSON.stringify({
            status: response.data.status,
            taskId: response.data.id,
            message: `Research task ${response.data.status}`
          }, null, 2));
        }
      } else {
        console.log('No response from research API.');
      }
    } catch (error) {
      handleError(error, 'Research check');
    }
  });

function handleError(error: unknown, context: string): void {
  if (isAxiosError(error)) {
    const statusCode = error.response?.status || 'unknown';
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`${context} error (${statusCode}): ${errorMessage}`);
  } else if (error instanceof Error) {
    console.error(`${context} error: ${error.message}`);
  } else {
    console.error(`${context} error: ${String(error)}`);
  }
  process.exit(1);
}

program.parse();
