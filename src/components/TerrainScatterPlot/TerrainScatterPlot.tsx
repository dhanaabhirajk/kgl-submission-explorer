import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useDataStore } from '../../store/useDataStore';
import { terrainGenerator, type TerrainSettings } from '../../services/terrainGenerator';
import type { Submission } from '../../types';
import { throttleRAF, screenToData, isPointVisible, getDataSpaceRadius } from '../../utils/proximity';

interface TerrainScatterPlotProps {
  width: number;
  height: number;
  settings?: TerrainSettings;
  showBackgroundImage?: boolean;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  isDevelopmentMode?: boolean;
}

export const TerrainScatterPlot: React.FC<TerrainScatterPlotProps> = ({ 
  width, 
  height, 
  settings,
  showBackgroundImage = false,
  backgroundImageUrl,
  backgroundOpacity = 0.3,
  isDevelopmentMode = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);
  const quadtreeRef = useRef<d3.Quadtree<Submission> | null>(null);
  const proximityLineRef = useRef<d3.Selection<SVGLineElement, unknown, null, undefined> | null>(null);
  const throttledMouseMoveRef = useRef<ReturnType<typeof throttleRAF> | null>(null);
  
  // State to trigger re-render when overlay image loads
  const [overlayImageLoaded, setOverlayImageLoaded] = React.useState<number>(0);
  
  const { 
    submissions, 
    clusters,
    densityGrid: cachedDensityGrid,
    selectedProjectId,
    selectedClusterId,
    filteredProjectIds,
    uniqueProjectIds,
    setSelectedProject,
    setSelectedCluster,
    setHoveredProject,
    getSimilarProjects,
    getClusterById,
    getTerrainCache,
    setTerrainCache
  } = useDataStore();

  // Calculate scales and bounding box
  const padding = 50;
  const scales = useMemo(() => {
    if (submissions.length === 0) return null;
    
    const xExtent = d3.extent(submissions, d => d.umap_dim_1) as [number, number];
    const yExtent = d3.extent(submissions, d => d.umap_dim_2) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);
    
    // Calculate bounding box for the data
    const bbox = {
      left: padding,
      top: padding,
      width: width - 2 * padding,
      height: height - 2 * padding
    };
      
    return { xScale, yScale, bbox };
  }, [submissions, width, height]);

  // Use cached density grid or compute new one if dimensions changed
  const densityGrid = useMemo(() => {
    if (submissions.length === 0) return null;
    
    // Use cached grid if available and dimensions haven't changed significantly
    if (cachedDensityGrid && 
        Math.abs(width - 1200) < 200 && 
        Math.abs(height - 800) < 200) {
      return cachedDensityGrid;
    }
    
    // Otherwise compute new grid
    const grid = terrainGenerator.calculateDensityGrid(submissions, width, height);
    return terrainGenerator.smoothDensityGrid(grid, 3);
  }, [submissions, cachedDensityGrid, width, height]);

  // Calculate settlements using two-level density (pre-calculate for both modes to cache)
  const settlements = useMemo(() => {
    if (submissions.length === 0) return [];
    // Always calculate to ensure caching, but only render in island mode
    return terrainGenerator.calculateSettlements(submissions, width, height);
  }, [submissions, width, height]); // Removed terrainStyle dependency for better caching

  // Calculate settlement density grid for surface visualization
  const settlementGrid = useMemo(() => {
    if (submissions.length === 0 || settings?.settlementStyle !== 'surface') return null;
    // Always calculate when surface style is selected to ensure caching
    return terrainGenerator.calculateSettlementDensityGrid(submissions, width, height);
  }, [submissions, width, height, settings?.settlementStyle]); // Removed terrainStyle dependency

  // Create color map for points
  const pointColorMap = useMemo(() => {
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    const colorMap = new Map<number, string>();
    detailedClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        colorMap.set(memberId, cluster.color);
      });
    });
    return colorMap;
  }, [clusters]);

  // Render terrain to offscreen canvas with settings
  const terrainImageData = useMemo((): ImageData | { imageData: ImageData; needsCache: boolean } | null => {
    if (!densityGrid) return null;
    
    // Check cache first
    const cache = getTerrainCache();
    if (cache.imageData && cache.settings && 
        JSON.stringify(cache.settings) === JSON.stringify(settings) &&
        cache.imageData.width === width &&
        cache.imageData.height === height) {
      return cache.imageData;
    }
    
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return null;
    
    const { cellSize, values } = densityGrid;
    
    // Draw terrain cells with custom settings
    for (let row = 0; row < densityGrid.height; row++) {
      for (let col = 0; col < densityGrid.width; col++) {
        const density = values[row][col];
        const x = col * cellSize;
        const y = row * cellSize;
        
        // Base color from biome using settings
        const biome = terrainGenerator.getBiome(density, settings);
        ctx.fillStyle = biome.color;
        ctx.fillRect(x, y, cellSize + 1, cellSize + 1); // +1 to avoid gaps
        
        // Add shadow for 3D effect
        const shadow = terrainGenerator.calculateShadow(densityGrid, row, col);
        if (shadow > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${shadow * 0.3})`;
          ctx.fillRect(x, y, cellSize + 1, cellSize + 1);
        }
        
        // Add highlight for peaks
        if (density > 0.85) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(density - 0.85) * 2})`;
          ctx.fillRect(x, y, cellSize + 1, cellSize + 1);
        }
      }
    }
    
    // Apply smoothing
    ctx.filter = 'blur(2px)';
    ctx.drawImage(offscreenCanvas, 0, 0);
    ctx.filter = 'none';
    
    // Overlay settlement surfaces if enabled (only in island mode)
    if (settings?.terrainStyle === 'island' && settings?.showSettlements !== false && settings?.settlementStyle === 'surface' && settlementGrid) {
      const settlementOpacity = settings?.settlementOpacity ?? 0.7;
      
      for (let row = 0; row < settlementGrid.height; row++) {
        for (let col = 0; col < settlementGrid.width; col++) {
          const settlementDensity = settlementGrid.values[row][col];
          const settlement = terrainGenerator.getSettlementType(settlementDensity, settings);
          
          if (settlement) {
            const x = col * settlementGrid.cellSize;
            const y = row * settlementGrid.cellSize;
            
            // Draw settlement overlay with transparency
            ctx.globalAlpha = settlementOpacity;
            ctx.fillStyle = settlement.color;
            ctx.fillRect(x, y, settlementGrid.cellSize + 1, settlementGrid.cellSize + 1);
            ctx.globalAlpha = 1;
          }
        }
      }
      
      // Smooth the settlement overlay
      ctx.filter = 'blur(1px)';
      ctx.drawImage(offscreenCanvas, 0, 0);
      ctx.filter = 'none';
    }
    
    // Get the ImageData - will be cached in useEffect
    const imageData = ctx.getImageData(0, 0, width, height);
    // Return object so we can cache, but downstream code guards for both
    return { imageData, needsCache: true };
  }, [densityGrid, settlementGrid, width, height, settings, getTerrainCache]);

  // Cache terrain data when it changes
  useEffect(() => {
    if (!terrainImageData) return;
    const needsCache = (terrainImageData as any).needsCache as boolean | undefined;
    if (needsCache) {
      const img = (terrainImageData as any).imageData as ImageData;
      setTerrainCache(img, settings);
    }
  }, [terrainImageData, settings, setTerrainCache]);

  // Export terrain as separate map and legend images
  const exportTerrainImage = useCallback((includeSettlementDots = false) => {
    if (!terrainImageData) return;
    
    // Handle both old and new terrainImageData structure
    const imageData: ImageData = (terrainImageData as any).imageData || (terrainImageData as ImageData);
    
    // 1. Create MAP canvas (exact proportions preserved)
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = width;
    mapCanvas.height = height;
    const mapCtx = mapCanvas.getContext('2d');
    if (!mapCtx) return;
    
    // 2. Create LEGEND canvas (separate)
    const legendCanvas = document.createElement('canvas');
    const legendHeight = 320;
    legendCanvas.width = width;
    legendCanvas.height = legendHeight;
    const legendCtx = legendCanvas.getContext('2d');
    if (!legendCtx) return;
    
    // === DRAW MAP ===
    // Draw terrain to map canvas
    mapCtx.putImageData(imageData, 0, 0);
    
    // Draw AI overlay if enabled - match full canvas size (only in island mode)
    if (showBackgroundImage && overlayImageRef.current && settings?.terrainStyle === 'island') {
      mapCtx.globalAlpha = backgroundOpacity;
      mapCtx.drawImage(
        overlayImageRef.current,
        0,
        0,
        width,
        height
      );
      mapCtx.globalAlpha = 1;
    }
    
    // Optionally draw settlement dots on map
    if (includeSettlementDots && settings?.showSettlements !== false && settlements.length > 0) {
      settlements.forEach(settlement => {
        mapCtx.save();
        mapCtx.globalAlpha = 0.9;
        
        // Draw dot based on settlement type
        if (settlement.type === 'metropolis') {
          mapCtx.fillStyle = '#fff';
          mapCtx.strokeStyle = '#333';
          mapCtx.lineWidth = 2;
          mapCtx.beginPath();
          mapCtx.arc(settlement.x, settlement.y, 8, 0, Math.PI * 2);
          mapCtx.fill();
          mapCtx.stroke();
        } else if (settlement.type === 'city') {
          mapCtx.fillStyle = '#eee';
          mapCtx.strokeStyle = '#444';
          mapCtx.lineWidth = 1.5;
          mapCtx.beginPath();
          mapCtx.arc(settlement.x, settlement.y, 6, 0, Math.PI * 2);
          mapCtx.fill();
          mapCtx.stroke();
        } else if (settlement.type === 'town') {
          mapCtx.fillStyle = '#ddd';
          mapCtx.strokeStyle = '#555';
          mapCtx.lineWidth = 1;
          mapCtx.beginPath();
          mapCtx.arc(settlement.x, settlement.y, 4, 0, Math.PI * 2);
          mapCtx.fill();
          mapCtx.stroke();
        } else {
          mapCtx.fillStyle = '#ccc';
          mapCtx.strokeStyle = '#666';
          mapCtx.lineWidth = 0.5;
          mapCtx.beginPath();
          mapCtx.arc(settlement.x, settlement.y, 2.5, 0, Math.PI * 2);
          mapCtx.fill();
          mapCtx.stroke();
        }
        
        mapCtx.restore();
      });
    }
    
    // === DRAW LEGEND ===
    // Draw legend background
    legendCtx.fillStyle = 'rgba(30, 30, 30, 0.95)';
    legendCtx.fillRect(0, 0, width, legendHeight);
    
    // Draw biome legend
    const isUrban = settings?.terrainStyle === 'greyscale';
    const biomes = isUrban ? [
      { name: 'Ocean', color: '#0A0F1B' },
      { name: 'Shallow Water', color: '#2a3f52' },
      { name: 'Land', color: '#3d4a57' },
      { name: 'Village', color: '#4a5663' },
      { name: 'Town', color: '#5a6673' },
      { name: 'Outskirts', color: '#6a7683' },
      { name: 'City', color: '#7a8693' },
      { name: 'Downtown', color: '#8a96a3' },
      { name: 'Metropolis', color: '#9aa6b3' },
    ] : [
      { name: 'Ocean', color: '#0A0F1B' },
      { name: 'Shallow Water', color: '#2e5a8f' },
      { name: 'Beach', color: '#f4e4c1' },
      { name: 'Desert', color: '#e8d4a0' },
      { name: 'Savanna', color: '#c5b783' },
      { name: 'Grassland', color: '#8fb171' },
      { name: 'Forest', color: '#5a8a4c' },
      { name: 'Hills', color: '#7a9b76' },
      { name: 'Mountains', color: '#8b9391' },
      { name: 'Peaks', color: '#e8e8e8' },
    ];
    
    // Title
    legendCtx.fillStyle = '#fff';
    legendCtx.font = 'bold 22px sans-serif';
    legendCtx.fillText('Terrain Biomes', 30, 40);
    
    // Biome swatches in two rows
    const swatchSize = 24;
    const itemsPerRow = Math.ceil(biomes.length / 2);
    const horizontalSpacing = Math.floor((width - 60) / itemsPerRow);
    
    biomes.forEach((biome, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = 30 + col * horizontalSpacing;
      const y = 70 + row * 55; // Adjusted for legend canvas
      
      // Draw swatch
      legendCtx.fillStyle = biome.color;
      legendCtx.fillRect(x, y, swatchSize, swatchSize);
      
      // Draw border
      legendCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      legendCtx.lineWidth = 1;
      legendCtx.strokeRect(x, y, swatchSize, swatchSize);
      
      // Draw label
      legendCtx.fillStyle = '#fff';
      legendCtx.font = '16px sans-serif';
      legendCtx.fillText(biome.name, x + swatchSize + 10, y + 17);
    });
    
    // Settlement legend - ALWAYS show for settlements
    if (settings?.showSettlements !== false) {
      legendCtx.fillStyle = '#fff';
      legendCtx.font = 'bold 22px sans-serif';
      legendCtx.fillText('Settlement Density', 30, 200);
      
      const settlements = settings?.settlementStyle === 'surface' ? [
        { name: 'Houses', color: 'rgba(160, 82, 45, 0.7)' },
        { name: 'Villages', color: 'rgba(128, 128, 128, 0.8)' },
        { name: 'Cities', color: 'rgba(106, 90, 205, 0.9)' },
      ] : [
        { name: 'Villages', color: '#ccc' },
        { name: 'Towns', color: '#ddd' },
        { name: 'Cities', color: '#eee' },
        { name: 'Metropolis', color: '#fff' },
      ];
      
      const settlementSpacing = Math.floor((width - 60) / settlements.length);
      
      settlements.forEach((settlement, i) => {
        const x = 30 + i * settlementSpacing;
        const y = 235; // Adjusted for legend canvas
        
        // Draw swatch
        legendCtx.fillStyle = settlement.color;
        const settlementSwatchWidth = settings?.settlementStyle === 'surface' ? swatchSize * 2 : swatchSize;
        legendCtx.fillRect(x, y, settlementSwatchWidth, swatchSize);
        
        // Draw border
        legendCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        legendCtx.lineWidth = 1;
        legendCtx.strokeRect(x, y, settlementSwatchWidth, swatchSize);
        
        // Draw label
        legendCtx.fillStyle = '#fff';
        legendCtx.font = '16px sans-serif';
        legendCtx.fillText(settlement.name, x + settlementSwatchWidth + 10, y + 17);
      });
    }
    
    // Add metadata
    legendCtx.fillStyle = '#999';
    legendCtx.font = '14px sans-serif';
    const date = new Date().toLocaleDateString();
    legendCtx.fillText(`Generated on ${date} | Kaggle Submission Explorer`, width - 320, 295);
    
    // Download both images
    const timestamp = Date.now();
    
    // Download map image
    mapCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `terrain-map-${timestamp}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
    
    // Download legend image (with slight delay to avoid browser blocking)
    setTimeout(() => {
      legendCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `terrain-legend-${timestamp}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }, 100);
  }, [terrainImageData, width, height, settings, settlements, showBackgroundImage, backgroundOpacity, scales]);

  // Expose export function to parent
  useEffect(() => {
    (window as any).exportTerrainImage = exportTerrainImage;
    return () => {
      delete (window as any).exportTerrainImage;
    };
  }, [exportTerrainImage]);

  // Cache terrain to avoid recomputation and handle state update (handles both shapes)
  useEffect(() => {
    if (!terrainImageData) return;
    const data: any = terrainImageData as any;
    if (data && data.needsCache && data.imageData) {
      setTerrainCache(data.imageData as ImageData, settings);
    }
  }, [terrainImageData, settings, setTerrainCache]);

  // Load overlay image when URL changes
  useEffect(() => {
    if (showBackgroundImage && backgroundImageUrl && settings?.terrainStyle === 'island') {
      const img = new Image();
      img.onload = () => {
        overlayImageRef.current = img;
        // Trigger re-render by updating state
        setOverlayImageLoaded(Date.now());
      };
      img.src = backgroundImageUrl;
    } else {
      overlayImageRef.current = null;
      setOverlayImageLoaded(0);
    }
  }, [showBackgroundImage, backgroundImageUrl, settings?.terrainStyle]);

  // Render terrain with proper zoom/pan support
  useEffect(() => {
    if (!canvasRef.current || !terrainImageData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = width;
    canvas.height = height;
    
    // Create a temporary canvas from ImageData for drawImage and store in ref
    const tempCanvas: HTMLCanvasElement = document.createElement('canvas');
    const imageData: ImageData = (terrainImageData as any).imageData || (terrainImageData as ImageData);
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
    }
    tempCanvasRef.current = tempCanvas;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Apply current transform
      const transform = transformRef.current || d3.zoomIdentity;
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);
      
      // Draw terrain
      if (tempCanvasRef.current) {
        ctx.drawImage(tempCanvasRef.current as HTMLCanvasElement, 0, 0);
      }
      
      // Draw AI overlay on top if available - match terrain canvas size (only in island mode)
      if (showBackgroundImage && overlayImageRef.current && tempCanvasRef.current && settings?.terrainStyle === 'island') {
        ctx.globalAlpha = backgroundOpacity;
        // Draw the image to match the terrain canvas dimensions
        ctx.drawImage(
          overlayImageRef.current,
          0,
          0,
          tempCanvasRef.current.width,
          tempCanvasRef.current.height
        );
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    };
    
    render();
    
  }, [terrainImageData, width, height, showBackgroundImage, backgroundOpacity, overlayImageLoaded, settings?.terrainStyle]);

  // Set up SVG overlay with zoom and all interactions
  useEffect(() => {
    if (!svgRef.current || !densityGrid || !scales || submissions.length === 0) return;

    const currentTransform = transformRef.current;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const g = svg.append('g');
    const { xScale, yScale } = scales;

    // Build quadtree for efficient proximity searches
    const quadtree = d3.quadtree<Submission>()
      .x(d => xScale(d.umap_dim_1))
      .y(d => yScale(d.umap_dim_2))
      .addAll(submissions);
    
    quadtreeRef.current = quadtree;

    // Set up zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 8])
      .extent([[0, 0], [width, height]])
      .translateExtent([[-width, -height], [width * 2, height * 2]])
      .filter((event) => {
        // Allow all events except right-click
        return !event.ctrlKey && !event.button;
      })
      .on('zoom', (event) => {
        // Update both canvas and SVG transforms
        transformRef.current = event.transform;
        
        // Update SVG
        g.attr('transform', event.transform.toString());
        
        // Update canvas
        if (canvasRef.current && terrainImageData && tempCanvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(event.transform.x, event.transform.y);
            ctx.scale(event.transform.k, event.transform.k);
            
            // Draw terrain
            ctx.drawImage(tempCanvasRef.current, 0, 0);
            
            // Draw AI overlay on top if available - match terrain canvas size (only in island mode)
            if (showBackgroundImage && overlayImageRef.current && tempCanvasRef.current && settings?.terrainStyle === 'island') {
              ctx.globalAlpha = backgroundOpacity;
              // Draw the image to match the terrain canvas dimensions
              ctx.drawImage(
                overlayImageRef.current,
                0,
                0,
                tempCanvasRef.current.width,
                tempCanvasRef.current.height
              );
              ctx.globalAlpha = 1;
            }
            
            ctx.restore();
          }
        }
        
        const zoomLevel = event.transform.k;
        
        // Adjust element visibility based on zoom and settings
        const contourOpacity = settings?.contourOpacity ?? 0.3;
        const labelOpacity = settings?.labelOpacity ?? 0.8;
        
        g.selectAll('.contour-line')
          .attr('opacity', Math.min(contourOpacity, zoomLevel * contourOpacity / 2));
        
        // Settlement visibility based on settings and zoom
        const settlementOpacity = settings?.settlementOpacity ?? 0.8;
        const showSettlements = settings?.showSettlements !== false;
        
        g.selectAll('.settlement')
          .attr('opacity', showSettlements && zoomLevel > 0.5 ? settlementOpacity : 0);
        
        g.selectAll('.settlement-halo')
          .attr('opacity', showSettlements && zoomLevel > 0.3 ? 0.15 * zoomLevel : 0);
        
        g.selectAll('.settlement-label')
          .attr('opacity', showSettlements && zoomLevel > 1 ? labelOpacity : 0)
          .style('font-size', `${10 / Math.sqrt(Math.max(zoomLevel/2, 1))}px`);
        
        // Transition between high-level and detailed cluster labels based on zoom
        let highLevelOpacity = 0;
        let detailedOpacity = 0;
        
        if (zoomLevel < 1.5) {
          // Show high-level clusters from the beginning, fully visible at low zoom
          highLevelOpacity = Math.min(zoomLevel * 1.2 * labelOpacity, labelOpacity);
          detailedOpacity = 0;
        } else if (zoomLevel < 2.5) {
          // Transition from high-level to detailed
          highLevelOpacity = Math.max((1 - (zoomLevel - 1.5)) * labelOpacity, 0);
          detailedOpacity = Math.min((zoomLevel - 1.5) * labelOpacity, labelOpacity);
        } else {
          // Show only detailed clusters
          highLevelOpacity = 0;
          detailedOpacity = labelOpacity;
        }
        
        g.selectAll('.high-level-label')
          .transition()
          .duration(200)
          .attr('opacity', highLevelOpacity)
          .style('font-size', `${14 / Math.sqrt(Math.max(zoomLevel/2, 1))}px`);
        
        g.selectAll('.detailed-label')
          .transition()
          .duration(200)
          .attr('opacity', detailedOpacity)
          .style('font-size', `${10 / Math.sqrt(Math.max(zoomLevel/3, 1))}px`);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    if (currentTransform) {
      svg.call(zoom.transform, currentTransform);
      g.attr('transform', currentTransform.toString());
    }

    // Add proximity line (initially hidden)
    const proximityLine = g.append('line')
      .attr('class', 'proximity-line')
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0)
      .attr('pointer-events', 'none');
    
    proximityLineRef.current = proximityLine;

    // Draw contour lines
    const contourGroup = g.append('g').attr('class', 'contours');
    
    densityGrid.contours.forEach((contour, i) => {
      const path = d3.geoPath();
      
      contourGroup.append('path')
        .attr('d', path(contour as any))
        .attr('class', 'contour-line')
        .attr('fill', 'none')
        .attr('stroke', i % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
        .attr('stroke-width', i % 5 === 0 ? 1.5 : 0.5)
        .attr('opacity', 0.2)
        .attr('transform', `scale(${densityGrid.cellSize})`);
    });

    // Draw settlements with urban/city icons (only in island mode)
    const settlementsGroup = g.append('g').attr('class', 'settlements');
    
    if (settings?.terrainStyle === 'island' && settings?.showSettlements !== false) {
      // Draw local density halos first (beneath settlements)
      settlements.forEach((settlement) => {
        const haloGroup = settlementsGroup.append('g')
          .attr('class', 'settlement-halo')
          .attr('transform', `translate(${settlement.x}, ${settlement.y})`)
          .attr('opacity', 0.15);
        
        // Draw density halo based on settlement size
        const haloRadius = Math.sqrt(settlement.size) * 3;
        const gradient = settlementsGroup.append('defs')
          .append('radialGradient')
          .attr('id', `halo-${settlement.x}-${settlement.y}`)
          .attr('cx', '50%')
          .attr('cy', '50%')
          .attr('r', '50%');
        
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', '#fff')
          .attr('stop-opacity', 0.3);
        
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', '#fff')
          .attr('stop-opacity', 0);
        
        haloGroup.append('circle')
          .attr('r', haloRadius)
          .attr('fill', `url(#halo-${settlement.x}-${settlement.y})`);
      });
      
      // Draw settlement icons
      settlements.forEach((settlement, i) => {
        const settlementGroup = settlementsGroup.append('g')
          .attr('class', 'settlement')
          .attr('transform', `translate(${settlement.x}, ${settlement.y})`)
          .attr('opacity', settings?.settlementOpacity ?? 0.8);
        
        // Settlement icon based on type
        const isUrbanStyle = settings?.terrainStyle === 'greyscale';
        
        if (settlement.type === 'metropolis') {
          // Large city - multiple buildings
          if (isUrbanStyle) {
            settlementGroup.append('rect')
              .attr('x', -10)
              .attr('y', -10)
              .attr('width', 20)
              .attr('height', 20)
              .attr('fill', '#ccc')
              .attr('stroke', '#999');
            settlementGroup.append('rect')
              .attr('x', -6)
              .attr('y', -15)
              .attr('width', 12)
              .attr('height', 15)
              .attr('fill', '#aaa');
          } else {
            settlementGroup.append('circle')
              .attr('r', 8)
              .attr('fill', '#fff')
              .attr('stroke', '#333')
              .attr('stroke-width', 2);
          }
        } else if (settlement.type === 'city') {
          // Medium city
          if (isUrbanStyle) {
            settlementGroup.append('rect')
              .attr('x', -6)
              .attr('y', -8)
              .attr('width', 12)
              .attr('height', 12)
              .attr('fill', '#bbb')
              .attr('stroke', '#888');
          } else {
            settlementGroup.append('circle')
              .attr('r', 6)
              .attr('fill', '#eee')
              .attr('stroke', '#444')
              .attr('stroke-width', 1.5);
          }
        } else if (settlement.type === 'town') {
          // Town
          settlementGroup.append('circle')
            .attr('r', 4)
            .attr('fill', '#ddd')
            .attr('stroke', '#555')
            .attr('stroke-width', 1);
        } else {
          // Village
          settlementGroup.append('circle')
            .attr('r', 2.5)
            .attr('fill', '#ccc')
            .attr('stroke', '#666')
            .attr('stroke-width', 0.5);
        }
        
        // Add label for major settlements
        if (settlement.type === 'metropolis' || settlement.type === 'city') {
          settlementGroup.append('text')
            .attr('class', 'settlement-label')
            .attr('x', 0)
            .attr('y', -12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('opacity', 0)
            .style('text-shadow', '0 0 4px rgba(0,0,0,0.9)')
            .text(`${settlement.size} projects`);
        }
      });
    }

    // Draw data points - ALWAYS VISIBLE with proper interactions
    const pointsGroup = g.append('g').attr('class', 'points');
    
    // Calculate base radius - 2x larger when overlay is visible in island mode
    const overlayActive = showBackgroundImage && backgroundOpacity > 0 && settings?.terrainStyle === 'island';
    const basePointSize = (settings?.pointSize ?? 3) * (overlayActive ? 2 : 1);
    
    const points = pointsGroup.selectAll<SVGCircleElement, Submission>('circle')
      .data(submissions)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.umap_dim_1))
      .attr('cy', d => yScale(d.umap_dim_2))
      .attr('r', basePointSize)
      .attr('fill', d => pointColorMap.get(d.data_point_id) || '#fff')
      .attr('fill-opacity', 0.9)
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .attr('data-id', d => d.data_point_id);

    // Click handler for direct selection
    points.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedProject(d.data_point_id);
    });

    // Create throttled mousemove handler for proximity detection
    const handleMouseMove = (event: MouseEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Store mouse position for tooltip
      (window as any).hoveredPosition = { x: mouseX, y: mouseY };

      // Convert to data space if we have a transform
      const transform = transformRef.current || d3.zoomIdentity;
      const dataCoords = screenToData(mouseX, mouseY, transform);

      // Calculate proximity radius in data space
      const proximityRadius = getDataSpaceRadius(31, transform.k);

      // Find nearest point within radius
      const nearest = quadtree.find(dataCoords.x, dataCoords.y, proximityRadius);

      if (nearest && isPointVisible(nearest.data_point_id, filteredProjectIds)) {
        // Update hovered project
        setHoveredProject(nearest.data_point_id);

        // Get the color for the line
        const nearestColor = pointColorMap.get(nearest.data_point_id) || '#fff';

        // Update proximity line
        proximityLine
          .attr('x1', dataCoords.x)
          .attr('y1', dataCoords.y)
          .attr('x2', xScale(nearest.umap_dim_1))
          .attr('y2', yScale(nearest.umap_dim_2))
          .attr('stroke', nearestColor)
          .transition()
          .duration(150)
          .attr('opacity', 0.4);

        // Highlight only the nearest point
        const overlayActive = showBackgroundImage && backgroundOpacity > 0 && settings?.terrainStyle === 'island';
        const basePointSize = (settings?.pointSize ?? 3) * (overlayActive ? 2 : 1);
        g.selectAll('.data-point')
          .filter((d: any) => d.data_point_id === nearest.data_point_id)
          .attr('r', basePointSize + 3);
      } else {
        // No point within proximity
        setHoveredProject(null);
        (window as any).hoveredPosition = null;

        // Hide proximity line
        proximityLine
          .transition()
          .duration(150)
          .attr('opacity', 0);

        // Reset hover-enlarged points
        g.selectAll('.data-point')
          .each(function(d: any) {
            const elem = d3.select(this);
            const overlayActive = showBackgroundImage && backgroundOpacity > 0 && settings?.terrainStyle === 'island';
    const baseRadius = (settings?.pointSize ?? 3) * (overlayActive ? 2 : 1);
            const currentRadius = parseFloat(elem.attr('r'));
            
            // Only reset if it was hover-enlarged and not selected or unique
            if (currentRadius > baseRadius && 
                d.data_point_id !== selectedProjectId && 
                (!uniqueProjectIds || !uniqueProjectIds.has(d.data_point_id))) {
              elem.attr('r', baseRadius);
            }
          });
      }
    };

    // Create throttled version
    throttledMouseMoveRef.current = throttleRAF(handleMouseMove);

    // Add SVG-wide mouse event handlers
    svg.on('mousemove', (event) => {
      if (throttledMouseMoveRef.current) {
        throttledMouseMoveRef.current(event);
      }
    });

    svg.on('mouseleave', () => {
      setHoveredProject(null);
      (window as any).hoveredPosition = null;
      
      // Hide proximity line
      if (proximityLineRef.current) {
        proximityLineRef.current
          .transition()
          .duration(150)
          .attr('opacity', 0);
      }

      // Reset hover states
      const overlayActive = showBackgroundImage && backgroundOpacity > 0 && settings?.terrainStyle === 'island';
    const baseRadius = (settings?.pointSize ?? 3) * (overlayActive ? 2 : 1);
      g.selectAll('.data-point')
        .each(function(d: any) {
          const elem = d3.select(this);
          const currentRadius = parseFloat(elem.attr('r'));
          
          if (currentRadius > baseRadius && 
              d.data_point_id !== selectedProjectId && 
              (!uniqueProjectIds || !uniqueProjectIds.has(d.data_point_id))) {
            elem.attr('r', baseRadius);
          }
        });
    });

    // Click on background to deselect
    svg.on('click', () => {
      setSelectedProject(null);
      setSelectedCluster(null);
    });

    // Add cluster labels LAST so they render on top of everything
    const clusterLabels = g.append('g').attr('class', 'cluster-labels');
    
    const highLevelClusters = clusters.filter(c => c.cluster_level === 'High');
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    
    // High-level labels (visible at low zoom) - lighter colors
    highLevelClusters.forEach(cluster => {
      clusterLabels.append('text')
        .attr('class', 'high-level-label cluster-label')
        .attr('x', xScale(cluster.centroid[0]))
        .attr('y', yScale(cluster.centroid[1]))
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')  // White text for better contrast
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0.8) // Start visible to engage users immediately
        .attr('pointer-events', 'none')
        .style('text-shadow', `0 0 12px ${cluster.color}, 0 0 6px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.95)`)
        .style('paint-order', 'stroke fill')
        .attr('stroke', 'rgba(0,0,0,0.7)')
        .attr('stroke-width', '3px')
        .attr('z-index', '1000')
        .text(cluster.name);
    });
    
    // Detailed labels (visible at high zoom) - lighter colors
    detailedClusters.forEach(cluster => {
      clusterLabels.append('text')
        .attr('class', 'detailed-label cluster-label')
        .attr('x', xScale(cluster.centroid[0]))
        .attr('y', yScale(cluster.centroid[1]))
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')  // White text for better contrast
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0) // Start hidden, will be shown based on zoom
        .attr('pointer-events', 'none')
        .style('text-shadow', `0 0 8px ${cluster.color}, 0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.95)`)
        .style('paint-order', 'stroke fill')
        .attr('stroke', 'rgba(0,0,0,0.6)')
        .attr('stroke-width', '2px')
        .attr('z-index', '1000')
        .text(cluster.name);
    });

    // Cleanup function
    return () => {
      if (throttledMouseMoveRef.current) {
        throttledMouseMoveRef.current.cancel();
      }
    };

  }, [submissions, clusters, densityGrid, settlements, settlementGrid, scales, pointColorMap, terrainImageData, width, height, settings, 
      selectedProjectId, filteredProjectIds, uniqueProjectIds, setSelectedProject, setSelectedCluster, setHoveredProject, getSimilarProjects]);

  // Handle selection and filter changes
  useEffect(() => {
    if (!svgRef.current || submissions.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const overlayActive = showBackgroundImage && backgroundOpacity > 0 && settings?.terrainStyle === 'island';
    const baseRadius = (settings?.pointSize ?? 3) * (overlayActive ? 2 : 1);

    // Apply highlighting based on selection state
    if (selectedProjectId !== null) {
      const similarData = getSimilarProjects(selectedProjectId);
      const similarIds = new Set(
        similarData?.top_similar_projects.slice(0, 8).map(s => s.project_id) || []
      );
      
      g.selectAll('.data-point')
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          if (d.data_point_id === selectedProjectId) return 1;
          if (similarIds.has(d.data_point_id)) return 0.9;
          return 0.2;
        })
        .attr('r', (d: any) => {
          if (d.data_point_id === selectedProjectId) return baseRadius + 5;
          if (similarIds.has(d.data_point_id)) return baseRadius + 3;
          return baseRadius - 1;
        })
        .attr('stroke', (d: any) => {
          if (d.data_point_id === selectedProjectId) return '#fff';
          if (similarIds.has(d.data_point_id)) return '#a78bfa';
          return '#000';
        })
        .attr('stroke-width', (d: any) => {
          if (d.data_point_id === selectedProjectId) return 3;
          if (similarIds.has(d.data_point_id)) return 2;
          return 0.5;
        });
    } else if (selectedClusterId !== null) {
      const selectedCluster = getClusterById(selectedClusterId);
      const clusterMemberIds = new Set(selectedCluster?.members || []);
      
      g.selectAll('.data-point')
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? 0.95 : 0.3;
        })
        .attr('r', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? baseRadius + 2 : baseRadius - 1;
        })
        .attr('stroke', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? selectedCluster?.color || '#fff' : '#000';
        })
        .attr('stroke-width', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? 1.5 : 0.5;
        });
    } else if (filteredProjectIds !== null) {
      g.selectAll('.data-point')
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          return filteredProjectIds.has(d.data_point_id) ? 0.85 : 0.1;
        })
        .attr('r', baseRadius)
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .style('pointer-events', (d: any) => {
          return filteredProjectIds.has(d.data_point_id) ? 'auto' : 'none';
        });
    } else if (uniqueProjectIds !== null && uniqueProjectIds.size > 0) {
      // Highlight unique projects with purple glow
      g.selectAll('.data-point')
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 1 : 0.2;
        })
        .attr('r', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? baseRadius + 3 : baseRadius - 1;
        })
        .attr('stroke', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? '#a855f7' : '#000';
        })
        .attr('stroke-width', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 2 : 0.5;
        })
        .style('filter', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))' : 'none';
        });
    } else {
      g.selectAll('.data-point')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.9)
        .attr('r', baseRadius)
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .style('pointer-events', 'auto')
        .style('filter', 'none');
    }
  }, [selectedProjectId, selectedClusterId, filteredProjectIds, uniqueProjectIds, submissions, settings, getSimilarProjects, getClusterById]);

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width, height }}
      />
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        className="absolute inset-0"
        style={{ background: 'transparent' }}
      />
      {/* Export buttons - only show in development mode */}
      {isDevelopmentMode && (
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => exportTerrainImage(false)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg shadow-lg transition-colors flex items-center gap-2"
          title="Export terrain map as image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Map
        </button>
        {settings?.showSettlements && (
          <button
            onClick={() => exportTerrainImage(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg shadow-lg transition-colors flex items-center gap-2"
            title="Export terrain map with settlement dots"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export with Dots
          </button>
        )}
      </div>
      )}
    </div>
  );
};