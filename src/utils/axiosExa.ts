import axios, { AxiosInstance, isAxiosError } from 'axios';

function getExaApiKey(providedApiKey?: string): string {
  const apiKey = providedApiKey || process.env.EXA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'EXA_API_KEY not found. Please export EXA_API_KEY in your shell environment.'
    );
  }

  return apiKey;
}

export interface CreateAxiosExaOptions {
  exaApiKey?: string;
}

export function create(options?: CreateAxiosExaOptions): AxiosInstance {
  const exaApiKey = getExaApiKey(options?.exaApiKey);

  return axios.create({
    headers: {
      'x-api-key': exaApiKey,
      'accept': 'application/json',
      'content-type': 'application/json'
    }
  });
}

export { isAxiosError };
export default { create, isAxiosError };
