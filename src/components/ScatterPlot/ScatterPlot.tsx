import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDataStore } from '../../store/useDataStore';
import type { Submission } from '../../types.js';

interface ScatterPlotProps {
  width: number;
  height: number;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    submissions, 
    clusters,
    selectedProjectId, 
    hoveredProjectId,
    setSelectedProject,
    setHoveredProject 
  } = useDataStore();

  useEffect(() => {
    if (!svgRef.current || submissions.length === 0) return;

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

    // Create color scale for clusters
    const detailedClusters = clusters.filter(c => c.cluster_level === 'Detailed');
    const colorMap = new Map<number, string>();
    
    detailedClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        colorMap.set(memberId, cluster.color);
      });
    });

    // Set up zoom behavior with proper extent
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .extent([[0, 0], [width, height]])
      .translateExtent([[-width, -height], [width * 2, height * 2]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Draw points
    const circles = g.selectAll<SVGCircleElement, Submission>('circle')
      .data(submissions)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.umap_dim_1))
      .attr('cy', d => yScale(d.umap_dim_2))
      .attr('r', 4)
      .attr('fill', d => colorMap.get(d.data_point_id) || '#666')
      .attr('fill-opacity', 0.7)
      .attr('stroke', 'none')
      .attr('cursor', 'pointer')
      .attr('class', 'transition-all duration-200');

    // Add interactions
    circles
      .on('mouseenter', function(event, d) {
        setHoveredProject(d.data_point_id);
        d3.select(this)
          .attr('r', 6)
          .attr('fill-opacity', 1)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
      })
      .on('mouseleave', function(event, d) {
        setHoveredProject(null);
        if (d.data_point_id !== selectedProjectId) {
          d3.select(this)
            .attr('r', 4)
            .attr('fill-opacity', 0.7)
            .attr('stroke', 'none');
        }
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedProject(d.data_point_id);
      });

    // Highlight selected project
    if (selectedProjectId !== null) {
      circles
        .attr('fill-opacity', d => d.data_point_id === selectedProjectId ? 1 : 0.3)
        .attr('r', d => d.data_point_id === selectedProjectId ? 6 : 4)
        .attr('stroke', d => d.data_point_id === selectedProjectId ? '#fff' : 'none')
        .attr('stroke-width', d => d.data_point_id === selectedProjectId ? 2 : 0);
    }

    // Click on background to deselect
    svg.on('click', () => {
      setSelectedProject(null);
    });

  }, [submissions, clusters, selectedProjectId, width, height, setSelectedProject, setHoveredProject]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height}
      className="bg-canvas-bg"
    />
  );
};