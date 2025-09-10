import * as d3 from 'd3';
import type { Submission } from '../types';

export interface DensityGrid {
  width: number;
  height: number;
  cellSize: number;
  values: number[][];
  maxDensity: number;
  contours: d3.ContourMultiPolygon[];
}

export interface Biome {
  name: string;
  minDensity: number;
  maxDensity: number;
  color: string;
  elevation: number;
}

export interface TerrainSettings {
  oceanThreshold: number;
  shallowWaterThreshold?: number;
  beachThreshold?: number;
  desertThreshold: number;
  forestThreshold: number;
  mountainThreshold: number;
  contourOpacity?: number;
  pointSize?: number;
  labelOpacity?: number;
  terrainStyle?: 'island' | 'greyscale';
  showSettlements?: boolean;
  settlementOpacity?: number;
  settlementStyle?: 'points' | 'surface';
  houseThreshold?: number;
  villageThreshold?: number;
  cityThreshold?: number;
}

export class TerrainGenerator {
  private static readonly GRID_RESOLUTION = 200; // Increased resolution
  private static readonly KERNEL_BANDWIDTH = 0.035; // Slightly larger for better coverage
  private static readonly SETTLEMENT_BANDWIDTH = 0.01; // Very fine detail for settlements
  private static readonly PADDING = 10; // Extra pixels for border coverage
  
  private static readonly NATURAL_BIOMES: Biome[] = [
    { name: 'ocean', minDensity: 0, maxDensity: 0.001, color: '#0A0F1B', elevation: 0 }, // Match canvas-bg
    { name: 'shallow_water', minDensity: 0.001, maxDensity: 0.01, color: '#2e5a8f', elevation: 0.05 },
    { name: 'beach', minDensity: 0.01, maxDensity: 0.05, color: '#f4e4c1', elevation: 0.1 },
    { name: 'desert', minDensity: 0.05, maxDensity: 0.15, color: '#e8d4a0', elevation: 0.2 },
    { name: 'savanna', minDensity: 0.15, maxDensity: 0.25, color: '#c5b783', elevation: 0.3 },
    { name: 'grassland', minDensity: 0.25, maxDensity: 0.35, color: '#8fb171', elevation: 0.4 },
    { name: 'forest', minDensity: 0.35, maxDensity: 0.5, color: '#5a8a4c', elevation: 0.5 },
    { name: 'hills', minDensity: 0.5, maxDensity: 0.7, color: '#7a9b76', elevation: 0.7 },
    { name: 'mountains', minDensity: 0.7, maxDensity: 0.85, color: '#8b9391', elevation: 0.9 },
    { name: 'peaks', minDensity: 0.85, maxDensity: 1.0, color: '#e8e8e8', elevation: 1.0 },
  ];
  
  private static readonly URBAN_BIOMES: Biome[] = [
    { name: 'ocean', minDensity: 0, maxDensity: 0.001, color: '#0A0F1B', elevation: 0 }, // Match canvas-bg
    { name: 'shallow_water', minDensity: 0.001, maxDensity: 0.01, color: '#2a3f52', elevation: 0.05 },
    { name: 'land', minDensity: 0.01, maxDensity: 0.1, color: '#3d4a57', elevation: 0.1 },
    { name: 'village', minDensity: 0.1, maxDensity: 0.25, color: '#4a5663', elevation: 0.2 },
    { name: 'town', minDensity: 0.25, maxDensity: 0.4, color: '#5a6673', elevation: 0.3 },
    { name: 'outskirts', minDensity: 0.4, maxDensity: 0.55, color: '#6a7683', elevation: 0.4 },
    { name: 'city', minDensity: 0.55, maxDensity: 0.7, color: '#7a8693', elevation: 0.6 },
    { name: 'downtown', minDensity: 0.7, maxDensity: 0.85, color: '#8a96a3', elevation: 0.8 },
    { name: 'metropolis', minDensity: 0.85, maxDensity: 1.0, color: '#9aa6b3', elevation: 1.0 },
  ];

  /**
   * Calculate 2D kernel density estimation
   */
  calculateDensityGrid(
    submissions: Submission[],
    width: number,
    height: number,
    padding: number = 50
  ): DensityGrid {
    // Validate inputs
    if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
      return {
        width: 0,
        height: 0,
        cellSize: 1,
        values: [],
        maxDensity: 0,
        contours: []
      };
    }
    
    const cellSize = Math.max(width, height) / TerrainGenerator.GRID_RESOLUTION;
    const gridWidth = Math.max(1, Math.ceil(width / cellSize));
    const gridHeight = Math.max(1, Math.ceil(height / cellSize));
    
    // Initialize grid
    const densityValues: number[][] = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(0));
    
    // Get data bounds
    const xExtent = d3.extent(submissions, d => d.umap_dim_1) as [number, number];
    const yExtent = d3.extent(submissions, d => d.umap_dim_2) as [number, number];
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);
    
    // Calculate kernel density for each grid cell
    const bandwidth = TerrainGenerator.KERNEL_BANDWIDTH * Math.min(width, height);
    const bandwidthSq = bandwidth * bandwidth;
    
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        
        let density = 0;
        
        // Sum contributions from all points
        for (const submission of submissions) {
          const px = xScale(submission.umap_dim_1);
          const py = yScale(submission.umap_dim_2);
          
          const dx = x - px;
          const dy = y - py;
          const distSq = dx * dx + dy * dy;
          
          // Gaussian kernel
          if (distSq < bandwidthSq * 9) { // 3 standard deviations
            const weight = Math.exp(-distSq / (2 * bandwidthSq));
            density += weight;
          }
        }
        
        densityValues[row][col] = density;
      }
    }
    
    // Normalize density values - find max without flattening
    let maxDensity = 0;
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        if (densityValues[row][col] > maxDensity) {
          maxDensity = densityValues[row][col];
        }
      }
    }
    
    if (maxDensity > 0) {
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          densityValues[row][col] /= maxDensity;
        }
      }
    }
    
    // Generate contours for elevation lines
    const contourGenerator = d3.contours()
      .size([gridWidth, gridHeight])
      .thresholds(d3.range(0, 1, 0.1));
    
    // Flatten array more efficiently
    const flatValues: number[] = [];
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        flatValues.push(densityValues[row][col]);
      }
    }
    const contours = contourGenerator(flatValues);
    
    return {
      width: gridWidth,
      height: gridHeight,
      cellSize,
      values: densityValues,
      maxDensity: 1,
      contours
    };
  }
  
  /**
   * Smooth density grid using box blur
   */
  smoothDensityGrid(grid: DensityGrid, iterations: number = 2): DensityGrid {
    let values = [...grid.values.map(row => [...row])];
    
    for (let iter = 0; iter < iterations; iter++) {
      const newValues = values.map(row => [...row]);
      
      for (let row = 1; row < grid.height - 1; row++) {
        for (let col = 1; col < grid.width - 1; col++) {
          // 3x3 box blur
          let sum = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              sum += values[row + dr][col + dc];
            }
          }
          newValues[row][col] = sum / 9;
        }
      }
      
      values = newValues;
    }
    
    // Regenerate contours
    const contourGenerator = d3.contours()
      .size([grid.width, grid.height])
      .thresholds(d3.range(0, 1, 0.1));
    
    // Flatten array more efficiently
    const flatValues: number[] = [];
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        flatValues.push(values[row][col]);
      }
    }
    const contours = contourGenerator(flatValues);
    
    return {
      ...grid,
      values,
      contours
    };
  }
  
  /**
   * Get biome for a given density value with custom thresholds
   */
  getBiome(density: number, settings?: TerrainSettings): Biome {
    // Use urban biomes if urban style selected
    if (settings?.terrainStyle === 'greyscale') {
      const urbanBiomes = TerrainGenerator.URBAN_BIOMES;
      for (const biome of urbanBiomes) {
        if (density >= biome.minDensity && density < biome.maxDensity) {
          return biome;
        }
      }
      return urbanBiomes[urbanBiomes.length - 1];
    }
    
    // Use custom thresholds if settings provided for natural style
    if (settings) {
      const shallowWater = settings.shallowWaterThreshold || settings.oceanThreshold * 5;
      const beach = settings.beachThreshold || settings.oceanThreshold * 20;
      
      const customBiomes: Biome[] = [
        { name: 'ocean', minDensity: 0, maxDensity: settings.oceanThreshold, color: '#1e3a5f', elevation: 0 },
        { name: 'shallow_water', minDensity: settings.oceanThreshold, maxDensity: shallowWater, color: '#2e5a8f', elevation: 0.05 },
        { name: 'beach', minDensity: shallowWater, maxDensity: beach, color: '#f4e4c1', elevation: 0.1 },
        { name: 'desert', minDensity: beach, maxDensity: settings.desertThreshold, color: '#e8d4a0', elevation: 0.2 },
        { name: 'savanna', minDensity: settings.desertThreshold, maxDensity: (settings.desertThreshold + settings.forestThreshold) / 2, color: '#c5b783', elevation: 0.3 },
        { name: 'grassland', minDensity: (settings.desertThreshold + settings.forestThreshold) / 2, maxDensity: settings.forestThreshold, color: '#8fb171', elevation: 0.4 },
        { name: 'forest', minDensity: settings.forestThreshold, maxDensity: (settings.forestThreshold + settings.mountainThreshold) / 2, color: '#5a8a4c', elevation: 0.5 },
        { name: 'hills', minDensity: (settings.forestThreshold + settings.mountainThreshold) / 2, maxDensity: settings.mountainThreshold, color: '#7a9b76', elevation: 0.7 },
        { name: 'mountains', minDensity: settings.mountainThreshold, maxDensity: (settings.mountainThreshold + 1) / 2, color: '#8b9391', elevation: 0.9 },
        { name: 'peaks', minDensity: (settings.mountainThreshold + 1) / 2, maxDensity: 1.0, color: '#e8e8e8', elevation: 1.0 },
      ];
      
      for (const biome of customBiomes) {
        if (density >= biome.minDensity && density < biome.maxDensity) {
          return biome;
        }
      }
      return customBiomes[customBiomes.length - 1];
    }
    
    // Fall back to default natural biomes
    for (const biome of TerrainGenerator.NATURAL_BIOMES) {
      if (density >= biome.minDensity && density < biome.maxDensity) {
        return biome;
      }
    }
    return TerrainGenerator.NATURAL_BIOMES[TerrainGenerator.NATURAL_BIOMES.length - 1];
  }
  
  /**
   * Generate biome regions from density grid
   */
  generateBiomeRegions(grid: DensityGrid, settings?: TerrainSettings): Map<string, d3.ContourMultiPolygon[]> {
    const biomeContours = new Map<string, d3.ContourMultiPolygon[]>();
    const biomes = settings?.terrainStyle === 'greyscale' 
      ? TerrainGenerator.URBAN_BIOMES 
      : TerrainGenerator.NATURAL_BIOMES;
    
    for (const biome of biomes) {
      if (biome.minDensity === 0 && biome.maxDensity === 0.001) {
        // Ocean is everything below threshold
        continue;
      }
      
      const contourGenerator = d3.contours()
        .size([grid.width, grid.height])
        .thresholds([biome.minDensity, biome.maxDensity]);
      
      const flatValues = grid.values.flat();
      const contours = contourGenerator(flatValues);
      
      if (contours.length > 0) {
        biomeContours.set(biome.name, contours);
      }
    }
    
    return biomeContours;
  }
  
  /**
   * Calculate settlement density grid for surface visualization
   */
  calculateSettlementDensityGrid(
    submissions: Submission[],
    width: number,
    height: number,
    padding: number = 50
  ): DensityGrid {
    // Validate inputs
    if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
      return {
        width: 0,
        height: 0,
        cellSize: 1,
        values: [],
        maxDensity: 0,
        contours: []
      };
    }
    
    const cellSize = Math.max(width, height) / (TerrainGenerator.GRID_RESOLUTION * 2); // Higher resolution for settlements
    const gridWidth = Math.max(1, Math.ceil(width / cellSize));
    const gridHeight = Math.max(1, Math.ceil(height / cellSize));
    
    // Initialize grid
    const densityValues: number[][] = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(0));
    
    // Get data bounds
    const xExtent = d3.extent(submissions, d => d.umap_dim_1) as [number, number];
    const yExtent = d3.extent(submissions, d => d.umap_dim_2) as [number, number];
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);
    
    // Use larger bandwidth for settlement details (doubled)
    const bandwidth = TerrainGenerator.SETTLEMENT_BANDWIDTH * Math.min(width, height);
    const bandwidthSq = bandwidth * bandwidth;
    
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        
        let density = 0;
        
        // Sum contributions from all points with tighter kernel
        for (const submission of submissions) {
          const px = xScale(submission.umap_dim_1);
          const py = yScale(submission.umap_dim_2);
          
          const dx = x - px;
          const dy = y - py;
          const distSq = dx * dx + dy * dy;
          
          // Tighter Gaussian kernel for local details
          if (distSq < bandwidthSq * 4) { // 2 standard deviations
            const weight = Math.exp(-distSq / (2 * bandwidthSq)) * 2; // Amplify for visibility
            density += weight;
          }
        }
        
        densityValues[row][col] = density;
      }
    }
    
    // Normalize density values - find max without flattening
    let maxDensity = 0;
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        if (densityValues[row][col] > maxDensity) {
          maxDensity = densityValues[row][col];
        }
      }
    }
    
    if (maxDensity > 0) {
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          densityValues[row][col] /= maxDensity;
        }
      }
    }
    
    // Generate contours - flatten more efficiently
    const contourGenerator = d3.contours()
      .size([gridWidth, gridHeight])
      .thresholds(d3.range(0, 1, 0.1));
    
    // Flatten array more efficiently
    const flatValues: number[] = [];
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        flatValues.push(densityValues[row][col]);
      }
    }
    const contours = contourGenerator(flatValues);
    
    return {
      width: gridWidth,
      height: gridHeight,
      cellSize,
      values: densityValues,
      maxDensity: 1,
      contours
    };
  }

  /**
   * Calculate local settlements using fine-grained density (for point visualization)
   */
  calculateSettlements(
    submissions: Submission[],
    width: number,
    height: number,
    padding: number = 50
  ): Array<{x: number, y: number, size: number, type: 'village' | 'town' | 'city' | 'metropolis'}> {
    const settlements: Array<{x: number, y: number, size: number, type: 'village' | 'town' | 'city' | 'metropolis'}> = [];
    
    // Get data bounds and scales
    const xExtent = d3.extent(submissions, d => d.umap_dim_1) as [number, number];
    const yExtent = d3.extent(submissions, d => d.umap_dim_2) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);
    
    // Use smaller bandwidth for local density
    const bandwidth = TerrainGenerator.SETTLEMENT_BANDWIDTH * Math.min(width, height);
    const bandwidthSq = bandwidth * bandwidth;
    
    // Find local density clusters
    const processedPoints = new Set<number>();
    
    submissions.forEach((point, idx) => {
      if (processedPoints.has(idx)) return;
      
      const px = xScale(point.umap_dim_1);
      const py = yScale(point.umap_dim_2);
      
      // Find all nearby points
      const cluster: number[] = [idx];
      let clusterX = px;
      let clusterY = py;
      
      submissions.forEach((other, otherIdx) => {
        if (otherIdx === idx || processedPoints.has(otherIdx)) return;
        
        const ox = xScale(other.umap_dim_1);
        const oy = yScale(other.umap_dim_2);
        
        const dx = px - ox;
        const dy = py - oy;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < bandwidthSq * 4) { // 2x bandwidth radius
          cluster.push(otherIdx);
          clusterX += ox;
          clusterY += oy;
          processedPoints.add(otherIdx);
        }
      });
      
      // Only create settlement if cluster is significant
      if (cluster.length >= 3) {
        processedPoints.add(idx);
        const centerX = clusterX / cluster.length;
        const centerY = clusterY / cluster.length;
        
        // Determine settlement type based on cluster size
        let type: 'village' | 'town' | 'city' | 'metropolis';
        if (cluster.length >= 30) type = 'metropolis';
        else if (cluster.length >= 15) type = 'city';
        else if (cluster.length >= 8) type = 'town';
        else type = 'village';
        
        settlements.push({
          x: centerX,
          y: centerY,
          size: cluster.length,
          type
        });
      }
    });
    
    // Sort by size and limit number of settlements
    settlements.sort((a, b) => b.size - a.size);
    return settlements.slice(0, 50); // Max 50 settlements
  }
  
  /**
   * Get settlement type for a given density value
   */
  getSettlementType(density: number, settings?: TerrainSettings): { name: string; color: string } | null {
    const houseThreshold = settings?.houseThreshold ?? 0.1;
    const villageThreshold = settings?.villageThreshold ?? 0.3;
    const cityThreshold = settings?.cityThreshold ?? 0.6;
    
    if (density < houseThreshold) {
      return null; // No settlement
    } else if (density < villageThreshold) {
      return { name: 'house', color: 'rgba(160, 82, 45, 0.5)' }; // Brown
    } else if (density < cityThreshold) {
      return { name: 'village', color: 'rgba(128, 128, 128, 0.6)' }; // Gray
    } else {
      return { name: 'city', color: 'rgba(106, 90, 205, 0.7)' }; // Slate blue/purple for cities
    }
  }

  /**
   * Find density peaks (for city/settlement placement) - DEPRECATED, use calculateSettlements
   */
  findDensityPeaks(grid: DensityGrid, minDensity: number = 0.5): Array<{x: number, y: number, density: number}> {
    const peaks: Array<{x: number, y: number, density: number}> = [];
    
    for (let row = 1; row < grid.height - 1; row++) {
      for (let col = 1; col < grid.width - 1; col++) {
        const value = grid.values[row][col];
        
        if (value < minDensity) continue;
        
        // Check if this is a local maximum
        let isMax = true;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (grid.values[row + dr][col + dc] > value) {
              isMax = false;
              break;
            }
          }
          if (!isMax) break;
        }
        
        if (isMax) {
          peaks.push({
            x: col * grid.cellSize + grid.cellSize / 2,
            y: row * grid.cellSize + grid.cellSize / 2,
            density: value
          });
        }
      }
    }
    
    // Sort by density and filter nearby peaks
    peaks.sort((a, b) => b.density - a.density);
    
    const filteredPeaks: typeof peaks = [];
    const minDistance = grid.cellSize * 5;
    
    for (const peak of peaks) {
      let tooClose = false;
      for (const existing of filteredPeaks) {
        const dx = peak.x - existing.x;
        const dy = peak.y - existing.y;
        if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        filteredPeaks.push(peak);
      }
    }
    
    return filteredPeaks;
  }
  
  /**
   * Generate gradient colors between biomes
   */
  createBiomeColorScale(settings?: TerrainSettings): d3.ScaleLinear<string, string> {
    const biomes = settings?.terrainStyle === 'greyscale' 
      ? TerrainGenerator.URBAN_BIOMES 
      : TerrainGenerator.NATURAL_BIOMES;
      
    const domain = biomes.map(b => (b.minDensity + b.maxDensity) / 2);
    const range = biomes.map(b => b.color);
    
    return d3.scaleLinear<string>()
      .domain(domain)
      .range(range)
      .interpolate(d3.interpolateRgb);
  }
  
  /**
   * Calculate shadow intensity based on elevation gradient
   */
  calculateShadow(grid: DensityGrid, row: number, col: number): number {
    if (row >= grid.height - 1 || col >= grid.width - 1) return 0;
    
    const current = grid.values[row][col];
    const right = grid.values[row][col + 1];
    const bottom = grid.values[row + 1][col];
    
    // Simple lighting from top-left
    const dx = right - current;
    const dy = bottom - current;
    
    // Normalize and calculate dot product with light direction
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude === 0) return 0;
    
    const lightX = -0.7;
    const lightY = -0.7;
    
    const dot = (dx / magnitude) * lightX + (dy / magnitude) * lightY;
    
    return Math.max(0, Math.min(1, (dot + 1) / 2));
  }
}

export const terrainGenerator = new TerrainGenerator();