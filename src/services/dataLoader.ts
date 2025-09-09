import type { Submission, Cluster, SimilarityData } from '../types';

class DataLoader {
  private static instance: DataLoader;
  private submissions: Submission[] | null = null;
  private clusters: Cluster[] | null = null;
  private similarities: SimilarityData[] | null = null;
  private loading = false;
  private loaded = false;

  private constructor() {}

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadAllData(): Promise<{
    submissions: Submission[];
    clusters: Cluster[];
    similarities: SimilarityData[];
  }> {
    if (this.loaded && this.submissions && this.clusters && this.similarities) {
      return {
        submissions: this.submissions,
        clusters: this.clusters,
        similarities: this.similarities,
      };
    }

    if (this.loading) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.loaded && this.submissions && this.clusters && this.similarities) {
            clearInterval(checkInterval);
            resolve({
              submissions: this.submissions,
              clusters: this.clusters,
              similarities: this.similarities,
            });
          }
        }, 100);
      });
    }

    this.loading = true;

    try {
      // Load all JSON files in parallel
      const baseUrl = import.meta.env.BASE_URL || '/';
      const [submissionsRes, clustersRes, similaritiesRes] = await Promise.all([
        fetch(`${baseUrl}data/augmented_original_data_no_embeddings.json`),
        fetch(`${baseUrl}data/consolidated_clusters.json`),
        fetch(`${baseUrl}data/top_50_similar_projects.json`),
      ]);

      // Check for errors
      if (!submissionsRes.ok) throw new Error('Failed to load submissions data');
      if (!clustersRes.ok) throw new Error('Failed to load clusters data');
      if (!similaritiesRes.ok) throw new Error('Failed to load similarities data');

      // Parse JSON
      const [submissions, clusters, similarities] = await Promise.all([
        submissionsRes.json() as Promise<Submission[]>,
        clustersRes.json() as Promise<Cluster[]>,
        similaritiesRes.json() as Promise<SimilarityData[]>,
      ]);

      this.submissions = submissions;
      this.clusters = clusters;
      this.similarities = similarities;
      this.loaded = true;

      console.log(`Loaded ${submissions.length} submissions, ${clusters.length} clusters, ${similarities.length} similarity records`);

      return { submissions, clusters, similarities };
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // Helper methods to get specific data
  async getSubmissions(): Promise<Submission[]> {
    const data = await this.loadAllData();
    return data.submissions;
  }

  async getClusters(): Promise<Cluster[]> {
    const data = await this.loadAllData();
    return data.clusters;
  }

  async getSimilarities(): Promise<SimilarityData[]> {
    const data = await this.loadAllData();
    return data.similarities;
  }

  // Get similarity data for a specific project
  async getSimilarityForProject(projectId: number): Promise<SimilarityData | undefined> {
    const similarities = await this.getSimilarities();
    return similarities.find(s => s.data_point_id === projectId);
  }

  // Get cluster by ID
  async getClusterById(clusterId: string): Promise<Cluster | undefined> {
    const clusters = await this.getClusters();
    return clusters.find(c => c.cluster_id === clusterId);
  }
}

export const dataLoader = DataLoader.getInstance();