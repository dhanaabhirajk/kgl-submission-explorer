import React from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart3, Info } from 'lucide-react';

interface SidebarTabsProps {
  activeTab: 'summary' | 'explore' | 'statistics';
  onTabChange: (tab: 'summary' | 'explore' | 'statistics') => void;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-800">
      <button
        onClick={() => onTabChange('summary')}
        className={`flex-1 px-4 py-3 relative flex items-center justify-center gap-2 transition-colors ${
          activeTab === 'summary' 
            ? 'text-white bg-gray-800/30' 
            : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
        }`}
      >
        <Info className="w-4 h-4" />
        <span className="text-sm font-medium">Summary</span>
        {activeTab === 'summary' && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            initial={false}
          />
        )}
      </button>
      
      <button
        onClick={() => onTabChange('explore')}
        className={`flex-1 px-4 py-3 relative flex items-center justify-center gap-2 transition-colors ${
          activeTab === 'explore' 
            ? 'text-white bg-gray-800/30' 
            : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
        }`}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm font-medium">Explore</span>
        {activeTab === 'explore' && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            initial={false}
          />
        )}
      </button>
      
      <button
        onClick={() => onTabChange('statistics')}
        className={`flex-1 px-4 py-3 relative flex items-center justify-center gap-2 transition-colors ${
          activeTab === 'statistics' 
            ? 'text-white bg-gray-800/30' 
            : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span className="text-sm font-medium">Statistics</span>
        {activeTab === 'statistics' && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            initial={false}
          />
        )}
      </button>
    </div>
  );
};