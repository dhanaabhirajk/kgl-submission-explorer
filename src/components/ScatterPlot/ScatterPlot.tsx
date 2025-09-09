import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDataStore } from '../../store/useDataStore';
import type { Submission } from '../../types';
import { throttleRAF, screenToData, isPointVisible, getDataSpaceRadius } from '../../utils/proximity';

interface ScatterPlotProps {
  width: number;
  height: number;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);
  const quadtreeRef = useRef<d3.Quadtree<Submission> | null>(null);
  const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  const yScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  const proximityLineRef = useRef<d3.Selection<SVGLineElement, unknown, null, undefined> | null>(null);
  const throttledMouseMoveRef = useRef<ReturnType<typeof throttleRAF> | null>(null);
  const { 
    submissions, 
    clusters,
    selectedProjectId, 
    selectedClusterId,
    filteredProjectIds,
    uniqueProjectIds,
    setSelectedProject,
    setSelectedCluster,
    setHoveredProject,
    getSimilarProjects,
    getClusterById 
  } = useDataStore();

  useEffect(() => {
    if (!svgRef.current || submissions.length === 0) return;

    // Store the current transform before clearing
    const currentTransform = transformRef.current;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up SVG
    const svg = d3.select(svgRef.current);
    const g = svg.append('g');


    // Calculate scales with padding
    const padding = 50;
    const xExtent = d3.extent(submissions, d => d.umap_dim_1) as [number, number];
    const yExtent = d3.extent(submissions, d => d.umap_dim_2) as [number, number];

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);

    // Store scales for proximity calculations
    xScaleRef.current = xScale;
    yScaleRef.current = yScale;

    // Build quadtree for efficient proximity searches
    const quadtree = d3.quadtree<Submission>()
      .x(d => xScale(d.umap_dim_1))
      .y(d => yScale(d.umap_dim_2))
      .addAll(submissions);
    
    quadtreeRef.current = quadtree;

    // Create color maps for both high-level and detailed clusters
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    const highLevelClusters = clusters.filter(c => c.cluster_level === 'High');
    
    const detailedColorMap = new Map<number, string>();
    const highLevelColorMap = new Map<number, string>();
    
    detailedClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        detailedColorMap.set(memberId, cluster.color);
      });
    });
    
    highLevelClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        highLevelColorMap.set(memberId, cluster.color);
      });
    });

    // Set up zoom behavior with proper extent and touch support
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .extent([[0, 0], [width, height]])
      .translateExtent([[-width, -height], [width * 2, height * 2]])
      .filter((event) => {
        // Allow all events except right-click
        return !event.ctrlKey && !event.button;
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        // Store the current transform
        transformRef.current = event.transform;
        
        const zoomLevel = event.transform.k;
        
        // Show high-level clusters at lower zoom, detailed at higher zoom
        let highLevelOpacity = 0;
        let detailedOpacity = 0;
        
        if (zoomLevel < 1.5) {
          // Show only high-level clusters (earlier than before)
          highLevelOpacity = zoomLevel > 0.8 ? Math.min((zoomLevel - 0.8) * 1.43, 1) : 0;
          detailedOpacity = 0;
        } else if (zoomLevel < 2.5) {
          // Transition from high-level to detailed
          highLevelOpacity = Math.max(1 - (zoomLevel - 1.5), 0);
          detailedOpacity = Math.min((zoomLevel - 1.5), 1);
        } else {
          // Show only detailed clusters
          highLevelOpacity = 0;
          detailedOpacity = 1;
        }
        
        // Update high-level labels
        g.selectAll('.high-level-label')
          .transition()
          .duration(200)
          .attr('opacity', highLevelOpacity)
          .style('font-size', `${14 / Math.sqrt(Math.max(zoomLevel/2, 1))}px`);
        
        // Update detailed labels
        g.selectAll('.detailed-label')
          .transition()
          .duration(200)
          .attr('opacity', detailedOpacity)
          .style('font-size', `${10 / Math.sqrt(Math.max(zoomLevel/3, 1))}px`);
        
        // Transition circle colors based on zoom level
        if (!selectedProjectId) {  // Only transition colors when nothing is selected
          g.selectAll('circle')
            .transition()
            .duration(300)
            .attr('fill', (d: any) => {
              if (zoomLevel < 2) {
                // Use high-level cluster colors
                return highLevelColorMap.get(d.data_point_id) || '#666';
              } else if (zoomLevel < 2.5) {
                // Blend between high-level and detailed colors
                return detailedColorMap.get(d.data_point_id) || '#666';
              } else {
                // Use detailed cluster colors
                return detailedColorMap.get(d.data_point_id) || '#666';
              }
            });
        }
      });

    // Store zoom behavior reference
    zoomRef.current = zoom;
    svg.call(zoom);

    // Restore the previous transform if it exists
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

    // Draw points
    const circles = g.selectAll<SVGCircleElement, Submission>('circle')
      .data(submissions)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.umap_dim_1))
      .attr('cy', d => yScale(d.umap_dim_2))
      .attr('r', 4)
      .attr('fill', d => detailedColorMap.get(d.data_point_id) || '#666')
      .attr('fill-opacity', 0.85)
      .attr('stroke', 'none')
      .attr('cursor', 'pointer')
      .attr('data-id', d => d.data_point_id)
      .attr('class', 'transition-all duration-200');

    // Click handler for direct selection (keep this for direct clicks)
    circles.on('click', (event, d) => {
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

      // Calculate proximity radius in data space (reduced by 30% from 45px to ~31px)
      const proximityRadius = getDataSpaceRadius(31, transform.k);

      // Find nearest point within radius
      const nearest = quadtree.find(dataCoords.x, dataCoords.y, proximityRadius);

      if (nearest && isPointVisible(nearest.data_point_id, filteredProjectIds)) {
        // Update hovered project
        setHoveredProject(nearest.data_point_id);

        // Get the color for the line
        const nearestColor = detailedColorMap.get(nearest.data_point_id) || '#666';

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

        // Highlight only the nearest point without affecting others
        g.selectAll('circle')
          .filter((d: any) => d.data_point_id === nearest.data_point_id)
          .attr('r', 6);
      } else {
        // No point within proximity
        setHoveredProject(null);
        (window as any).hoveredPosition = null;

        // Hide proximity line
        proximityLine
          .transition()
          .duration(150)
          .attr('opacity', 0);

        // Reset only previously hovered points (not all points)
        // This preserves unique project highlighting and other states
        g.selectAll('circle')
          .each(function(d: any) {
            const elem = d3.select(this);
            const currentRadius = parseFloat(elem.attr('r'));
            
            // Only reset if it was hover-enlarged and not selected or unique
            if (currentRadius === 6 && 
                d.data_point_id !== selectedProjectId && 
                (!uniqueProjectIds || !uniqueProjectIds.has(d.data_point_id))) {
              elem.attr('r', 4);
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

      // Reset only hover-enlarged circles, preserving unique project highlighting
      g.selectAll('circle')
        .each(function(d: any) {
          const elem = d3.select(this);
          const currentRadius = parseFloat(elem.attr('r'));
          
          // Only reset if it's hover-enlarged (6px) and not selected or unique
          if (currentRadius === 6 && 
              d.data_point_id !== selectedProjectId && 
              (!uniqueProjectIds || !uniqueProjectIds.has(d.data_point_id))) {
            elem.attr('r', 4);
          }
        });
    });

    // Add high-level cluster labels (using already defined highLevelClusters from above)
    const highLevelLabels = g.selectAll('.high-level-label')
      .data(highLevelClusters)
      .enter()
      .append('text')
      .attr('class', 'high-level-label cluster-label')
      .attr('x', d => xScale(d.centroid[0]))
      .attr('y', d => yScale(d.centroid[1]))
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.color)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 0 10px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8)')
      .text(d => d.name);
    
    // Add detailed cluster labels
    const detailedLabels = g.selectAll('.detailed-label')
      .data(detailedClusters)
      .enter()
      .append('text')
      .attr('class', 'detailed-label cluster-label')
      .attr('x', d => xScale(d.centroid[0]))
      .attr('y', d => yScale(d.centroid[1]))
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.color)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 0 8px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.8)')
      .text(d => d.name);

    // Click on background to deselect all
    svg.on('click', () => {
      setSelectedProject(null);
      setSelectedCluster(null);
    });

    // Cleanup function
    return () => {
      if (throttledMouseMoveRef.current) {
        throttledMouseMoveRef.current.cancel();
      }
    };

  }, [submissions, clusters, width, height, filteredProjectIds, selectedProjectId, setSelectedProject, setSelectedCluster, setHoveredProject]);

  // Separate effect for handling selection and filter changes without re-rendering
  useEffect(() => {
    if (!svgRef.current || submissions.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const circles = g.selectAll<SVGCircleElement, Submission>('circle');

    // Calculate color maps for clusters
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    const detailedColorMap = new Map<number, string>();
    detailedClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        detailedColorMap.set(memberId, cluster.color);
      });
    });

    // Apply highlighting based on selection state
    if (selectedProjectId !== null) {
      const similarData = getSimilarProjects(selectedProjectId);
      const similarIds = new Set(
        similarData?.top_similar_projects.slice(0, 8).map(s => s.project_id) || []
      );
      
      circles
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          if (d.data_point_id === selectedProjectId) return 1;
          if (similarIds.has(d.data_point_id)) return 0.9;
          return 0.2;
        })
        .attr('r', (d: any) => {
          if (d.data_point_id === selectedProjectId) return 8;
          if (similarIds.has(d.data_point_id)) return 6;
          return 3;
        })
        .attr('stroke', (d: any) => {
          if (d.data_point_id === selectedProjectId) return '#fff';
          if (similarIds.has(d.data_point_id)) return '#a78bfa';
          return 'none';
        })
        .attr('stroke-width', (d: any) => {
          if (d.data_point_id === selectedProjectId) return 3;
          if (similarIds.has(d.data_point_id)) return 2;
          return 0;
        });
    } else if (selectedClusterId !== null) {
      const selectedCluster = getClusterById(selectedClusterId);
      const clusterMemberIds = new Set(selectedCluster?.members || []);
      
      circles
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? 0.95 : 0.3;
        })
        .attr('r', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? 5 : 3;
        })
        .attr('stroke', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? selectedCluster?.color || '#fff' : 'none';
        })
        .attr('stroke-width', (d: any) => {
          return clusterMemberIds.has(d.data_point_id) ? 1.5 : 0;
        });
    } else if (filteredProjectIds !== null) {
      circles
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          return filteredProjectIds.has(d.data_point_id) ? 0.85 : 0.1;
        })
        .attr('r', 4)
        .attr('stroke', 'none')
        .attr('stroke-width', 0)
        .style('pointer-events', (d: any) => {
          return filteredProjectIds.has(d.data_point_id) ? 'auto' : 'none';
        });
    } else if (uniqueProjectIds !== null && uniqueProjectIds.size > 0) {
      // Highlight unique projects with purple glow
      circles
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 1 : 0.2;
        })
        .attr('r', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 6 : 3;
        })
        .attr('stroke', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? '#a855f7' : 'none';
        })
        .attr('stroke-width', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 2 : 0;
        })
        .style('filter', (d: any) => {
          return uniqueProjectIds.has(d.data_point_id) ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))' : 'none';
        });
    } else {
      circles
        .transition()
        .duration(300)
        .attr('fill', (d: any) => detailedColorMap.get(d.data_point_id) || '#666')
        .attr('fill-opacity', 0.85)
        .attr('r', 4)
        .attr('stroke', 'none')
        .attr('stroke-width', 0)
        .style('pointer-events', 'auto');
    }
  }, [selectedProjectId, selectedClusterId, filteredProjectIds, uniqueProjectIds, clusters, getSimilarProjects, getClusterById]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height}
      className="bg-canvas-bg"
    />
  );
};