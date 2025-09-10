import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ClusterMemberCount } from '../../services/statsService';

interface ClusterBarChartProps {
  highLevelClusters: ClusterMemberCount[];
  detailedClusters: ClusterMemberCount[];
}

const ClusterBarChartComponent: React.FC<ClusterBarChartProps> = ({ 
  highLevelClusters, 
  detailedClusters 
}) => {
  const [activeTab, setActiveTab] = useState<'high' | 'detailed'>('high');
  const chartRef = useRef<SVGSVGElement>(null);

  const currentData = activeTab === 'high' ? highLevelClusters : detailedClusters;

  useEffect(() => {
    if (!chartRef.current || !currentData.length) return;

    const margin = { top: 10, right: 50, bottom: 10, left: 160 };
    const width = 400 - margin.left - margin.right;
    const rowHeight = 28; // Increased from 25 to prevent overlap
    const maxHeight = activeTab === 'high' ? 350 : 600;
    const height = Math.min(currentData.length * rowHeight, maxHeight) - margin.top - margin.bottom;

    // Clear previous render
    d3.select(chartRef.current).selectAll('*').remove();

    const svg = d3.select(chartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(currentData, d => d.memberCount) || 0])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(currentData.map(d => d.name))
      .range([0, height])
      .padding(0.25);

    // Bars with cluster colors - use clusterId as key for unique binding
    g.selectAll('.bar')
      .data(currentData, (d: any) => d?.clusterId || d?.name)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.name) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color)
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
      })
      .transition()
      .duration(500)
      .delay((d, i) => i * 15)
      .attr('width', d => xScale(d.memberCount));

    // Cluster name labels - use clusterId as key
    g.selectAll('.label')
      .data(currentData, (d: any) => d?.clusterId || d?.name)
      .enter().append('text')
      .attr('x', -5)
      .attr('y', d => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '10px')
      .text(d => d.name.length > 20 ? d.name.slice(0, 20) + '...' : d.name);

    // Count labels - use clusterId as key
    g.selectAll('.count')
      .data(currentData, (d: any) => d?.clusterId || d?.name)
      .enter().append('text')
      .attr('x', d => xScale(d.memberCount) + 5)
      .attr('y', d => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#f3f4f6')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text(d => d.memberCount)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 15 + 200)
      .attr('opacity', 1);

  }, [currentData, activeTab]);

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-800/30 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('high')}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'high' 
              ? 'bg-gray-700 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          High Level ({highLevelClusters.length})
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'detailed' 
              ? 'bg-gray-700 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Detailed ({detailedClusters.length})
        </button>
      </div>

      {/* Chart */}
      <div className={`overflow-y-auto ${activeTab === 'detailed' ? 'max-h-[600px]' : ''}`}>
        <svg ref={chartRef}></svg>
      </div>
    </div>
  );
};

export const ClusterBarChart = React.memo(ClusterBarChartComponent);