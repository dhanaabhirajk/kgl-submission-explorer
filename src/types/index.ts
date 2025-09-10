import type { Submission, Cluster, SimilarityData } from '../types';
export type { Submission, Cluster, SimilarityData };

export interface MapPolygon {
  id: string;
  points: [number, number][];
  cluster: import('../types').Cluster;
  level: 'continent' | 'island' | 'atoll';
  area: number;
  children?: MapPolygon[];
}