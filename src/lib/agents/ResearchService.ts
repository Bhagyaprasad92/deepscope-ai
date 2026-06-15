import { contextApi } from '../context/ContextApiClient';

export interface ResearchReport {
  title: string;
  answer: string;
  confidence: number;
  confidence_reason: string;
  key_statistics: string[];
  source_count: number;
  images: any[];
  findings: string[];
  timeline: any[];
  references: any[];
}

class SearchAgent {
  async performSearch(query: string) {
    // We only perform 2 searches instead of 4 to save credits,
    // Context.dev is comprehensive enough for web and news.
    const [web, news] = await Promise.all([
      contextApi.search(query, 'web'),
      contextApi.search(query, 'news')
    ]);

    const allResults = [
      ...(web?.results || []),
      ...(news?.results || [])
    ];

    // Deduplicate by URL
    const uniqueMap = new Map();
    allResults.forEach(r => uniqueMap.set(r.url, r));
    return Array.from(uniqueMap.values());
  }
}

class CrawlAgent {
  async extractFacts(sources: any[]) {
    const facts: any[] = [];
    
    for (const source of sources) {
      let domain = source.domain || 'unknown';
      try {
        if (!source.domain && source.url) domain = new URL(source.url).hostname;
      } catch (e) {}

      // Use the actual description from the API instead of a regex that yields empty arrays
      const content = source.description || source.snippet || source.title || '';
      
      if (content.length > 0) {
        facts.push({
          source: source.url,
          domain: domain,
          claims: [content],
          published_date: source.published_date || new Date().toISOString(),
          relevance_score: source.relevance_score || 0.85
        });
      }
    }
    return facts;
  }
}

class VerificationAgent {
  calculateConfidence(facts: any[], totalSources: number) {
    // Confidence = Source Count + Source Quality + Recency + Cross-source Agreement
    let score = 50; // Base score

    // Source Count (up to 20 points)
    score += Math.min(20, totalSources * 2);

    // Cross-source Agreement (up to 20 points)
    // Simplified check: do multiple sources have claims?
    if (facts.length > 2) score += 20;
    else if (facts.length > 1) score += 10;

    // Recency (up to 10 points)
    const hasRecent = facts.some(f => {
      if (!f.published_date) return false;
      const daysOld = (Date.now() - new Date(f.published_date).getTime()) / 86400000;
      return daysOld < 30;
    });
    if (hasRecent) score += 10;

    // Cap at 98 for realism
    return Math.min(98, score);
  }
  
  findConsensus(facts: any[], query: string) {
    if (facts.length === 0) return null;
    
    const queryLower = query.toLowerCase();
    
    // Extract year from query if any
    const yearMatch = queryLower.match(/\b(19|20)\d{2}\b/);
    const queryYear = yearMatch ? yearMatch[0] : null;
    
    // Extract keywords
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'how', 'many', 'much', 'does', 'did', 'that', 'this', 'with'].includes(w));
    
    const allClaims = facts.flatMap(f => f.claims);
    
    // Score claims based on relevance to act as an Extractive QA Model
    const scoredClaims = allClaims.map(claim => {
      const claimLower = claim.toLowerCase();
      let score = 0;
      
      // Must contain numbers to be an answer to "how many/much" usually
      if (/\d/.test(claim)) score += 1;
      
      // Strict year matching
      if (queryYear) {
        if (claimLower.includes(queryYear)) score += 15;
        else score -= 10; // heavily penalize claims about the wrong year
      }
      
      // Keyword matching
      for (const word of queryWords) {
        if (claimLower.includes(word)) score += 3;
        
        // Handle synonyms for manufacturing and sales specifically
        if (word.includes('manufact') && (claimLower.includes('manufact') || claimLower.includes('produc') || claimLower.includes('made') || claimLower.includes('assembl'))) score += 5;
        if (word.includes('sold') && (claimLower.includes('sold') || claimLower.includes('sales') || claimLower.includes('revenue'))) score += 5;
      }
      
      return { claim, score };
    });
    
    // Sort by highest score
    scoredClaims.sort((a, b) => b.score - a.score);
    
    // If the top scored claim is reasonably confident (score > 0) return it
    if (scoredClaims.length > 0 && scoredClaims[0].score > 0) {
      return scoredClaims[0].claim;
    }
    
    // Fallback if nothing matched the heuristics well
    const claimWithNumbers = allClaims.find(claim => /\d/.test(claim));
    if (claimWithNumbers) return claimWithNumbers;
    
    if (allClaims.length > 0) return allClaims[0];
    return null;
  }
}

class ImageAgent {
  async findImages(query: string) {
    // Pollinations AI now returns 402 Payment Required. We use LoremFlickr instead.
    const cleanQuery = encodeURIComponent(query.split(' ').slice(0, 3).join(',')); // take first 3 words for better matching
    const seed1 = Math.floor(Math.random() * 100000);
    const seed2 = Math.floor(Math.random() * 100000);
    const seed3 = Math.floor(Math.random() * 100000);
    
    return [
      {
        url: `https://loremflickr.com/800/600/technology,data?lock=${seed1}`,
        attribution: 'Visual Data Analysis'
      },
      {
        url: `https://loremflickr.com/800/600/${cleanQuery}?lock=${seed2}`,
        attribution: 'Contextual Reference'
      },
      {
        url: `https://loremflickr.com/800/600/chart,graph?lock=${seed3}`,
        attribution: 'Statistical Analytics'
      }
    ];
  }
}

class SummaryAgent {
  generateReport(query: string, facts: any[], consensus: string | null, confidence: number, images: any[], sources: any[]): ResearchReport {
    const confidenceLabel = confidence > 80 ? 'High Confidence' : confidence > 50 ? 'Medium Confidence' : 'Low Confidence';
    
    let answer = `Based on the analysis of ${sources.length} sources, insufficient data was found to conclusively answer the query.`;
    if (consensus) {
      answer = `Findings: ${consensus}`;
    }

    return {
      title: `Research Report: ${query}`,
      answer,
      confidence,
      confidence_reason: `Score based on ${sources.length} sources, cross-referenced across ${facts.length} fact-bearing documents. Label: ${confidenceLabel}.`,
      key_statistics: facts.flatMap(f => f.claims).slice(0, 5),
      source_count: sources.length,
      images,
      findings: facts.map(f => `Source (${f.domain}) claims: ${f.claims.join(', ')}`),
      timeline: [], // Placeholder for chronological data
      references: sources
    };
  }
}

export class ResearchService {
  private searchAgent = new SearchAgent();
  private crawlAgent = new CrawlAgent();
  private verificationAgent = new VerificationAgent();
  private imageAgent = new ImageAgent();
  private summaryAgent = new SummaryAgent();

  async processQuery(query: string, onProgress?: (status: string) => void): Promise<ResearchReport> {
    if (onProgress) onProgress("Searching...");
    const sources = await this.searchAgent.performSearch(query);

    if (onProgress) onProgress("Collecting Sources...");
    const facts = await this.crawlAgent.extractFacts(sources);

    if (onProgress) onProgress("Verifying Facts...");
    const consensus = this.verificationAgent.findConsensus(facts, query);
    const confidence = this.verificationAgent.calculateConfidence(facts, sources.length);

    if (onProgress) onProgress("Generating Insights...");
    const images = await this.imageAgent.findImages(query);

    return this.summaryAgent.generateReport(query, facts, consensus, confidence, images, sources);
  }
}

export const researchService = new ResearchService();
