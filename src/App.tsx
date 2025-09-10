import { useEffect, useState } from 'react';
import { useDataStore } from './store/useDataStore';
import { ScatterPlot } from './components/ScatterPlot/ScatterPlot';
import { TerrainScatterPlot } from './components/TerrainScatterPlot/TerrainScatterPlot';
import { VisualizationControls } from './components/VisualizationControls/VisualizationControls';
import { SimpleTerrainControls } from './components/VisualizationControls/SimpleTerrainControls';
import { DetailPanel } from './components/DetailPanel/DetailPanel';
import { SimilarityPanel } from './components/Sidebar/SimilarityPanel';
import { SearchBar } from './components/Sidebar/SearchBar';
import { FilterPanel } from './components/Sidebar/FilterPanel';
import { StatsPanel } from './components/Sidebar/StatsPanel';
import { SidebarTabs } from './components/Sidebar/SidebarTabs';
import { ClusterLegend } from './components/Legend/ClusterLegend';
import { SelectionIndicator } from './components/SelectionIndicator/SelectionIndicator';
import { motion } from 'framer-motion';
import { Layers, Mountain, Building } from 'lucide-react';

function App() {
  const { loadData, isLoading, error, hoveredProjectId, selectedProjectId, setSelectedProjectId, getProjectById, uniqueProjectIds } = useDataStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'statistics'>('explore');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'scatter' | 'terrain'>('terrain');
  const [showBackgroundImage, setShowBackgroundImage] = useState(true);  // Default to true for terrain
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('/data/banana_background.jpeg');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.45);  // Higher default opacity
  const [isClusterLegendCollapsed, setIsClusterLegendCollapsed] = useState(false);
  const [showTerrainHint, setShowTerrainHint] = useState(true);
  const [isDevelopmentMode] = useState(() => {
    // Check URL params or localStorage for dev mode
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('dev') === 'true' || localStorage.getItem('devMode') === 'true';
  });
  const [terrainSettings, setTerrainSettings] = useState({
    oceanThreshold: 0.01,  // 1.00% from screenshot
    shallowWaterThreshold: 0.05,  // 5.00% from screenshot
    beachThreshold: 0.20,  // 20.00% from screenshot
    desertThreshold: 0.09,  // 9% from screenshot
    forestThreshold: 0.35,  // 35% from screenshot
    mountainThreshold: 0.85,  // 85% from screenshot
    contourOpacity: 0.3,
    pointSize: 3,
    labelOpacity: 0.8,
    terrainStyle: 'island',
    showSettlements: true,
    settlementOpacity: 1.0,  // 100% from screenshot
    settlementStyle: 'surface',  // Surface selected in screenshot
    houseThreshold: 0.23,  // 23% from screenshot
    villageThreshold: 0.35,  // 35% from screenshot
    cityThreshold: 0.72,  // 72% from screenshot
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle window resize and mobile detection
  useEffect(() => {
    const updateDimensions = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Use consistent sidebar width to prevent KDE recomputation on tab switch
      // Always use the max width (450px) to keep canvas dimensions stable
      const sidebarWidth = mobile ? 0 : 450;
      setDimensions({
        width: window.innerWidth - sidebarWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []); // Remove activeTab dependency to prevent dimension changes on tab switch

  // Get hovered and selected project details
  const hoveredProject = hoveredProjectId ? getProjectById(hoveredProjectId) : null;
  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : null;
  const [hoveredPosition, setHoveredPosition] = useState<{x: number, y: number} | null>(null);

  // Handle project selection
  useEffect(() => {
    if (selectedProjectId) {
      setIsDetailOpen(true);
    } else {
      setIsDetailOpen(false);
    }
  }, [selectedProjectId]);

  // Update tooltip position
  useEffect(() => {
    if (!hoveredProjectId) {
      setHoveredPosition(null);
      return;
    }
    
    const updatePosition = () => {
      const pos = (window as any).hoveredPosition;
      if (pos) {
        setHoveredPosition(pos);
      }
    };
    
    updatePosition();
    const interval = setInterval(updatePosition, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [hoveredProjectId]);

  // Sync image overlay with view mode and terrain style
  useEffect(() => {
    // Auto-enable image overlay when switching to terrain mode
    if (viewMode === 'terrain') {
      setShowBackgroundImage(true);
    }
  }, [viewMode, terrainSettings.terrainStyle]);

  // Hide terrain hint after 15 seconds
  useEffect(() => {
    if (showTerrainHint && viewMode === 'terrain') {
      const timer = setTimeout(() => {
        setShowTerrainHint(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showTerrainHint, viewMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas-bg text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading hackathon submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas-bg text-red-400">
        <div className="text-center">
          <p className="text-xl mb-2">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas-bg overflow-hidden relative">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-sidebar-bg border border-gray-700 rounded-lg md:hidden"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}

      {/* Sidebar with animated width and mobile overlay */}
      <motion.div 
        className={`${isMobile ? 'fixed inset-y-0 left-0 z-40' : ''} bg-sidebar-bg border-r border-gray-800 flex flex-col`}
        initial={false}
        animate={{ 
          width: isMobile ? (isMobileSidebarOpen ? '85%' : 0) : (activeTab === 'statistics' ? 450 : 300),
          opacity: isMobile ? (isMobileSidebarOpen ? 1 : 0) : 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ 
          pointerEvents: isMobile && !isMobileSidebarOpen ? 'none' : 'auto',
          maxWidth: isMobile ? '320px' : 'none'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg md:text-xl font-bold text-white">Hackathon Explorer</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">811 AI Projects</p>
        </div>

        {/* Tab Navigation */}
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Sidebar Content */}
        {activeTab === 'explore' ? (
          <div className="flex-1 overflow-y-auto">
            <SearchBar />
            <FilterPanel />
            <SimilarityPanel />
          </div>
        ) : (
          <StatsPanel />
        )}
      </motion.div>

      {/* Mobile Overlay for closing sidebar */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Keep both components mounted but hidden to preserve cache */}
        <div style={{ display: viewMode === 'scatter' ? 'block' : 'none' }}>
          <ScatterPlot width={dimensions.width} height={dimensions.height} />
        </div>
        <div style={{ display: viewMode === 'terrain' ? 'block' : 'none' }}>
          <TerrainScatterPlot 
            width={dimensions.width} 
            height={dimensions.height}
            settings={terrainSettings}
            showBackgroundImage={showBackgroundImage}
            backgroundImageUrl={backgroundImageUrl}
            backgroundOpacity={backgroundOpacity}
            isDevelopmentMode={isDevelopmentMode}
          />
        </div>
        
        {/* View Mode Toggle with Map Style - positioned left of ClusterLegend */}
        <div className="absolute top-4 z-20" style={{ 
          right: `${(selectedProjectId ? 466 : 4) + (isClusterLegendCollapsed ? 64 : 316)}px`
        }}>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setViewMode('scatter')}
                className={`px-4 py-2.5 rounded-md flex items-center gap-2 transition-all font-medium ${
                  viewMode === 'scatter'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Points View"
              >
                <Layers className="w-4 h-4" />
                <span className="text-sm">Points</span>
              </button>
              <button
                onClick={() => setViewMode('terrain')}
                className={`px-4 py-2.5 rounded-md flex items-center gap-2 transition-all font-medium ${
                  viewMode === 'terrain'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Terrain View"
              >
                <Mountain className="w-4 h-4" />
                <span className="text-sm">Terrain</span>
              </button>
            </div>
            
            {/* Map Style Toggle - Only show in terrain mode */}
            {viewMode === 'terrain' && (
              <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setTerrainSettings({ ...terrainSettings, terrainStyle: 'island' })}
                  className={`px-3 py-2.5 rounded-md flex items-center gap-2 transition-all font-medium ${
                    terrainSettings.terrainStyle === 'island'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title="Island Style"
                >
                  <Mountain className="w-4 h-4" />
                  <span className="text-sm">Island</span>
                </button>
                <button
                  onClick={() => setTerrainSettings({ ...terrainSettings, terrainStyle: 'greyscale' })}
                  className={`px-3 py-2.5 rounded-md flex items-center gap-2 transition-all font-medium ${
                    terrainSettings.terrainStyle === 'greyscale'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title="Greyscale Style"
                >
                  <Building className="w-4 h-4" />
                  <span className="text-sm">Greyscale</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Visualization Controls - Show simple or detailed based on dev mode */}
        {isDevelopmentMode ? (
          <VisualizationControls
            viewMode={viewMode}
            terrainSettings={terrainSettings}
            onTerrainSettingsChange={setTerrainSettings}
            showBackgroundImage={showBackgroundImage}
            backgroundOpacity={backgroundOpacity}
            onBackgroundToggle={setShowBackgroundImage}
            onBackgroundOpacityChange={setBackgroundOpacity}
          />
        ) : (
          <SimpleTerrainControls
            viewMode={viewMode}
            terrainStyle={terrainSettings.terrainStyle}
            showBackgroundImage={showBackgroundImage}
            backgroundOpacity={backgroundOpacity}
            onTerrainStyleChange={(style) => setTerrainSettings({ ...terrainSettings, terrainStyle: style })}
            onBackgroundToggle={setShowBackgroundImage}
            onBackgroundOpacityChange={setBackgroundOpacity}
            isClusterLegendCollapsed={isClusterLegendCollapsed}
            isDetailPanelOpen={!!selectedProjectId}
          />
        )}
        
        {/* Cluster Legend */}
        <ClusterLegend onCollapsedChange={setIsClusterLegendCollapsed} />
        
        {/* Selection Indicator */}
        <SelectionIndicator />
        
        {/* Unique Projects Indicator */}
        {uniqueProjectIds && uniqueProjectIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-purple-600/20 border border-purple-600/50 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-purple-300">
                Viewing {uniqueProjectIds.size} Most Unique Projects
              </span>
            </div>
          </motion.div>
        )}
        
        {/* Terrain View Hint (absolute, centered over visible canvas area) */}
        {showTerrainHint && viewMode === 'terrain' && !uniqueProjectIds?.size && (
          (() => {
            const overlayRightPx = (isClusterLegendCollapsed ? 64 : 316) + (selectedProjectId ? 466 : 0);
            return (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl z-50"
                style={{ left: `calc(50% - ${overlayRightPx / 2}px)` }}
              >
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">
                Wonder what this island is doing here?
              </span>
              <button
                onClick={() => setViewMode('scatter')}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Switch to "Points" for a clean view
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
              </motion.div>
            );
          })()
        )}
        
        {/* Detail Panel */}
        <DetailPanel
          project={selectedProject || null}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedProjectId(null);
          }}
          onFindSimilar={(projectId) => {
            setSelectedProjectId(projectId);
          }}
        />
        
        {/* Hover Tooltip - show even when detail panel is open */}
        {hoveredProject && hoveredPosition && hoveredProjectId !== selectedProjectId && (
          <div 
            className="absolute bg-gray-900 border border-gray-700 rounded-lg overflow-hidden max-w-md pointer-events-none shadow-2xl z-50"
            style={{
              left: `${hoveredPosition.x + 15}px`,
              top: `${hoveredPosition.y - 100}px`,
              transform: hoveredPosition.x > dimensions.width - 400 ? 'translateX(-100%)' : 'none'
            }}>
            {hoveredProject.hero_image_url && (
              <div className="w-full h-48 bg-gray-800">
                <img 
                  src={hoveredProject.hero_image_url} 
                  alt={hoveredProject.title}
                  className="w-full h-full object-cover"
                  style={{ maxWidth: '400px' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-white font-semibold mb-1 line-clamp-2">
                {hoveredProject.title}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-2">
                {hoveredProject.subtitle}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {hoveredProject.tags.slice(0, 3).map((tag, i) => (
                  <span 
                    key={i}
                    className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {hoveredProject.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{hoveredProject.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn badge (icon-only, hidden on mobile) */}
        <a
          href="https://www.linkedin.com/in/serjoscha-d%C3%BCring-920644173"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block fixed bottom-4 right-4 z-20"
          aria-label="Open LinkedIn profile"
          title="LinkedIn"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900/70 border border-gray-700 text-gray-300 hover:text-white hover:border-[#0A66C2] shadow-lg backdrop-blur">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-4 h-4">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.025-3.036-1.849-3.036-1.85 0-2.132 1.445-2.132 2.939v5.666H9.358V9h3.414v1.561h.049c.476-.9 1.637-1.849 3.369-1.849 3.602 0 4.268 2.371 4.268 5.455v6.285zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span className="sr-only">LinkedIn</span>
          </span>
        </a>
      </div>
    </div>
  );
}

export default App;