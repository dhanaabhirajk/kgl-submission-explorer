import { useEffect, useState } from 'react';
import { useDataStore } from './store/useDataStore';
import { ScatterPlot } from './components/ScatterPlot/ScatterPlot';
import { DetailPanel } from './components/DetailPanel/DetailPanel';
import { SimilarityPanel } from './components/Sidebar/SimilarityPanel';
import { SearchBar } from './components/Sidebar/SearchBar';
import { FilterPanel } from './components/Sidebar/FilterPanel';
import { ClusterLegend } from './components/Legend/ClusterLegend';
import { SelectionIndicator } from './components/SelectionIndicator/SelectionIndicator';

function App() {
  const { loadData, isLoading, error, hoveredProjectId, selectedProjectId, setSelectedProjectId, getProjectById } = useDataStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth - 300, // Subtract sidebar width
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
    <div className="flex h-screen bg-canvas-bg overflow-hidden">
      {/* Sidebar */}
      <div className="w-[300px] bg-sidebar-bg border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Hackathon Explorer</h1>
          <p className="text-sm text-gray-400 mt-1">811 AI Projects</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          <SearchBar />
          <FilterPanel />
          <SimilarityPanel />
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ScatterPlot width={dimensions.width} height={dimensions.height} />
        
        {/* Cluster Legend */}
        <ClusterLegend />
        
        {/* Selection Indicator */}
        <SelectionIndicator />
        
        {/* Detail Panel */}
        <DetailPanel
          project={selectedProject}
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
      </div>
    </div>
  );
}

export default App;