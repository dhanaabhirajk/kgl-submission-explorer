import React, { useEffect, useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import type { Submission, SimilarProject } from '../../types';
import { Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SimilarityPanel: React.FC = () => {
  const { 
    selectedProjectId, 
    getSimilarProjects, 
    getProjectById, 
    setSelectedProjectId,
    submissions 
  } = useDataStore();
  
  const [similarProjects, setSimilarProjects] = useState<Array<{
    project: Submission;
    score: number;
  }>>([]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSimilarProjects([]);
      return;
    }

    const similarityData = getSimilarProjects(selectedProjectId);
    if (!similarityData) {
      setSimilarProjects([]);
      return;
    }

    // Get top 8 similar projects
    const topSimilar = similarityData.top_similar_projects
      .slice(0, 8)
      .map((similar: SimilarProject) => {
        const project = getProjectById(similar.project_id);
        return project ? { project, score: similar.similarity_score } : null;
      })
      .filter(Boolean) as Array<{ project: Submission; score: number }>;

    setSimilarProjects(topSimilar);
  }, [selectedProjectId, getSimilarProjects, getProjectById]);

  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : null;

  if (!selectedProject) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Similar Projects</span>
        </div>
        <p>Click on a project to see similar ones</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-white">Similar to:</span>
        </div>
        <p className="text-sm text-gray-300 line-clamp-2">{selectedProject.title}</p>
      </div>

      {/* Similar Projects List */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {similarProjects.map(({ project, score }, index) => (
            <motion.div
              key={project.data_point_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="mb-2"
            >
              <button
                onClick={() => setSelectedProjectId(project.data_point_id)}
                className="w-full p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    {project.hero_image_url ? (
                      <img
                        src={project.hero_image_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        🎨
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <h4 className="text-white text-sm font-medium line-clamp-1 mb-1">
                      {project.title}
                    </h4>
                    <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                      {project.subtitle || project.description}
                    </p>
                    
                    {/* Similarity Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-400">
                        {(score * 100).toFixed(1)}% similar
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors" />
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {similarProjects.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-8">
            No similarity data available for this project
          </div>
        )}
      </div>
    </div>
  );
};