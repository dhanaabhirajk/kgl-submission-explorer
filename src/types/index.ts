export type { Submission, Cluster, SimilarityData } from '../types';

export interface MapPolygon {
  id: string;
  points: [number, number][];
  cluster: Cluster;
  level: 'continent' | 'island' | 'atoll';
  area: number;
  children?: MapPolygon[];
}