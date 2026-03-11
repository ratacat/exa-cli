import axios, { isAxiosError } from 'axios';
function getExaApiKey(providedApiKey) {
    const apiKey = providedApiKey || process.env.EXA_API_KEY;
    if (!apiKey) {
        throw new Error('EXA_API_KEY not found. Please export EXA_API_KEY in your shell environment.');
    }
    return apiKey;
}
export function create(options) {
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
