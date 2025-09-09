import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDataStore } from '../../store/useDataStore';
import type { Submission } from '../../types';

interface ScatterPlotProps {
  width: number;
  height: number;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);
  const { 
    submissions, 
    clusters,
    selectedProjectId, 
    hoveredProjectId,
    selectedClusterId,
    filteredProjectIds,
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

    // Set up zoom behavior with proper extent
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .extent([[0, 0], [width, height]])
      .translateExtent([[-width, -height], [width * 2, height * 2]])
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
            .attr('fill', d => {
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

    // Add interactions
    circles
      .on('mouseenter', function(event, d) {
        setHoveredProject(d.data_point_id);
        // Store mouse position for tooltip
        const rect = svgRef.current!.getBoundingClientRect();
        (window as any).hoveredPosition = { 
          x: event.clientX - rect.left, 
          y: event.clientY - rect.top 
        };
        d3.select(this)
          .attr('r', 6)
          .attr('fill-opacity', 1)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
      })
      .on('mousemove', function(event, d) {
        // Update position on move
        const rect = svgRef.current!.getBoundingClientRect();
        (window as any).hoveredPosition = { 
          x: event.clientX - rect.left, 
          y: event.clientY - rect.top 
        };
      })
      .on('mouseleave', function(event, d) {
        setHoveredProject(null);
        (window as any).hoveredPosition = null;
        if (d.data_point_id !== selectedProjectId) {
          d3.select(this)
            .attr('r', 4)
            .attr('fill-opacity', 0.85)
            .attr('stroke', 'none');
        }
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedProject(d.data_point_id);
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

  }, [submissions, clusters, width, height, setSelectedProject, setSelectedCluster, setHoveredProject]);

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
  }, [selectedProjectId, selectedClusterId, filteredProjectIds, clusters, getSimilarProjects, getClusterById]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height}
      className="bg-canvas-bg"
    />
  );
};