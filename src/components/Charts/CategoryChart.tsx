import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { CategoryFrequency } from '../../services/statsService';

interface CategoryChartProps {
  categories: CategoryFrequency[];
}

const CategoryChartComponent: React.FC<CategoryChartProps> = ({ categories }) => {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || !categories.length) return;

    const margin = { top: 5, right: 50, bottom: 5, left: 140 };
    const width = 400 - margin.left - margin.right;
    const height = Math.max(categories.length * 25, 200) - margin.top - margin.bottom;

    // Clear previous render
    d3.select(chartRef.current).selectAll('*').remove();

    const svg = d3.select(chartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(categories, d => d.count) || 0])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(categories.map(d => d.category))
      .range([0, height])
      .padding(0.25);

    // Color scale - purple gradient
    const colorScale = d3.scaleSequential()
      .domain([0, categories.length - 1])
      .interpolator(d3.interpolate('#a855f7', '#6b21a8'));

    // Background bars (for full width reference)
    g.selectAll('.bg-bar')
      .data(categories)
      .enter().append('rect')
      .attr('class', 'bg-bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.category) || 0)
      .attr('width', width)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#1f2937')
      .attr('opacity', 0.3)
      .attr('rx', 3);

    // Data bars
    g.selectAll('.bar')
      .data(categories)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.category) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d, i) => colorScale(i))
      .attr('opacity', 0.9)
      .attr('rx', 3)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('opacity', 0.9);
      })
      .transition()
      .duration(600)
      .delay((d, i) => i * 30)
      .attr('width', d => xScale(d.count));

    // Category labels
    g.selectAll('.label')
      .data(categories)
      .enter().append('text')
      .attr('x', -5)
      .attr('y', d => (yScale(d.category) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text(d => d.category);

    // Count labels
    g.selectAll('.count')
      .data(categories)
      .enter().append('text')
      .attr('x', d => xScale(d.count) + 5)
      .attr('y', d => (yScale(d.category) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#f3f4f6')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(d => d.count)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay((d, i) => i * 30 + 300)
      .attr('opacity', 1);

  }, [categories]);

  return (
    <div className="overflow-x-auto">
      <svg ref={chartRef}></svg>
    </div>
  );
};

export const CategoryChart = React.memo(CategoryChartComponent);