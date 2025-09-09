import React, { useState, useMemo, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Submission, Cluster } from '../../types';

interface FilterState {
  tags: Set<string>;
  categories: Set<string>;
  clusters: Set<number>;
}

export const FilterPanel: React.FC = () => {
  const { submissions, clusters, setFilteredProjects, filteredProjectIds } = useDataStore();
  const [filters, setFilters] = useState<FilterState>({
    tags: new Set(),
    categories: new Set(),
    clusters: new Set()
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tags']));

  // Extract unique tags and categories
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    submissions.forEach(s => s.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [submissions]);

  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    submissions.forEach(s => s.category_tags.forEach(c => catSet.add(c)));
    return Array.from(catSet).sort();
  }, [submissions]);

  const detailedClusters = useMemo(() => {
    return clusters.filter(c => c.cluster_level === 'Detailed').sort((a, b) => a.name.localeCompare(b.name));
  }, [clusters]);

  // Apply filters automatically when they change
  useEffect(() => {
    const hasFilters = filters.tags.size > 0 || filters.categories.size > 0 || filters.clusters.size > 0;
    
    if (!hasFilters) {
      setFilteredProjects(null);
      return;
    }

    const filteredIds = new Set<number>();
    
    submissions.forEach(submission => {
      let passesFilter = true;

      // Check tags
      if (filters.tags.size > 0) {
        const hasTag = submission.tags.some(t => filters.tags.has(t));
        if (!hasTag) passesFilter = false;
      }

      // Check categories
      if (filters.categories.size > 0) {
        const hasCategory = submission.category_tags.some(c => filters.categories.has(c));
        if (!hasCategory) passesFilter = false;
      }

      // Check clusters
      if (filters.clusters.size > 0) {
        const inCluster = filters.clusters.has(submission.detailed_hierarchical_label);
        if (!inCluster) passesFilter = false;
      }

      if (passesFilter) {
        filteredIds.add(submission.data_point_id);
      }
    });

    setFilteredProjects(filteredIds);
  }, [filters, submissions, setFilteredProjects]);

  // Toggle filter
  const toggleFilter = (type: keyof FilterState, value: string | number) => {
    const newFilters = { ...filters };
    const filterSet = new Set([...newFilters[type]]) as Set<any>;
    
    if (filterSet.has(value)) {
      filterSet.delete(value);
    } else {
      filterSet.add(value);
    }
    
    newFilters[type] = filterSet as any;
    setFilters(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      tags: new Set(),
      categories: new Set(),
      clusters: new Set()
    });
    setFilteredProjects(null);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const activeFilterCount = filters.tags.size + filters.categories.size + filters.clusters.size;

  return (
    <div className="p-4 border-b border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-2">
        {/* Tags Section */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('tags')}
            className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <span className="text-sm text-white">Tags ({filters.tags.size})</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('tags') ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {expandedSections.has('tags') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-2 max-h-32 overflow-y-auto">
                  {availableTags.slice(0, 20).map(tag => (
                    <label key={tag} className="flex items-center gap-2 p-1 hover:bg-gray-800/30 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.tags.has(tag)}
                        onChange={() => toggleFilter('tags', tag)}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-xs text-gray-300 truncate">{tag}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Section */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <span className="text-sm text-white">Categories ({filters.categories.size})</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('categories') ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {expandedSections.has('categories') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-2 max-h-32 overflow-y-auto">
                  {availableCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 p-1 hover:bg-gray-800/30 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories.has(cat)}
                        onChange={() => toggleFilter('categories', cat)}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-0"
                      />
                      <span className="text-xs text-gray-300 truncate">{cat}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clusters Section */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('clusters')}
            className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <span className="text-sm text-white">Clusters ({filters.clusters.size})</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('clusters') ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {expandedSections.has('clusters') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-2 max-h-32 overflow-y-auto">
                  {detailedClusters.slice(0, 15).map(cluster => (
                    <label key={cluster.cluster_id} className="flex items-center gap-2 p-1 hover:bg-gray-800/30 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.clusters.has(cluster.cluster_label)}
                        onChange={() => toggleFilter('clusters', cluster.cluster_label)}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-0"
                      />
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cluster.color }}
                      />
                      <span className="text-xs text-gray-300 truncate">{cluster.name}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};