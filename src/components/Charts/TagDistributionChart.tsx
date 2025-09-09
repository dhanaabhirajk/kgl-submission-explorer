import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TagFrequency } from '../../services/statsService';

interface TagDistributionChartProps {
  topTags: TagFrequency[];
  bottomTags: TagFrequency[];
}

export const TagDistributionChart: React.FC<TagDistributionChartProps> = ({ 
  topTags, 
  bottomTags 
}) => {
  const topChartRef = useRef<SVGSVGElement>(null);
  const bottomChartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!topChartRef.current || !topTags.length) return;
    renderChart(topChartRef.current, topTags, '#3b82f6');
  }, [topTags]);

  useEffect(() => {
    if (!bottomChartRef.current || !bottomTags.length) return;
    renderChart(bottomChartRef.current, bottomTags, '#6366f1');
  }, [bottomTags]);

  const renderChart = (
    svgElement: SVGSVGElement, 
    data: TagFrequency[], 
    color: string
  ) => {
    const margin = { top: 5, right: 50, bottom: 5, left: 120 };
    const width = 400 - margin.left - margin.right;
    const height = Math.max(data.length * 22, 100) - margin.top - margin.bottom;

    // Clear previous render
    d3.select(svgElement).selectAll('*').remove();

    const svg = d3.select(svgElement)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.tag))
      .range([0, height])
      .padding(0.2);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.tag) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', color)
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .transition()
      .duration(500)
      .delay((d, i) => i * 20)
      .attr('width', d => xScale(d.count));

    // Labels
    g.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('x', -5)
      .attr('y', d => (yScale(d.tag) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .text(d => d.tag.length > 15 ? d.tag.slice(0, 15) + '...' : d.tag);

    // Count labels
    g.selectAll('.count')
      .data(data)
      .enter().append('text')
      .attr('x', d => xScale(d.count) + 5)
      .attr('y', d => (yScale(d.tag) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#d1d5db')
      .attr('font-size', '10px')
      .text(d => d.count)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 20 + 200)
      .attr('opacity', 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 mb-2">Top 20 Tags</p>
        <div className="overflow-x-auto">
          <svg ref={topChartRef}></svg>
        </div>
      </div>
      
      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 mb-2">Bottom 10 Tags</p>
        <div className="overflow-x-auto">
          <svg ref={bottomChartRef}></svg>
        </div>
      </div>
    </div>
  );
};