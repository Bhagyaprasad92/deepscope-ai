import crypto from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
}

export class ContextApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.context.dev/v1';
  private cache: Map<string, CacheEntry> = new Map();
  private cacheDurationMs = 15 * 60 * 1000; // 15 minutes
  
  // Concurrency control / request queue
  private activeRequests = 0;
  private maxConcurrentRequests = 5;
  private requestQueue: Array<() => void> = [];

  constructor() {
    this.apiKey = process.env.CONTEXT_API_KEY || '';
  }

  private async enqueueRequest(): Promise<void> {
    if (this.activeRequests < this.maxConcurrentRequests) {
      this.activeRequests++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.requestQueue.push(resolve);
    });
  }

  private dequeueRequest(): void {
    this.activeRequests--;
    if (this.requestQueue.length > 0) {
      const nextResolve = this.requestQueue.shift();
      this.activeRequests++;
      if (nextResolve) nextResolve();
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<any> {
    await this.enqueueRequest();
    try {
      for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.ok) {
          return await response.json();
        }
        if (response.status === 429 || response.status >= 500) {
          if (i === retries - 1) throw new Error(`API error: ${response.status} - ${await response.text()}`);
          await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
        } else {
          throw new Error(`API error: ${response.status} - ${await response.text()}`);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      this.dequeueRequest();
    }
  }

  private getCacheKey(endpoint: string, body?: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(endpoint);
    if (body) hash.update(JSON.stringify(body));
    return hash.digest('hex');
  }

  public async search(query: string, type: 'web' | 'news' | 'financial' | 'stats' | 'images' = 'web'): Promise<any> {
    const endpoint = `/web/search`;
    
    // Adjust query based on type for better targeting
    let adjustedQuery = query;
    if (type === 'news') adjustedQuery += ' news';
    if (type === 'financial') adjustedQuery += ' financial market data';
    if (type === 'stats') adjustedQuery += ' statistics numbers';

    const body = { query: adjustedQuery };
    const cacheKey = this.getCacheKey(endpoint, body);

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDurationMs) {
      return cached.data;
    }

    const data = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}

export const contextApi = new ContextApiClient();
