import { create } from 'zustand';
import type { Submission, Cluster, SimilarityData } from '../types';
import { dataLoader } from '../services/dataLoader';
import { statsService, type DatasetStatistics } from '../services/statsService';
import { terrainGenerator, type DensityGrid } from '../services/terrainGenerator';

interface DataState {
  // Data
  submissions: Submission[];
  clusters: Cluster[];
  similarities: Map<number, SimilarityData>;
  
  // Statistics
  datasetStats: DatasetStatistics | null;
  
  // Pre-computed terrain data
  densityGrid: DensityGrid | null;
  densityGridDimensions: { width: number; height: number } | null;
  terrainImageCache: ImageData | null;
  terrainSettingsCache: any | null;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Selected project
  selectedProjectId: number | null;
  hoveredProjectId: number | null;
  
  // Selected cluster
  selectedClusterId: string | null;
  
  // Filtered projects
  filteredProjectIds: Set<number> | null;
  
  // Highlighted unique projects
  uniqueProjectIds: Set<number> | null;
  
  // Actions
  loadData: () => Promise<void>;
  setSelectedProject: (id: number | null) => void;
  setSelectedProjectId: (id: number | null) => void;
  setHoveredProject: (id: number | null) => void;
  setSelectedCluster: (id: string | null) => void;
  setFilteredProjects: (ids: Set<number> | null) => void;
  setUniqueProjectsHighlight: (projectIds: number[] | null) => void;
  getSimilarProjects: (projectId: number) => SimilarityData | undefined;
  getProjectById: (id: number) => Submission | undefined;
  getClusterById: (id: string) => Cluster | undefined;
  getClusterMembers: (clusterId: string) => Submission[];
  setTerrainCache: (imageData: ImageData | null, settings: any | null) => void;
  getTerrainCache: () => { imageData: ImageData | null; settings: any | null };
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  submissions: [],
  clusters: [],
  similarities: new Map(),
  datasetStats: null,
  densityGrid: null,
  densityGridDimensions: null,
  terrainImageCache: null,
  terrainSettingsCache: null,
  isLoading: false,
  error: null,
  selectedProjectId: null,
  hoveredProjectId: null,
  selectedClusterId: null,
  filteredProjectIds: null,
  uniqueProjectIds: null,

  // Load all data
  loadData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { submissions, clusters, similarities } = await dataLoader.loadAllData();
      
      // Create a map for faster similarity lookups
      const similarityMap = new Map<number, SimilarityData>();
      similarities.forEach(sim => {
        similarityMap.set(sim.data_point_id, sim);
      });
      
      // Compute statistics
      const datasetStats = statsService.computeStatistics(
        submissions,
        clusters,
        similarityMap
      );
      
      // Pre-compute density grid with default dimensions
      // Will be recalculated when actual dimensions are known
      const defaultWidth = 1200;
      const defaultHeight = 800;
      const densityGrid = terrainGenerator.calculateDensityGrid(
        submissions,
        defaultWidth,
        defaultHeight
      );
      const smoothedGrid = terrainGenerator.smoothDensityGrid(densityGrid, 3);
      
      set({ 
        submissions, 
        clusters, 
        similarities: similarityMap,
        datasetStats,
        densityGrid: smoothedGrid,
        densityGridDimensions: { width: defaultWidth, height: defaultHeight },
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false 
      });
    }
  },

  // Set selected project (clears cluster selection)
  setSelectedProject: (id: number | null) => {
    set({ 
      selectedProjectId: id,
      selectedClusterId: null  // Clear cluster selection when selecting a project
    });
  },

  // Alias for setSelectedProject
  setSelectedProjectId: (id: number | null) => {
    set({ 
      selectedProjectId: id,
      selectedClusterId: null  // Clear cluster selection when selecting a project
    });
  },

  // Set hovered project
  setHoveredProject: (id: number | null) => {
    set({ hoveredProjectId: id });
  },

  // Get similar projects for a given project ID
  getSimilarProjects: (projectId: number) => {
    const { similarities } = get();
    return similarities.get(projectId);
  },

  // Get project by ID
  getProjectById: (id: number) => {
    const { submissions } = get();
    return submissions.find(s => s.data_point_id === id);
  },

  // Set selected cluster (clears project selection)
  setSelectedCluster: (id: string | null) => {
    set({ 
      selectedClusterId: id,
      selectedProjectId: null  // Clear project selection when selecting a cluster
    });
  },

  // Get cluster by ID
  getClusterById: (id: string) => {
    const { clusters } = get();
    return clusters.find(c => c.cluster_id === id);
  },

  // Get all submissions that belong to a cluster
  getClusterMembers: (clusterId: string) => {
    const { clusters, submissions } = get();
    const cluster = clusters.find(c => c.cluster_id === clusterId);
    if (!cluster) return [];
    
    return submissions.filter(s => 
      cluster.members.includes(s.data_point_id)
    );
  },

  // Set terrain cache
  setTerrainCache: (imageData: ImageData | null, settings: any | null) => {
    set({ terrainImageCache: imageData, terrainSettingsCache: settings });
  },

  // Get terrain cache
  getTerrainCache: () => {
    const { terrainImageCache, terrainSettingsCache } = get();
    return { imageData: terrainImageCache, settings: terrainSettingsCache };
  },

  // Set filtered projects
  setFilteredProjects: (ids: Set<number> | null) => {
    set({ filteredProjectIds: ids });
  },

  // Set unique projects highlight
  setUniqueProjectsHighlight: (projectIds: number[] | null) => {
    set({ 
      uniqueProjectIds: projectIds ? new Set(projectIds) : null 
    });
  },
}));