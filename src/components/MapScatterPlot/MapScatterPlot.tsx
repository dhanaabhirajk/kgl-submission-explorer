import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useDataStore } from '../../store/useDataStore';
import { mapGenerator } from '../../services/mapGenerator';
import type { Submission, MapPolygon } from '../../types';

interface MapScatterPlotProps {
  width: number;
  height: number;
}

export const MapScatterPlot: React.FC<MapScatterPlotProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);
  
  const { 
    submissions, 
    clusters,
    selectedProjectId,
    selectedClusterId,
    filteredProjectIds,
    setSelectedProject,
    setSelectedCluster,
    setHoveredProject
  } = useDataStore();

  const mapPolygons = useMemo(() => {
    if (submissions.length === 0 || clusters.length === 0) return [];
    return mapGenerator.generateMapPolygons(submissions, clusters, width, height);
  }, [submissions, clusters, width, height]);

  useEffect(() => {
    if (!svgRef.current || submissions.length === 0) return;

    const currentTransform = transformRef.current;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const defs = svg.append('defs');
    
    // Add gradient definitions for water effect
    const waterGradient = defs.append('radialGradient')
      .attr('id', 'water-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    waterGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1e3a5f')
      .attr('stop-opacity', 1);
    
    waterGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0f1e2e')
      .attr('stop-opacity', 1);

    // Add texture pattern for landmasses
    const pattern = defs.append('pattern')
      .attr('id', 'land-texture')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4);
    
    pattern.append('rect')
      .attr('width', 4)
      .attr('height', 4)
      .attr('fill', 'none');
    
    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 0.5)
      .attr('fill', '#000')
      .attr('opacity', 0.05);

    // Background ocean
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#water-gradient)')
      .attr('class', 'ocean');

    const g = svg.append('g');

    // Calculate scales
    const padding = 50;
    const xExtent = d3.extent(submissions, d => d.umap_dim_1) as [number, number];
    const yExtent = d3.extent(submissions, d => d.umap_dim_2) as [number, number];

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 8])
      .extent([[0, 0], [width, height]])
      .translateExtent([[-width, -height], [width * 2, height * 2]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        transformRef.current = event.transform;
        
        const zoomLevel = event.transform.k;
        
        // Adjust point and label visibility based on zoom
        g.selectAll('circle')
          .attr('r', Math.min(5, 3 * Math.sqrt(zoomLevel)))
          .attr('stroke-width', zoomLevel > 2 ? 1 : 0.5);
        
        // Adjust landmass opacity based on zoom
        g.selectAll('.continent').attr('opacity', 0.3);
        g.selectAll('.island').attr('opacity', zoomLevel > 1 ? 0.25 : 0.15);
        g.selectAll('.atoll').attr('opacity', zoomLevel > 2 ? 0.2 : 0.1);
        
        // Labels visibility
        g.selectAll('.continent-label').attr('opacity', zoomLevel < 2 ? 1 : 0.5);
        g.selectAll('.island-label').attr('opacity', zoomLevel > 1 ? Math.min(1, zoomLevel - 1) : 0);
        
        // Adjust label sizes
        g.selectAll('.continent-label')
          .style('font-size', `${16 / Math.sqrt(Math.max(zoomLevel, 1))}px`);
        g.selectAll('.island-label')
          .style('font-size', `${12 / Math.sqrt(Math.max(zoomLevel/1.5, 1))}px`);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    if (currentTransform) {
      svg.call(zoom.transform, currentTransform);
      g.attr('transform', currentTransform.toString());
    }

    // Sort polygons by area (larger first) for proper layering
    const sortedPolygons = [...mapPolygons].sort((a, b) => b.area - a.area);

    // Debug: log polygons
    console.log('Map polygons generated:', sortedPolygons.length, sortedPolygons);
    
    // Draw landmasses
    const landGroups = g.selectAll('.land-group')
      .data(sortedPolygons)
      .enter()
      .append('g')
      .attr('class', d => `land-group ${d.level}`)
      .attr('opacity', 1); // Always show all polygons initially

    // Create land polygons with organic borders
    landGroups.each(function(d) {
      const group = d3.select(this);
      const scaledPoints = d.points.map(p => [xScale(p[0]), yScale(p[1])]);
      
      // Main landmass
      group.append('path')
        .attr('d', () => {
          const line = d3.line()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasisClosed);
          return line(scaledPoints as [number, number][]);
        })
        .attr('fill', d.cluster.color)
        .attr('fill-opacity', 0.25)
        .attr('stroke', d.cluster.color)
        .attr('stroke-width', d.level === 'continent' ? 2 : 1)
        .attr('stroke-opacity', 0.6)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
        .attr('class', 'landmass')
        .on('click', (event) => {
          event.stopPropagation();
          setSelectedCluster(d.cluster.cluster_id);
        })
        .on('mouseenter', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.35)
            .attr('stroke-width', (d.level === 'continent' ? 3 : 2));
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.25)
            .attr('stroke-width', (d.level === 'continent' ? 2 : 1));
        });

      // Add texture overlay
      group.append('path')
        .attr('d', () => {
          const line = d3.line()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasisClosed);
          return line(scaledPoints as [number, number][]);
        })
        .attr('fill', 'url(#land-texture)')
        .attr('pointer-events', 'none');

      // Coastal highlight
      if (d.level === 'continent' || d.level === 'island') {
        group.append('path')
          .attr('d', () => {
            const line = d3.line()
              .x(d => d[0])
              .y(d => d[1])
              .curve(d3.curveBasisClosed);
            return line(scaledPoints as [number, number][]);
          })
          .attr('fill', 'none')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.3)
          .attr('pointer-events', 'none');
      }
    });

    // Add labels for continents and major islands
    const continentLabels = mapPolygons.filter(p => p.level === 'continent');
    const majorIslands = mapPolygons
      .filter(p => p.level === 'island')
      .sort((a, b) => b.area - a.area)
      .slice(0, 20);

    g.selectAll('.continent-label')
      .data(continentLabels)
      .enter()
      .append('text')
      .attr('class', 'continent-label')
      .attr('x', d => xScale(d.cluster.centroid[0]))
      .attr('y', d => yScale(d.cluster.centroid[1]))
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.cluster.color)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('opacity', 1)
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)')
      .text(d => d.cluster.name);

    g.selectAll('.island-label')
      .data(majorIslands)
      .enter()
      .append('text')
      .attr('class', 'island-label')
      .attr('x', d => {
        const centerX = d.points.reduce((sum, p) => sum + p[0], 0) / d.points.length;
        return xScale(centerX);
      })
      .attr('y', d => {
        const centerY = d.points.reduce((sum, p) => sum + p[1], 0) / d.points.length;
        return yScale(centerY);
      })
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.cluster.color)
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('opacity', 0)
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 0 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)')
      .text(d => d.cluster.name);

    // Draw individual points on top of landmasses - ALWAYS VISIBLE
    const pointsLayer = g.append('g').attr('class', 'points-layer');
    
    // Create color map for points based on clusters
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    const pointColorMap = new Map<number, string>();
    detailedClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        pointColorMap.set(memberId, cluster.color);
      });
    });
    
    const circles = pointsLayer.selectAll<SVGCircleElement, Submission>('circle')
      .data(submissions)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.umap_dim_1))
      .attr('cy', d => yScale(d.umap_dim_2))
      .attr('r', 3)
      .attr('fill', d => pointColorMap.get(d.data_point_id) || '#fff')
      .attr('fill-opacity', 0.8)
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedProject(d.data_point_id);
      })
      .on('mouseenter', (event, d) => {
        setHoveredProject(d.data_point_id);
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', 4)
          .attr('fill-opacity', 1);
      })
      .on('mouseleave', (event) => {
        setHoveredProject(null);
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', 2)
          .attr('fill-opacity', 0.6);
      });

    // Click on ocean to deselect
    svg.on('click', () => {
      setSelectedProject(null);
      setSelectedCluster(null);
    });

  }, [submissions, clusters, mapPolygons, width, height, setSelectedProject, setSelectedCluster, setHoveredProject]);

  // Handle selection changes
  useEffect(() => {
    if (!svgRef.current || submissions.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');

    if (selectedClusterId) {
      const selectedCluster = clusters.find(c => c.cluster_id === selectedClusterId);
      const memberIds = new Set(selectedCluster?.members || []);

      g.selectAll('.landmass')
        .transition()
        .duration(300)
        .attr('fill-opacity', function(d: any) {
          return d.cluster.cluster_id === selectedClusterId ? 0.5 : 0.1;
        })
        .attr('stroke-opacity', function(d: any) {
          return d.cluster.cluster_id === selectedClusterId ? 1 : 0.3;
        });

      g.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => memberIds.has(d.data_point_id) ? 1 : 0.1)
        .attr('r', (d: any) => memberIds.has(d.data_point_id) ? 3 : 1);
    } else if (selectedProjectId) {
      g.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill-opacity', (d: any) => d.data_point_id === selectedProjectId ? 1 : 0.2)
        .attr('r', (d: any) => d.data_point_id === selectedProjectId ? 6 : 2)
        .attr('stroke', (d: any) => d.data_point_id === selectedProjectId ? '#fff' : 'none')
        .attr('stroke-width', (d: any) => d.data_point_id === selectedProjectId ? 2 : 0);

      g.selectAll('.landmass')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.15)
        .attr('stroke-opacity', 0.4);
    } else {
      g.selectAll('.landmass')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.25)
        .attr('stroke-opacity', 0.6);

      g.selectAll('circle')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.6)
        .attr('r', 2)
        .attr('stroke', 'none');
    }
  }, [selectedProjectId, selectedClusterId, clusters, submissions]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height}
      className="bg-gradient-to-br from-slate-900 to-slate-950"
      style={{
        background: 'radial-gradient(circle at center, #1e3a5f 0%, #0f1e2e 100%)'
      }}
    />
  );
};