import Fuse from 'fuse.js';
import type { Submission } from '../types';

export class SearchService {
  private fuse: Fuse<Submission> | null = null;
  
  initialize(submissions: Submission[]) {
    const options = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'subtitle', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2
    };
    
    this.fuse = new Fuse(submissions, options);
  }
  
  search(query: string): Array<{ item: Submission; score: number }> {
    if (!this.fuse || !query.trim()) {
      return [];
    }
    
    const results = this.fuse.search(query);
    return results.map(result => ({
      item: result.item,
      score: result.score || 0
    }));
  }
  
  searchByTag(tag: string, submissions: Submission[]): Submission[] {
    return submissions.filter(submission => 
      submission.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())) ||
      submission.category_tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }
  
  searchByCluster(clusterId: number, submissions: Submission[]): Submission[] {
    return submissions.filter(submission => 
      submission.detailed_hierarchical_label === clusterId ||
      submission.medium_level_hierarchical_label === clusterId ||
      submission.high_level_hierarchical_label === clusterId
    );
  }
}

export const searchService = new SearchService();