export interface ExaSearchRequest {
    query: string;
    type: 'auto' | 'neural' | 'fast' | 'instant' | 'deep' | 'deep-reasoning';
    category?: 'company' | 'research paper' | 'news' | 'tweet' | 'personal site' | 'financial report' | 'people';
    userLocation?: string;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    endPublishedDate?: string;
    startCrawlDate?: string;
    endCrawlDate?: string;
    includeText?: string[];
    excludeText?: string[];
    numResults?: number;
    moderation?: boolean;
    additionalQueries?: string[];
    systemPrompt?: string;
    outputSchema?: Record<string, unknown>;
    contents: {
        text?: {
            maxCharacters?: number;
            includeHtmlTags?: boolean;
            verbosity?: 'compact' | 'standard' | 'full';
            includeSections?: string[];
            excludeSections?: string[];
        } | boolean;
        highlights?: {
            maxCharacters?: number;
            query?: string;
        } | boolean;
        summary?: {
            query?: string;
            schema?: Record<string, unknown>;
        } | boolean;
        /** @deprecated Use maxAgeHours instead */
        livecrawl?: 'never' | 'fallback' | 'preferred' | 'always';
        livecrawlTimeout?: number;
        maxAgeHours?: number;
        subpages?: number;
        subpageTarget?: string | string[];
        extras?: {
            links?: number;
            imageLinks?: number;
        };
        /** @deprecated Use highlights or text instead */
        context?: {
            maxCharacters?: number;
        } | boolean;
    };
}
export interface ExaCrawlRequest {
    ids: string[];
    text: boolean;
    livecrawl?: 'always' | 'fallback' | 'preferred';
}
export interface ExaSearchResult {
    id: string;
    title: string;
    url: string;
    publishedDate: string;
    author: string;
    text: string;
    highlights?: string[];
    highlightScores?: number[];
    summary?: string;
    image?: string;
    favicon?: string;
    score?: number;
    subpages?: ExaSearchResult[];
    extras?: {
        links?: string[];
        imageLinks?: string[];
    };
}
export interface ExaDeepGrounding {
    field: string;
    citations: Array<{
        url: string;
        title: string;
    }>;
    confidence: 'low' | 'medium' | 'high';
}
export interface ExaSearchResponse {
    requestId: string;
    searchType?: string;
    /** @deprecated Use highlights or text from results instead */
    context?: string;
    results: ExaSearchResult[];
    output?: {
        content: string | Record<string, unknown>;
        grounding?: ExaDeepGrounding[];
    };
    costDollars?: {
        total: number;
    };
}
export interface DeepResearchRequest {
    model: 'exa-research' | 'exa-research-pro';
    instructions: string;
    output?: {
        inferSchema?: boolean;
    };
}
export interface DeepResearchStartResponse {
    id: string;
    outputSchema?: {
        type: string;
        properties: any;
        required: string[];
        additionalProperties: boolean;
    };
}
export interface DeepResearchCheckResponse {
    id: string;
    createdAt: number;
    status: 'running' | 'completed' | 'failed';
    instructions: string;
    schema?: {
        type: string;
        properties: any;
        required: string[];
        additionalProperties: boolean;
    };
    data?: {
        report?: string;
        [key: string]: any;
    };
    operations?: Array<{
        type: string;
        stepId: string;
        text?: string;
        query?: string;
        goal?: string;
        results?: any[];
        url?: string;
        thought?: string;
        data?: any;
    }>;
    citations?: {
        [key: string]: Array<{
            id: string;
            url: string;
            title: string;
            snippet: string;
        }>;
    };
    timeMs?: number;
    model?: string;
    costDollars?: {
        total: number;
        research: {
            searches: number;
            pages: number;
            reasoningTokens: number;
        };
    };
}
export interface DeepResearchErrorResponse {
    response: {
        message: string;
        error: string;
        statusCode: number;
    };
    status: number;
    options: any;
    message: string;
    name: string;
}
export interface ExaCodeRequest {
    query: string;
    tokensNum: number;
    flags?: string[];
}
export interface ExaCodeResult {
    id: string;
    title: string;
    url: string;
    text: string;
    score?: number;
}
export interface ExaCodeResponse {
    requestId: string;
    query: string;
    repository?: string;
    response: string;
    resultsCount: number;
    costDollars: string;
    searchTime: number;
    outputTokens?: number;
    traces?: any;
}
//# sourceMappingURL=types.d.ts.map