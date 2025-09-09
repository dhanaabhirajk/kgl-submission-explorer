import type { Submission, Cluster, SimilarityData } from '../types';

export interface TagFrequency {
  tag: string;
  count: number;
}

export interface CategoryFrequency {
  category: string;
  count: number;
}

export interface ClusterMemberCount {
  clusterId: string;
  clusterLabel: number;
  name: string;
  color: string;
  memberCount: number;
}

export interface UniquenessScore {
  projectId: number;
  title: string;
  subtitle: string;
  averageSimilarity: number;
  uniquenessPercentage: number;
}

export interface DatasetStatistics {
  // Overview
  totalProjects: number;
  totalClusters: number;
  totalHighLevelClusters: number;
  totalDetailedClusters: number;
  totalCategories: number;
  averageTagsPerProject: number;
  
  // Tag Analysis
  topTags: TagFrequency[];
  bottomTags: TagFrequency[];
  allTagFrequencies: TagFrequency[];
  
  // Category Analysis
  categoryFrequencies: CategoryFrequency[];
  
  // Cluster Analysis
  highLevelClusterCounts: ClusterMemberCount[];
  detailedClusterCounts: ClusterMemberCount[];
  
  // Uniqueness Analysis
  uniquenessDistribution: number[]; // Array of average similarity scores
  mostUniqueProjects: UniquenessScore[];
  uniquenessHistogram: { bin: number; count: number }[];
}

class StatsService {
  computeStatistics(
    submissions: Submission[],
    clusters: Cluster[],
    similarities: Map<number, SimilarityData>
  ): DatasetStatistics {
    // Compute tag frequencies
    const tagCounts = new Map<string, number>();
    let totalTags = 0;
    
    submissions.forEach(submission => {
      submission.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        totalTags++;
      });
    });
    
    const allTagFrequencies = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    
    // Compute category frequencies
    const categoryCounts = new Map<string, number>();
    submissions.forEach(submission => {
      submission.category_tags.forEach(category => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    });
    
    const categoryFrequencies = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    // Compute cluster member counts
    const highLevelClusters = clusters.filter(c => c.cluster_level === 'High');
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    
    // Handle duplicate names by adding cluster label suffix
    const nameCountsHigh = new Map<string, number>();
    const highLevelClusterCounts = highLevelClusters
      .map(cluster => {
        const count = nameCountsHigh.get(cluster.name) || 0;
        nameCountsHigh.set(cluster.name, count + 1);
        const uniqueName = count > 0 ? `${cluster.name} (${cluster.cluster_label})` : cluster.name;
        return {
          clusterId: cluster.cluster_id,
          clusterLabel: cluster.cluster_label,
          name: uniqueName,
          color: cluster.color,
          memberCount: cluster.members.length
        };
      })
      .sort((a, b) => b.memberCount - a.memberCount);
    
    const nameCountsDetailed = new Map<string, number>();
    const detailedClusterCounts = detailedClusters
      .map(cluster => {
        const count = nameCountsDetailed.get(cluster.name) || 0;
        nameCountsDetailed.set(cluster.name, count + 1);
        const uniqueName = count > 0 ? `${cluster.name} (${cluster.cluster_label})` : cluster.name;
        return {
          clusterId: cluster.cluster_id,
          clusterLabel: cluster.cluster_label,
          name: uniqueName,
          color: cluster.color,
          memberCount: cluster.members.length
        };
      })
      .sort((a, b) => b.memberCount - a.memberCount);
    
    // Compute uniqueness scores
    const uniquenessScores: UniquenessScore[] = [];
    const similarityScores: number[] = [];
    
    submissions.forEach(submission => {
      const similarityData = similarities.get(submission.data_point_id);
      if (similarityData && similarityData.top_similar_projects.length > 0) {
        // Calculate average similarity for this project
        const avgSimilarity = similarityData.top_similar_projects
          .reduce((sum, proj) => sum + proj.similarity_score, 0) / 
          similarityData.top_similar_projects.length;
        
        similarityScores.push(avgSimilarity);
        
        uniquenessScores.push({
          projectId: submission.data_point_id,
          title: submission.title,
          subtitle: submission.subtitle,
          averageSimilarity: avgSimilarity,
          uniquenessPercentage: Math.round((1 - avgSimilarity) * 100)
        });
      }
    });
    
    // Sort by uniqueness (lower similarity = more unique)
    uniquenessScores.sort((a, b) => a.averageSimilarity - b.averageSimilarity);
    
    // Create histogram bins for similarity distribution
    const histogramBins = 20;
    const minSim = Math.min(...similarityScores);
    const maxSim = Math.max(...similarityScores);
    const binWidth = (maxSim - minSim) / histogramBins;
    
    const histogram: { bin: number; count: number }[] = [];
    for (let i = 0; i < histogramBins; i++) {
      const binStart = minSim + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = similarityScores.filter(
        score => score >= binStart && score < binEnd
      ).length;
      histogram.push({ bin: binStart + binWidth / 2, count });
    }
    
    return {
      // Overview
      totalProjects: submissions.length,
      totalClusters: clusters.length,
      totalHighLevelClusters: highLevelClusters.length,
      totalDetailedClusters: detailedClusters.length,
      totalCategories: categoryFrequencies.length,
      averageTagsPerProject: Math.round((totalTags / submissions.length) * 10) / 10,
      
      // Tag Analysis
      topTags: allTagFrequencies.slice(0, 20),
      bottomTags: allTagFrequencies.slice(-10).reverse(),
      allTagFrequencies,
      
      // Category Analysis
      categoryFrequencies,
      
      // Cluster Analysis
      highLevelClusterCounts,
      detailedClusterCounts,
      
      // Uniqueness Analysis
      uniquenessDistribution: similarityScores,
      mostUniqueProjects: uniquenessScores.slice(0, 25),
      uniquenessHistogram: histogram
    };
  }
}

export const statsService = new StatsService();