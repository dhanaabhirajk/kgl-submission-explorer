import React from 'react';
import { Eye, Sparkles, X } from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import type { UniquenessScore } from '../../services/statsService';
import { motion } from 'framer-motion';

interface UniqueProjectsListProps {
  projects: UniquenessScore[];
}

export const UniqueProjectsList: React.FC<UniqueProjectsListProps> = ({ projects }) => {
  const { 
    setSelectedProjectId, 
    uniqueProjectIds, 
    setUniqueProjectsHighlight 
  } = useDataStore();

  const handleHighlightOnCanvas = () => {
    const projectIds = projects.map(p => p.projectId);
    setUniqueProjectsHighlight(projectIds);
  };

  const handleClearHighlight = () => {
    setUniqueProjectsHighlight(null);
  };

  const isHighlighting = uniqueProjectIds !== null;

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2">
        {!isHighlighting ? (
          <button
            onClick={handleHighlightOnCanvas}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Highlight on Canvas
          </button>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleClearHighlight}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Clear Highlights
          </motion.button>
        )}
      </div>

      {/* Projects list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {projects.map((project, index) => (
          <motion.div
            key={project.projectId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all cursor-pointer group ${
              uniqueProjectIds?.has(project.projectId) ? 'ring-2 ring-purple-500' : ''
            }`}
            onClick={() => setSelectedProjectId(project.projectId)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-purple-400">
                    #{index + 1}
                  </span>
                  <h4 className="text-sm font-medium text-white truncate">
                    {project.title}
                  </h4>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {project.subtitle}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-1 ml-3">
                <div className="px-2 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full">
                  <span className="text-xs font-semibold text-purple-300">
                    {project.uniquenessPercentage}%
                  </span>
                </div>
                <Eye className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      {isHighlighting && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-300">
              25 most unique projects are highlighted on the canvas with a purple glow
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};