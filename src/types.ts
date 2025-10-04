// Data types for Governance Data Mining System (SN2)

export interface Submission {
  // Identifiers
  data_point_id: number;
  
  // Content - Grievance Details
  title: string;
  subtitle: string;
  description: string;
  hero_image_url: string;
  writeup_url: string;
  
  // Governance Metadata
  date: string;
  tags: string[];
  category_tags: string[];
  
  // Governance-specific fields
  district?: string;
  department?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  sla_days?: number;
  citizen_id?: string;
  resolution_summary?: string;
  
  // Clustering & Positioning
  umap_dim_1: number;
  umap_dim_2: number;
  umap_cluster_label: number;
  high_level_region_label: number;
  detailed_region_label: number;
  high_level_hierarchical_label: number;
  medium_level_hierarchical_label: number;
  detailed_hierarchical_label: number;
}

export interface SimilarProject {
  project_id: number;
  similarity_score: number;
}

export interface SimilarityData {
  data_point_id: number;
  top_similar_projects: SimilarProject[];
}

export interface Cluster {
  cluster_level: 'High' | 'Medium' | 'Detailed';
  cluster_id: string;
  cluster_label: number;
  name: string;
  description: string;
  centroid: [number, number];
  members: number[];
  combined_label: string;
  color: string;
}