export interface Submission {
  data_point_id: number;
  project_id: number;
  project_name: string;
  author: string;
  category: string;
  umap_dim_1: number;
  umap_dim_2: number;
  description?: string;
  score?: number;
  comments?: number;
  views?: number;
  awards?: string[];
}

export interface Cluster {
  cluster_id: string;
  cluster_level: 'High' | 'Detailed';
  name: string;
  members: number[];
  centroid: [number, number];
  color: string;
  description?: string;
}

export interface SimilarityData {
  data_point_id: number;
  top_similar_projects: Array<{
    project_id: number;
    similarity_score: number;
  }>;
}

export interface MapPolygon {
  id: string;
  points: [number, number][];
  cluster: Cluster;
  level: 'continent' | 'island' | 'atoll';
  area: number;
  children?: MapPolygon[];
}