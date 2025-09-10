import { Delaunay } from 'd3-delaunay';
import { createNoise2D } from 'simplex-noise';
// concaveman lacks types in DefinitelyTyped
import concavemanDefault from 'concaveman';
const concaveman = concavemanDefault as unknown as (points: [number, number][], concavity?: number, lengthThreshold?: number) => [number, number][];
import type { Submission, Cluster } from '../types';
import type { MapPolygon } from '../types/index';

export class MapGenerator {
  private noise2D = createNoise2D();
  private noiseScale = 0.05;
  private noiseAmplitude = 0.15;
  
  generateMapPolygons(
    submissions: Submission[],
    clusters: Cluster[],
    width: number,
    height: number
  ): MapPolygon[] {
    const highLevelClusters = clusters.filter(c => c.cluster_level === 'High');
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    
    const continents = this.generateContinents(submissions, highLevelClusters);
    const islands = this.generateIslands(submissions, detailedClusters, continents);
    const atolls = this.generateAtolls(submissions, detailedClusters);
    
    return [...continents, ...islands, ...atolls];
  }
  
  private generateContinents(submissions: Submission[], clusters: Cluster[]): MapPolygon[] {
    return clusters.map(cluster => {
      const clusterPoints = submissions
        .filter(s => cluster.members.includes(s.data_point_id))
        .map(s => [s.umap_dim_1, s.umap_dim_2] as [number, number]);
      
      if (clusterPoints.length < 3) return null;
      
      const hull = this.generateConcaveHull(clusterPoints, 2.0, 0.3);
      const organicHull = this.addOrganicNoise(hull, 1.5);
      
      return {
        id: `continent-${cluster.cluster_id}`,
        points: organicHull,
        cluster,
        level: 'continent',
        area: this.calculateArea(organicHull),
        children: []
      };
    }).filter(Boolean) as MapPolygon[];
  }
  
  private generateIslands(
    submissions: Submission[], 
    clusters: Cluster[],
    continents: MapPolygon[]
  ): MapPolygon[] {
    const islands: MapPolygon[] = [];
    
    clusters.forEach(cluster => {
      const clusterPoints = submissions
        .filter(s => cluster.members.includes(s.data_point_id))
        .map(s => [s.umap_dim_1, s.umap_dim_2] as [number, number]);
      
      if (clusterPoints.length < 3) return;
      
      const subclusters = this.splitIntoSubclusters(clusterPoints, 3, 8);
      
      subclusters.forEach((subPoints, idx) => {
        if (subPoints.length < 3) return;
        
        const hull = this.generateConcaveHull(subPoints, 1.5, 0.2);
        const organicHull = this.addOrganicNoise(hull, 0.8);
        
        const parentContinent = this.findParentContinent(
          organicHull[0],
          continents
        );
        
        const island: MapPolygon = {
          id: `island-${cluster.cluster_id}-${idx}`,
          points: organicHull,
          cluster,
          level: 'island',
          area: this.calculateArea(organicHull)
        };
        
        if (parentContinent) {
          parentContinent.children = parentContinent.children || [];
          parentContinent.children.push(island);
        }
        
        islands.push(island);
      });
    });
    
    return islands;
  }
  
  private generateAtolls(submissions: Submission[], clusters: Cluster[]): MapPolygon[] {
    const atolls: MapPolygon[] = [];
    
    clusters.forEach(cluster => {
      const clusterPoints = submissions
        .filter(s => cluster.members.includes(s.data_point_id))
        .map(s => [s.umap_dim_1, s.umap_dim_2] as [number, number]);
      
      const outliers = this.findOutliers(clusterPoints, 2.5);
      
      outliers.forEach((group, idx) => {
        if (group.length < 3) {
          const atollRing = this.generateAtollRing(group[0], 0.3 + Math.random() * 0.2);
          atolls.push({
            id: `atoll-${cluster.cluster_id}-${idx}`,
            points: atollRing,
            cluster,
            level: 'atoll',
            area: this.calculateArea(atollRing)
          });
        } else {
          const hull = this.generateConcaveHull(group, 1.0, 0.15);
          const organicHull = this.addOrganicNoise(hull, 0.4);
          
          atolls.push({
            id: `atoll-${cluster.cluster_id}-${idx}`,
            points: organicHull,
            cluster,
            level: 'atoll',
            area: this.calculateArea(organicHull)
          });
        }
      });
    });
    
    return atolls;
  }
  
  private generateConcaveHull(
    points: [number, number][],
    concavity: number = 2,
    lengthThreshold: number = 0.3
  ): [number, number][] {
    if (points.length < 3) return points;
    
    try {
      const hull = concaveman(points, concavity, lengthThreshold);
      return hull as [number, number][];
    } catch {
      const convexHull = this.convexHull(points);
      return convexHull;
    }
  }
  
  private convexHull(points: [number, number][]): [number, number][] {
    const delaunay = Delaunay.from(points);
    const hullIndices = Array.from(delaunay.hull);
    return hullIndices.map(i => points[Math.floor(i / 2)]);
  }
  
  private addOrganicNoise(
    polygon: [number, number][],
    intensity: number = 1.0
  ): [number, number][] {
    const noisyPolygon: [number, number][] = [];
    const numPoints = polygon.length;
    
    for (let i = 0; i < numPoints; i++) {
      const point = polygon[i];
      const nextPoint = polygon[(i + 1) % numPoints];
      
      const edgeLength = Math.sqrt(
        Math.pow(nextPoint[0] - point[0], 2) + 
        Math.pow(nextPoint[1] - point[1], 2)
      );
      
      const subdivisions = Math.max(2, Math.floor(edgeLength * 10));
      
      for (let j = 0; j < subdivisions; j++) {
        const t = j / subdivisions;
        const x = point[0] + (nextPoint[0] - point[0]) * t;
        const y = point[1] + (nextPoint[1] - point[1]) * t;
        
        const noiseValue = this.noise2D(x * this.noiseScale, y * this.noiseScale);
        const displacement = noiseValue * this.noiseAmplitude * intensity;
        
        const normal = this.getEdgeNormal(point, nextPoint);
        
        noisyPolygon.push([
          x + normal[0] * displacement,
          y + normal[1] * displacement
        ]);
      }
    }
    
    return this.smoothPolygon(noisyPolygon, 0.3);
  }
  
  private getEdgeNormal(p1: [number, number], p2: [number, number]): [number, number] {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    return [-dy / length, dx / length];
  }
  
  private smoothPolygon(polygon: [number, number][], factor: number): [number, number][] {
    const smoothed: [number, number][] = [];
    const n = polygon.length;
    
    for (let i = 0; i < n; i++) {
      const prev = polygon[(i - 1 + n) % n];
      const curr = polygon[i];
      const next = polygon[(i + 1) % n];
      
      smoothed.push([
        curr[0] * (1 - 2 * factor) + (prev[0] + next[0]) * factor,
        curr[1] * (1 - 2 * factor) + (prev[1] + next[1]) * factor
      ]);
    }
    
    return smoothed;
  }
  
  private splitIntoSubclusters(
    points: [number, number][],
    minClusters: number,
    maxClusters: number
  ): [number, number][][] {
    const k = Math.min(
      maxClusters,
      Math.max(minClusters, Math.floor(Math.sqrt(points.length / 2)))
    );
    
    const clusters = this.kMeansClustering(points, k);
    return clusters;
  }
  
  private kMeansClustering(
    points: [number, number][],
    k: number
  ): [number, number][][] {
    if (points.length <= k) {
      return points.map(p => [p]);
    }
    
    let centroids = points.slice(0, k);
    const maxIterations = 50;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const clusters: [number, number][][] = Array(k).fill(null).map(() => []);
      
      points.forEach(point => {
        let minDist = Infinity;
        let closestCentroid = 0;
        
        centroids.forEach((centroid, idx) => {
          const dist = Math.sqrt(
            Math.pow(point[0] - centroid[0], 2) +
            Math.pow(point[1] - centroid[1], 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = idx;
          }
        });
        
        clusters[closestCentroid].push(point);
      });
      
      const newCentroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0];
        const sum = cluster.reduce(
          (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
          [0, 0]
        );
        return [sum[0] / cluster.length, sum[1] / cluster.length] as [number, number];
      });
      
      const converged = centroids.every((c, i) =>
        Math.abs(c[0] - newCentroids[i][0]) < 0.001 &&
        Math.abs(c[1] - newCentroids[i][1]) < 0.001
      );
      
      if (converged) break;
      centroids = newCentroids;
    }
    
    const clusters: [number, number][][] = Array(k).fill(null).map(() => []);
    points.forEach(point => {
      let minDist = Infinity;
      let closestCentroid = 0;
      
      centroids.forEach((centroid, idx) => {
        const dist = Math.sqrt(
          Math.pow(point[0] - centroid[0], 2) +
          Math.pow(point[1] - centroid[1], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = idx;
        }
      });
      
      clusters[closestCentroid].push(point);
    });
    
    return clusters.filter(c => c.length > 0);
  }
  
  private findOutliers(
    points: [number, number][],
    threshold: number
  ): [number, number][][] {
    if (points.length === 0) return [];
    
    const centroid = points.reduce(
      (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
      [0, 0]
    );
    centroid[0] /= points.length;
    centroid[1] /= points.length;
    
    const distances = points.map(p => ({
      point: p,
      dist: Math.sqrt(
        Math.pow(p[0] - centroid[0], 2) +
        Math.pow(p[1] - centroid[1], 2)
      )
    }));
    
    const meanDist = distances.reduce((sum, d) => sum + d.dist, 0) / distances.length;
    const stdDev = Math.sqrt(
      distances.reduce((sum, d) => sum + Math.pow(d.dist - meanDist, 2), 0) / distances.length
    );
    
    const outliers = distances
      .filter(d => d.dist > meanDist + threshold * stdDev)
      .map(d => d.point);
    
    return this.groupNearbyPoints(outliers, stdDev * 0.5);
  }
  
  private groupNearbyPoints(
    points: [number, number][],
    maxDistance: number
  ): [number, number][][] {
    const groups: [number, number][][] = [];
    const visited = new Set<number>();
    
    points.forEach((point, idx) => {
      if (visited.has(idx)) return;
      
      const group: [number, number][] = [point];
      visited.add(idx);
      
      points.forEach((otherPoint, otherIdx) => {
        if (visited.has(otherIdx)) return;
        
        const dist = Math.sqrt(
          Math.pow(point[0] - otherPoint[0], 2) +
          Math.pow(point[1] - otherPoint[1], 2)
        );
        
        if (dist <= maxDistance) {
          group.push(otherPoint);
          visited.add(otherIdx);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  }
  
  private generateAtollRing(
    center: [number, number],
    radius: number
  ): [number, number][] {
    const points: [number, number][] = [];
    const segments = 16 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const noiseValue = this.noise2D(
        Math.cos(angle) * 2,
        Math.sin(angle) * 2
      );
      const r = radius * (1 + noiseValue * 0.3);
      
      points.push([
        center[0] + Math.cos(angle) * r,
        center[1] + Math.sin(angle) * r
      ]);
    }
    
    return this.smoothPolygon(points, 0.2);
  }
  
  private findParentContinent(
    point: [number, number],
    continents: MapPolygon[]
  ): MapPolygon | null {
    for (const continent of continents) {
      if (this.isPointInPolygon(point, continent.points)) {
        return continent;
      }
    }
    return null;
  }
  
  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    let inside = false;
    const x = point[0], y = point[1];
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  private calculateArea(polygon: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i][0] * polygon[j][1];
      area -= polygon[j][0] * polygon[i][1];
    }
    return Math.abs(area / 2);
  }
}

export const mapGenerator = new MapGenerator();