import React, { useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { X, Sparkles, Layers, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SelectionIndicator: React.FC = () => {
  const { 
    selectedProjectId, 
    selectedClusterId,
    filteredProjectIds,
    setSelectedProject,
    setSelectedCluster,
    setFilteredProjects,
    getProjectById,
    getClusterById
  } = useDataStore();

  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : null;
  const selectedCluster = selectedClusterId ? getClusterById(selectedClusterId) : null;

  // Handle ESC key to clear all selections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setSelectedCluster(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedProject, setSelectedCluster]);

  const hasSelection = selectedProject || selectedCluster || filteredProjectIds;

  if (!hasSelection) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-4 left-4 z-50 space-y-2"
    >
      <AnimatePresence>
        {/* Project Selection */}
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-900/95 backdrop-blur-sm border border-purple-500/50 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-xs text-purple-400">Project Selected</span>
              <span className="text-sm text-white font-medium max-w-[200px] truncate">
                {selectedProject.title}
              </span>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors group"
              title="Clear project selection (ESC)"
            >
              <X className="w-3 h-3 text-gray-400 group-hover:text-white" />
            </button>
          </motion.div>
        )}

        {/* Cluster Selection */}
        {selectedCluster && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-900/95 backdrop-blur-sm border border-green-500/50 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xl"
          >
            <Layers className="w-4 h-4 text-green-400" />
            <div className="flex flex-col">
              <span className="text-xs text-green-400">Cluster Selected</span>
              <span className="text-sm text-white font-medium max-w-[200px] truncate">
                {selectedCluster.name}
              </span>
              <span className="text-xs text-gray-500">
                {selectedCluster.members.length} projects
              </span>
            </div>
            <button
              onClick={() => setSelectedCluster(null)}
              className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors group"
              title="Clear cluster selection (ESC)"
            >
              <X className="w-3 h-3 text-gray-400 group-hover:text-white" />
            </button>
          </motion.div>
        )}

        {/* Filter Indicator */}
        {filteredProjectIds && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-900/95 backdrop-blur-sm border border-blue-500/50 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xl"
          >
            <Filter className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-xs text-blue-400">Filters Active</span>
              <span className="text-sm text-white font-medium">
                {filteredProjectIds.size} projects shown
              </span>
            </div>
            <button
              onClick={() => setFilteredProjects(null)}
              className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors group"
              title="Clear filters"
            >
              <X className="w-3 h-3 text-gray-400 group-hover:text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Button */}
      {hasSelection && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
          onClick={() => {
            setSelectedProject(null);
            setSelectedCluster(null);
            setFilteredProjects(null);
          }}
        >
          Clear All (ESC)
        </motion.button>
      )}
    </motion.div>
  );
};