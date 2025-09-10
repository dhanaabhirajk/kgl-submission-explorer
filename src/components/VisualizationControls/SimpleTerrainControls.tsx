import React from 'react';
import { Image } from 'lucide-react';
import { motion } from 'framer-motion';

interface SimpleTerrainControlsProps {
  viewMode: 'scatter' | 'terrain';
  terrainStyle?: 'island' | 'greyscale';
  showBackgroundImage?: boolean;
  backgroundOpacity?: number;
  onTerrainStyleChange?: (style: 'island' | 'greyscale') => void;
  onBackgroundToggle?: (show: boolean) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
  isClusterLegendCollapsed?: boolean;
  isDetailPanelOpen?: boolean;
}

export const SimpleTerrainControls: React.FC<SimpleTerrainControlsProps> = ({
  viewMode,
  terrainStyle = 'island',
  showBackgroundImage = false,
  backgroundOpacity = 0.3,
  onTerrainStyleChange,
  onBackgroundToggle,
  onBackgroundOpacityChange,
  isClusterLegendCollapsed = false,
  isDetailPanelOpen = false,
}) => {
  if (viewMode === 'scatter') return null;
  
  // Only show image overlay controls in island mode
  if (terrainStyle !== 'island') return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-16 z-20 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-4"
      style={{ 
        width: '240px', 
        right: `${(isDetailPanelOpen ? 466 : 4) + (isClusterLegendCollapsed ? 64 : 316)}px` 
      }}
    >
      {/* Image Overlay Toggle and Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Image Overlay</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showBackgroundImage}
              onChange={(e) => onBackgroundToggle?.(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Opacity Slider */}
        {showBackgroundImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400">Opacity</label>
              <span className="text-xs text-gray-500">
                {Math.round(backgroundOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={backgroundOpacity}
              onChange={(e) => onBackgroundOpacityChange?.(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${backgroundOpacity * 100}%, #374151 ${backgroundOpacity * 100}%, #374151 100%)`
              }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};