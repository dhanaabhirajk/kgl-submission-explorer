import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface UniquenessHistogramProps {
  histogram: { bin: number; count: number }[];
}

export const UniquenessHistogram: React.FC<UniquenessHistogramProps> = ({ histogram }) => {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || !histogram.length) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 380 - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    // Clear previous render
    d3.select(chartRef.current).selectAll('*').remove();

    const svg = d3.select(chartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(histogram, d => d.bin) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(histogram, d => d.count) || 0])
      .range([height, 0]);

    // Color gradient
    const colorScale = d3.scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolate('#8b5cf6', '#3b82f6'));

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => `${(d as number * 100).toFixed(0)}%`))
      .attr('color', '#6b7280')
      .selectAll('text')
      .attr('font-size', '10px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale)
        .ticks(4)
        .tickFormat(d3.format('d')))
      .attr('color', '#6b7280')
      .selectAll('text')
      .attr('font-size', '10px');

    // Calculate bar width
    const barWidth = width / histogram.length - 2;

    // Bars
    g.selectAll('.bar')
      .data(histogram)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.bin) - barWidth / 2)
      .attr('y', height)
      .attr('width', barWidth)
      .attr('height', 0)
      .attr('fill', d => colorScale(d.bin))
      .attr('opacity', 0.8)
      .attr('rx', 1)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        
        // Tooltip
        const tooltip = g.append('g')
          .attr('id', 'tooltip');
        
        const rect = tooltip.append('rect')
          .attr('x', xScale(d.bin) - 30)
          .attr('y', yScale(d.count) - 25)
          .attr('width', 60)
          .attr('height', 20)
          .attr('fill', '#1f2937')
          .attr('stroke', '#374151')
          .attr('rx', 3);
        
        tooltip.append('text')
          .attr('x', xScale(d.bin))
          .attr('y', yScale(d.count) - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f3f4f6')
          .attr('font-size', '11px')
          .text(`${d.count} projects`);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        g.select('#tooltip').remove();
      })
      .transition()
      .duration(500)
      .delay((d, i) => i * 20)
      .attr('y', d => yScale(d.count))
      .attr('height', d => height - yScale(d.count));

    // X axis label
    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + 35})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .text('Average Similarity Score');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -25)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .text('Projects');

    // Add gradient definition for visual appeal
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'histogram-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#8b5cf6')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.8);

  }, [histogram]);

  return (
    <div className="bg-gray-800/20 rounded-lg p-2">
      <svg ref={chartRef}></svg>
    </div>
  );
};