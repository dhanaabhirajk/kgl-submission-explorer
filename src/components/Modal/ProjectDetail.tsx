import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import type { Submission } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithTimeout } from '../ImageWithTimeout';
import { sanitizeKaggleUrl } from '../../utils/url';

interface ProjectDetailProps {
  project: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onFindSimilar: (projectId: number) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  isOpen,
  onClose,
  onFindSimilar
}) => {
  if (!project) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  {/* Hero Image */}
                  <div className="relative w-full h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 overflow-hidden">
                    {project.hero_image_url ? (
                      <ImageWithTimeout
                        src={project.hero_image_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        timeout={3000}
                        fallback={
                          <div className="flex items-center justify-center h-full">
                            <div className="text-gray-600 text-6xl">🎨</div>
                          </div>
                        }
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-600 text-6xl">🎨</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                  </div>

                  {/* Close Button */}
                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 p-2 bg-gray-900/80 backdrop-blur-sm rounded-full hover:bg-gray-800 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-300" />
                    </button>
                  </Dialog.Close>

                  {/* Content */}
                  <div className="p-8">
                    {/* Title & Subtitle */}
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {project.title}
                      </h2>
                      {project.subtitle && (
                        <p className="text-lg text-gray-400">
                          {project.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.slice(0, 10).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 10 && (
                        <span className="px-3 py-1 bg-gray-700/50 text-gray-400 rounded-full text-sm">
                          +{project.tags.length - 10} more
                        </span>
                      )}
                    </div>

                    {/* Categories */}
                    {project.category_tags && project.category_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.category_tags.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {project.description || 'No description available.'}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                      <div>
                        <span className="text-gray-500">Project ID:</span>
                        <span className="ml-2 text-gray-300">#{project.data_point_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 text-gray-300">{project.date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cluster:</span>
                        <span className="ml-2 text-gray-300">
                          {project.detailed_hierarchical_label}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Region:</span>
                        <span className="ml-2 text-gray-300">
                          {project.detailed_region_label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      {project.writeup_url && (
                        <a
                          href={sanitizeKaggleUrl(project.writeup_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Full Writeup
                        </a>
                      )}
                      <button
                        onClick={() => {
                          onFindSimilar(project.data_point_id);
                          onClose();
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Find Similar Projects
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};