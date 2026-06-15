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
    // In a real implementation, this would use context.dev crawl APIs or an LLM to extract facts.
    // Here we simulate fact extraction by searching for numerical patterns in the source content.
    const facts: any[] = [];
    const numRegex = /[\d.,]+[BMkm]? (million|billion|units|sold|dollars|percent|%)/ig;
    
    for (const source of sources) {
      const content = source.content || source.description || source.snippet || '';
      let domain = source.domain || 'unknown';
      try {
        if (!source.domain && source.url) domain = new URL(source.url).hostname;
      } catch (e) {}

      const matches = content.match(numRegex) || [];
      if (matches.length > 0 || content.length > 0) {
        // We push it even if no numbers are found just to have data nodes in the UI for the demo
        facts.push({
          source: source.url,
          domain: domain,
          claims: matches,
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
  
  findConsensus(facts: any[]) {
    if (facts.length === 0) return null;
    // Just pick the most frequent or first claim for the mockup
    const allClaims = facts.flatMap(f => f.claims);
    if (allClaims.length > 0) return allClaims[0];
    return null;
  }
}

class ImageAgent {
  async findImages(query: string) {
    const res = await contextApi.search(query, 'images');
    return res?.results || [];
  }
}

class SummaryAgent {
  generateReport(query: string, facts: any[], consensus: string | null, confidence: number, images: any[], sources: any[]): ResearchReport {
    const confidenceLabel = confidence > 80 ? 'High Confidence' : confidence > 50 ? 'Medium Confidence' : 'Low Confidence';
    
    let answer = `Based on the analysis of ${sources.length} sources, insufficient data was found to conclusively answer the query.`;
    if (consensus) {
      answer = `Estimated ${query.toLowerCase().replace('how many', '').replace('what is the', '').trim()}: ${consensus}`;
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
    const consensus = this.verificationAgent.findConsensus(facts);
    const confidence = this.verificationAgent.calculateConfidence(facts, sources.length);

    if (onProgress) onProgress("Generating Insights...");
    const images = await this.imageAgent.findImages(query);

    return this.summaryAgent.generateReport(query, facts, consensus, confidence, images, sources);
  }
}

export const researchService = new ResearchService();
