import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { ChevronLeft, ChevronRight, Layers, BarChart3, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClusterLegendProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const ClusterLegend: React.FC<ClusterLegendProps> = ({ onCollapsedChange }) => {
  const { 
    clusters, 
    selectedClusterId, 
    setSelectedCluster, 
    getClusterMembers,
    setSelectedProject,
    selectedProjectId 
  } = useDataStore();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };
  const [selectedLevel, setSelectedLevel] = useState<'High' | 'Detailed'>('Detailed');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'stats'>('members');

  const filteredClusters = clusters.filter(c => c.cluster_level === selectedLevel);
  const selectedCluster = clusters.find(c => c.cluster_id === selectedClusterId);
  const clusterMembers = selectedClusterId ? getClusterMembers(selectedClusterId) : [];

  // Calculate cluster statistics
  const clusterStats = useMemo(() => {
    if (!selectedCluster || clusterMembers.length === 0) return null;

    // Count tags
    const tagCounts = new Map<string, number>();
    const categoryTagCounts = new Map<string, number>();

    clusterMembers.forEach(member => {
      member.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
      member.category_tags.forEach(tag => {
        categoryTagCounts.set(tag, (categoryTagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort and get top tags
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ 
        tag, 
        count, 
        percentage: Math.round((count / clusterMembers.length) * 100) 
      }));

    const topCategories = Array.from(categoryTagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ 
        tag, 
        count, 
        percentage: Math.round((count / clusterMembers.length) * 100) 
      }));

    return {
      memberCount: clusterMembers.length,
      topTags,
      topCategories
    };
  }, [selectedCluster, clusterMembers]);

  // Adjust position based on detail panel (450px panel width + 16px gap)
  const rightPosition = selectedProjectId ? 466 : 4;
  
  // Calculate dynamic height when cluster is selected
  const panelHeight = selectedClusterId && showDetails ? 'calc(100vh - 100px)' : 'auto';

  return (
    <motion.div
      initial={{ width: 300 }}
      animate={{ 
        width: isCollapsed ? 48 : (window.innerWidth < 768 ? 200 : 300)
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-14 md:top-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl"
      style={{ 
        right: `${rightPosition}px`,
        maxHeight: panelHeight,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30
      }}
    >
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2 py-3' : 'justify-between p-3'} ${!isCollapsed && 'border-b border-gray-700'}`}>
        {isCollapsed ? (
          <>
            <Layers className="w-4 h-4 text-purple-400" />
            <button
              onClick={() => handleSetCollapsed(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Expand Cluster Legend"
            >
              <ChevronLeft className="w-4 h-4 text-gray-300 hover:text-white" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">Cluster Legend</span>
            </div>
            <button
              onClick={() => handleSetCollapsed(true)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Collapse Cluster Legend"
            >
              <ChevronRight className="w-4 h-4 text-gray-300 hover:text-white" />
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Level Selector */}
            <div className="flex gap-1 p-2 border-b border-gray-800">
              {(['High', 'Detailed'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                    selectedLevel === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Cluster List */}
            <div className={`overflow-y-auto p-2 ${selectedClusterId && showDetails ? 'max-h-48' : 'max-h-96'}`}>
              {filteredClusters.map(cluster => (
                <div
                  key={cluster.cluster_id}
                  className={`flex items-center gap-2 p-1.5 rounded transition-colors cursor-pointer group ${
                    selectedClusterId === cluster.cluster_id 
                      ? 'bg-purple-600/30 border border-purple-500' 
                      : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => {
                    if (selectedClusterId === cluster.cluster_id) {
                      setSelectedCluster(null);
                      setShowDetails(false);
                    } else {
                      setSelectedCluster(cluster.cluster_id);
                      setShowDetails(true);
                      // Don't reset tab - keep current selection
                    }
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <span className={`text-xs truncate transition-colors ${
                    selectedClusterId === cluster.cluster_id 
                      ? 'text-white' 
                      : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {cluster.name}
                  </span>
                  <span className="text-xs text-gray-600 ml-auto">
                    {cluster.members.length}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="p-2 border-t border-gray-800 text-xs text-gray-500">
              {filteredClusters.length} clusters at {selectedLevel.toLowerCase()} level
            </div>

            {/* Cluster Details Panel */}
            <AnimatePresence>
              {showDetails && selectedCluster && clusterStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-800 flex flex-col flex-1 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedCluster.color }}
                        />
                        <h3 className="text-sm font-medium text-white">
                          {selectedCluster.name}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCluster(null);
                          setShowDetails(false);
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {clusterStats.memberCount} projects
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-800">
                    <button 
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        activeTab === 'members' 
                          ? 'bg-gray-800 text-white border-b-2 border-purple-500' 
                          : 'text-gray-400 hover:bg-gray-800/50'
                      }`}
                      onClick={() => setActiveTab('members')}
                    >
                      <Users className="w-3 h-3 inline mr-1" />
                      Members
                    </button>
                    <button 
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        activeTab === 'stats' 
                          ? 'bg-gray-800 text-white border-b-2 border-purple-500' 
                          : 'text-gray-400 hover:bg-gray-800/50'
                      }`}
                      onClick={() => setActiveTab('stats')}
                    >
                      <BarChart3 className="w-3 h-3 inline mr-1" />
                      Stats
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {activeTab === 'members' ? (
                      /* Cluster Members */
                      <div className="p-2">
                        {clusterMembers.slice(0, 50).map(member => (
                          <div
                            key={member.data_point_id}
                            className="p-2 hover:bg-gray-800/50 rounded cursor-pointer transition-colors"
                            onClick={() => setSelectedProject(member.data_point_id)}
                          >
                            <h4 className="text-xs text-white font-medium line-clamp-1">
                              {member.title}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {member.subtitle}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {member.tags.slice(0, 2).map((tag, i) => (
                                <span 
                                  key={i}
                                  className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {clusterMembers.length > 50 && (
                          <div className="text-xs text-gray-500 text-center mt-2">
                            +{clusterMembers.length - 50} more projects
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Statistics View */
                      <div className="p-3 space-y-4">
                        {/* Top Tags */}
                        <div>
                          <h4 className="text-xs font-medium text-white mb-2">Top 10 Tags</h4>
                          <div className="space-y-1">
                            {clusterStats.topTags.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-32 truncate">
                                  {item.tag}
                                </span>
                                <div className="flex-1 bg-gray-800 rounded-full h-3 relative overflow-hidden">
                                  <div 
                                    className="absolute inset-y-0 left-0 bg-purple-500 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">
                                  {item.percentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Categories */}
                        <div>
                          <h4 className="text-xs font-medium text-white mb-2">Top 5 Categories</h4>
                          <div className="space-y-1">
                            {clusterStats.topCategories.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-32 truncate">
                                  {item.tag}
                                </span>
                                <div className="flex-1 bg-gray-800 rounded-full h-3 relative overflow-hidden">
                                  <div 
                                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">
                                  {item.percentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="pt-2 border-t border-gray-800">
                          <div className="text-xs text-gray-400">
                            <div>Total Projects: {clusterStats.memberCount}</div>
                            <div>Unique Tags: {clusterStats.topTags.length}</div>
                            <div>Unique Categories: {clusterStats.topCategories.length}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};