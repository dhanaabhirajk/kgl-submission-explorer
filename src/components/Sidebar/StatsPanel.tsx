import React from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Activity, Hash, Layers, Tag, Sparkles, TrendingUp } from 'lucide-react';
import { TagDistributionChart } from '../Charts/TagDistributionChart';
import { CategoryChart } from '../Charts/CategoryChart';
import { ClusterBarChart } from '../Charts/ClusterBarChart';
import { UniquenessHistogram } from '../Charts/UniquenessHistogram';
import { UniqueProjectsList } from '../Charts/UniqueProjectsList';

export const StatsPanel: React.FC = () => {
  const { datasetStats } = useDataStore();

  if (!datasetStats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Computing statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Dataset Overview */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white">Dataset Overview</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Hash className="w-3 h-3" />
              Projects
            </div>
            <div className="text-white font-semibold text-lg">
              {datasetStats.totalProjects}
            </div>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Layers className="w-3 h-3" />
              Clusters
            </div>
            <div className="text-white font-semibold text-lg">
              {datasetStats.totalClusters}
            </div>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Tag className="w-3 h-3" />
              Categories
            </div>
            <div className="text-white font-semibold text-lg">
              {datasetStats.totalCategories}
            </div>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Avg Tags
            </div>
            <div className="text-white font-semibold text-lg">
              {datasetStats.averageTagsPerProject}
            </div>
          </div>
        </div>
      </div>

      {/* Tag Distribution */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white">Tag Distribution</span>
        </div>
        <TagDistributionChart 
          topTags={datasetStats.topTags}
          bottomTags={datasetStats.bottomTags}
        />
      </div>

      {/* Category Tags */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white">All Category Tags</span>
        </div>
        <CategoryChart categories={datasetStats.categoryFrequencies} />
      </div>

      {/* Cluster Distribution */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white">Cluster Member Distribution</span>
        </div>
        <ClusterBarChart 
          highLevelClusters={datasetStats.highLevelClusterCounts}
          detailedClusters={datasetStats.detailedClusterCounts}
        />
      </div>

      {/* Uniqueness Analysis */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white">Project Uniqueness</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">Similarity Distribution</p>
            <UniquenessHistogram histogram={datasetStats.uniquenessHistogram} />
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-2">25 Most Unique Projects</p>
            <UniqueProjectsList projects={datasetStats.mostUniqueProjects} />
          </div>
        </div>
      </div>
    </div>
  );
};