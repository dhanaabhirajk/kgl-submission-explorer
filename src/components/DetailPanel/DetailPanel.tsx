import React from 'react';
import { X, ExternalLink, Sparkles, Tag, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Submission } from '../../types';

interface DetailPanelProps {
  project: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onFindSimilar: (projectId: number) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  project,
  isOpen,
  onClose,
  onFindSimilar
}) => {
  return (
    <AnimatePresence>
      {isOpen && project && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-[450px] bg-gray-900/95 backdrop-blur-md border-l border-gray-700 shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {/* Header with image */}
          <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex-shrink-0">
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
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-600 text-5xl">🎨</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-gray-900/80 backdrop-blur-sm rounded-full hover:bg-gray-800 transition-colors group"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Title & Subtitle */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {project.title}
                </h2>
                {project.subtitle && (
                  <p className="text-gray-400">
                    {project.subtitle}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Hash className="w-3 h-3" />
                    Project ID
                  </div>
                  <div className="text-white font-medium">#{project.data_point_id}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    Date
                  </div>
                  <div className="text-white font-medium">{project.date || 'N/A'}</div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <Tag className="w-4 h-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 12).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs hover:bg-blue-500/30 transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 12 && (
                    <span className="px-3 py-1 bg-gray-700/50 text-gray-400 rounded-full text-xs">
                      +{project.tags.length - 12} more
                    </span>
                  )}
                </div>
              </div>

              {/* Categories */}
              {project.category_tags && project.category_tags.length > 0 && (
                <div className="mb-6">
                  <div className="text-gray-400 text-sm mb-3">Categories</div>
                  <div className="flex flex-wrap gap-2">
                    {project.category_tags.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs hover:bg-purple-500/30 transition-colors cursor-pointer"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Description</h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {project.description || 'No description available.'}
                </p>
              </div>

              {/* Cluster Info */}
              <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Cluster Information</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">High:</span>
                    <span className="ml-1 text-gray-300">{project.high_level_hierarchical_label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Medium:</span>
                    <span className="ml-1 text-gray-300">{project.medium_level_hierarchical_label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Detail:</span>
                    <span className="ml-1 text-gray-300">{project.detailed_hierarchical_label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="border-t border-gray-800 p-4 flex gap-3 bg-gray-900/50 backdrop-blur-sm">
            {project.writeup_url && (
              <a
                href={project.writeup_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Writeup
              </a>
            )}
            <button
              onClick={() => {
                onFindSimilar(project.data_point_id);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Find Similar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};