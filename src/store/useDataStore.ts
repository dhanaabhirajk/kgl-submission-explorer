import { create } from 'zustand';
import type { Submission, Cluster, SimilarityData } from '../types.js';
import { dataLoader } from '../services/dataLoader';

interface DataState {
  // Data
  submissions: Submission[];
  clusters: Cluster[];
  similarities: Map<number, SimilarityData>;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Selected project
  selectedProjectId: number | null;
  hoveredProjectId: number | null;
  
  // Actions
  loadData: () => Promise<void>;
  setSelectedProject: (id: number | null) => void;
  setHoveredProject: (id: number | null) => void;
  getSimilarProjects: (projectId: number) => SimilarityData | undefined;
  getProjectById: (id: number) => Submission | undefined;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  submissions: [],
  clusters: [],
  similarities: new Map(),
  isLoading: false,
  error: null,
  selectedProjectId: null,
  hoveredProjectId: null,

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
      
      set({ 
        submissions, 
        clusters, 
        similarities: similarityMap,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false 
      });
    }
  },

  // Set selected project
  setSelectedProject: (id: number | null) => {
    set({ selectedProjectId: id });
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
}));