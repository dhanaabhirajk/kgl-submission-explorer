import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { searchService } from '../../services/searchService';
import { motion, AnimatePresence } from 'framer-motion';
import type { Submission } from '../../types';

export const SearchBar: React.FC = () => {
  const { submissions, setSelectedProjectId } = useDataStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ item: Submission; score: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());

  // Initialize search service when submissions load
  useEffect(() => {
    if (submissions.length > 0) {
      searchService.initialize(submissions);
    }
  }, [submissions]);

  // Perform search
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      setHighlightedIds(new Set());
      return;
    }

    setIsSearching(true);
    const searchResults = searchService.search(searchQuery);
    setResults(searchResults.slice(0, 10)); // Show top 10 results
    
    // Highlight results on the plot
    const ids = new Set(searchResults.map(r => r.item.data_point_id));
    setHighlightedIds(ids);
    
    // Update visual highlighting
    updatePlotHighlights(ids);
    
    setIsSearching(false);
  }, []);

  // Update plot highlights
  const updatePlotHighlights = (ids: Set<number>) => {
    const circles = document.querySelectorAll('circle');
    circles.forEach((circle) => {
      const dataId = parseInt(circle.getAttribute('data-id') || '0');
      if (ids.size === 0) {
        circle.setAttribute('opacity', '0.7');
      } else if (ids.has(dataId)) {
        circle.setAttribute('opacity', '1');
        circle.setAttribute('stroke', '#60a5fa');
        circle.setAttribute('stroke-width', '2');
      } else {
        circle.setAttribute('opacity', '0.2');
      }
    });
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHighlightedIds(new Set());
    updatePlotHighlights(new Set());
  };

  return (
    <div className="p-4 border-b border-gray-800">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 max-h-64 overflow-y-auto"
          >
            <div className="text-xs text-gray-400 mb-2">
              Found {highlightedIds.size} results
            </div>
            
            {results.map((result, index) => (
              <motion.button
                key={result.item.data_point_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  setSelectedProjectId(result.item.data_point_id);
                  clearSearch();
                }}
                className="w-full text-left p-2 hover:bg-gray-800 rounded transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {result.item.title}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {result.item.subtitle}
                    </div>
                  </div>
                  {result.score !== undefined && (
                    <div className="text-xs text-gray-600">
                      {((1 - result.score) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Search Hints */}
      {!query && (
        <div className="mt-3 text-xs text-gray-500">
          Try: "voice", "AI", "elevenlabs", "gaming"
        </div>
      )}
    </div>
  );
};