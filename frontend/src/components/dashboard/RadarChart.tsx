import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import './RadarChart.css';

interface SportMetric {
  name: string;
  value: number;
  unit?: string;
  target?: number;
}

interface RadarChartProps {
  data: SportMetric[];
  sport: string;
}

const RadarChartComponent: React.FC<RadarChartProps> = ({ data, sport }) => {
  if (!data || data.length === 0) {
    return (
      <div className="radar-chart-container">
        <div className="radar-chart-empty">
          <p>No metrics data available for {sport}</p>
          <p className="empty-hint">Start a live session to see your metrics!</p>
        </div>
      </div>
    );
  }

  // Prepare data for radar chart
  const chartData = data.map(metric => {
    // Normalize value to 0-100 scale for visualization
    let normalizedValue = metric.value;
    if (metric.target) {
      // Scale relative to target (target = 100)
      normalizedValue = (metric.value / metric.target) * 100;
    } else if (metric.unit === 'score') {
      // Already a score (0-1), convert to 0-100
      normalizedValue = metric.value * 100;
    }
    
    // Clamp between 0 and 100
    normalizedValue = Math.max(0, Math.min(100, normalizedValue));
    
    return {
      metric: metric.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.round(normalizedValue),
      fullMark: 100,
    };
  });

  return (
    <div className="radar-chart-container">
      <div className="radar-chart-header">
        <h3>{sport.charAt(0).toUpperCase() + sport.slice(1)} Metrics</h3>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#F0E68C', fontSize: 12 }}
            tickLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
            tickLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
          />
          <Radar
            name="Your Performance"
            dataKey="value"
            stroke="#F0E68C"
            fill="#F0E68C"
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="radar-chart-legend">
        {data.map((metric, index) => (
          <div key={index} className="metric-legend-item">
            <span className="metric-name">{metric.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
            <span className="metric-value">
              {metric.value.toFixed(1)}{metric.unit ? ` ${metric.unit}` : ''}
              {metric.target && (
                <span className="metric-target"> / {metric.target}{metric.unit ? ` ${metric.unit}` : ''}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChartComponent;

