import React from 'react';
import type { TerrainSettings } from '../../services/terrainGenerator';
import { ChevronDown, ChevronUp, Sliders, Trees, Building, Home, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualizationControlsProps {
  viewMode: 'scatter' | 'terrain';
  showBackgroundImage?: boolean;
  backgroundOpacity?: number;
  onBackgroundToggle?: (show: boolean) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
  terrainSettings: TerrainSettings;
  onTerrainSettingsChange: (settings: TerrainSettings) => void;
}

export const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  viewMode,
  showBackgroundImage = false,
  backgroundOpacity = 0.3,
  onBackgroundToggle,
  onBackgroundOpacityChange,
  terrainSettings,
  onTerrainSettingsChange,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (viewMode === 'scatter') return null;

  const handleSliderChange = (key: keyof TerrainSettings, value: TerrainSettings[keyof TerrainSettings]) => {
    onTerrainSettingsChange({
      ...terrainSettings,
      [key]: value,
    });
  };

  const handleStyleChange = (style: 'natural' | 'urban') => {
    onTerrainSettingsChange({
      ...terrainSettings,
      terrainStyle: style === 'urban' ? 'greyscale' : 'island',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 right-4 z-20 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg overflow-hidden"
      style={{ width: '320px' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          <span className="text-sm font-medium">Terrain Settings</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-gray-800">
              {/* Terrain Style Toggle */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Terrain Style
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStyleChange('natural')}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs ${
                      (!terrainSettings.terrainStyle || terrainSettings.terrainStyle === 'island')
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Trees className="w-4 h-4" />
                    Natural
                  </button>
                  <button
                    onClick={() => handleStyleChange('urban')}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs ${
                      terrainSettings.terrainStyle === 'greyscale'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Urban
                  </button>
                </div>
              </div>

              {/* Biome Thresholds - Only for Natural Style */}
              {(!terrainSettings.terrainStyle || terrainSettings.terrainStyle === 'island') && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Biome Thresholds
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Ocean → Shallow Water</label>
                        <span className="text-xs text-gray-500">
                          {(terrainSettings.oceanThreshold * 100).toFixed(2)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0001"
                        max="0.01"
                        step="0.0001"
                        value={terrainSettings.oceanThreshold}
                        onChange={(e) => handleSliderChange('oceanThreshold', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Shallow Water → Beach</label>
                        <span className="text-xs text-gray-500">
                          {((terrainSettings.shallowWaterThreshold || terrainSettings.oceanThreshold * 5) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="0.05"
                        step="0.001"
                        value={terrainSettings.shallowWaterThreshold || terrainSettings.oceanThreshold * 5}
                        onChange={(e) => handleSliderChange('shallowWaterThreshold', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Beach → Desert</label>
                        <span className="text-xs text-gray-500">
                          {((terrainSettings.beachThreshold || terrainSettings.oceanThreshold * 20) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.1"
                        step="0.001"
                        value={terrainSettings.beachThreshold || terrainSettings.oceanThreshold * 20}
                        onChange={(e) => handleSliderChange('beachThreshold', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Desert → Grassland</label>
                        <span className="text-xs text-gray-500">
                          {(terrainSettings.desertThreshold * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.25"
                        step="0.01"
                        value={terrainSettings.desertThreshold}
                        onChange={(e) => handleSliderChange('desertThreshold', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Grassland → Forest</label>
                        <span className="text-xs text-gray-500">
                          {(terrainSettings.forestThreshold * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.25"
                        max="0.5"
                        step="0.01"
                        value={terrainSettings.forestThreshold}
                        onChange={(e) => handleSliderChange('forestThreshold', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Hills → Mountains</label>
                        <span className="text-xs text-gray-500">
                          {(terrainSettings.mountainThreshold * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="0.85"
                        step="0.01"
                        value={terrainSettings.mountainThreshold}
                        onChange={(e) => handleSliderChange('mountainThreshold', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Settlement Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Settlement Display
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-300">Show Settlements</label>
                      <input
                        type="checkbox"
                        checked={terrainSettings.showSettlements ?? true}
                        onChange={(e) => handleSliderChange('showSettlements', e.target.checked)}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {(terrainSettings.showSettlements ?? true) && (
                    <>
                      {/* Settlement Style Toggle */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleSliderChange('settlementStyle', 'points')}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs ${
                            (!terrainSettings.settlementStyle || terrainSettings.settlementStyle === 'points')
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                          Points
                        </button>
                        <button
                          onClick={() => handleSliderChange('settlementStyle', 'surface')}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs ${
                            terrainSettings.settlementStyle === 'surface'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Home className="w-4 h-4" />
                          Surface
                        </button>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-gray-300">Settlement Opacity</label>
                          <span className="text-xs text-gray-500">
                            {Math.round((terrainSettings.settlementOpacity ?? 0.7) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={terrainSettings.settlementOpacity ?? 0.7}
                          onChange={(e) => handleSliderChange('settlementOpacity', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      
                      {/* Settlement Thresholds for Surface Mode */}
                      {terrainSettings.settlementStyle === 'surface' && (
                        <>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs text-gray-300">House Threshold</label>
                              <span className="text-xs text-gray-500">
                                {Math.round((terrainSettings.houseThreshold ?? 0.1) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.01"
                              max="0.3"
                              step="0.01"
                              value={terrainSettings.houseThreshold ?? 0.1}
                              onChange={(e) => handleSliderChange('houseThreshold', parseFloat(e.target.value))}
                              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs text-gray-300">Village Threshold</label>
                              <span className="text-xs text-gray-500">
                                {Math.round((terrainSettings.villageThreshold ?? 0.3) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="0.5"
                              step="0.01"
                              value={terrainSettings.villageThreshold ?? 0.3}
                              onChange={(e) => handleSliderChange('villageThreshold', parseFloat(e.target.value))}
                              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs text-gray-300">City Threshold</label>
                              <span className="text-xs text-gray-500">
                                {Math.round((terrainSettings.cityThreshold ?? 0.6) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.3"
                              max="0.9"
                              step="0.01"
                              value={terrainSettings.cityThreshold ?? 0.6}
                              onChange={(e) => handleSliderChange('cityThreshold', parseFloat(e.target.value))}
                              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* AI-Enhanced Image Overlay Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  AI-Enhanced Overlay
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-300">Show AI Image</label>
                      <input
                        type="checkbox"
                        checked={showBackgroundImage}
                        onChange={(e) => onBackgroundToggle?.(e.target.checked)}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {showBackgroundImage && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-300">Overlay Opacity</label>
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
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        AI-enhanced version overlaid on terrain
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Visual Settings
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-300">Contour Lines</label>
                      <span className="text-xs text-gray-500">
                        {Math.round((terrainSettings.contourOpacity ?? 0.3) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={terrainSettings.contourOpacity ?? 0.3}
                      onChange={(e) => handleSliderChange('contourOpacity', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-300">Point Size</label>
                      <span className="text-xs text-gray-500">
                        {(terrainSettings.pointSize ?? 3)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={terrainSettings.pointSize ?? 3}
                      onChange={(e) => handleSliderChange('pointSize', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-300">Label Visibility</label>
                      <span className="text-xs text-gray-500">
                        {Math.round((terrainSettings.labelOpacity ?? 0.8) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={terrainSettings.labelOpacity ?? 0.8}
                      onChange={(e) => handleSliderChange('labelOpacity', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    // Apply current settings
                    onTerrainSettingsChange({...terrainSettings});
                  }}
                  className="w-full px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                >
                  Apply Changes
                </button>
                
                <button
                  onClick={() => {
                    // Reset to defaults (from screenshot)
                    onTerrainSettingsChange({
                      oceanThreshold: 0.01,
                      shallowWaterThreshold: 0.05,
                      beachThreshold: 0.20,
                      desertThreshold: 0.09,
                      forestThreshold: 0.35,
                      mountainThreshold: 0.85,
                      contourOpacity: 0.3,
                      pointSize: 3,
                      labelOpacity: 0.8,
                      terrainStyle: 'island',
                      showSettlements: true,
                      settlementOpacity: 1.0,
                      settlementStyle: 'surface',
                      houseThreshold: 0.23,
                      villageThreshold: 0.35,
                      cityThreshold: 0.72,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};