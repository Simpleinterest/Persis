import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './CommonMistakesChart.css';

interface Mistake {
  mistake: string;
  count: number;
}

interface CommonMistakesChartProps {
  data: Mistake[];
}

const CommonMistakesChart: React.FC<CommonMistakesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="common-mistakes-container">
        <div className="common-mistakes-empty">
          <p>No common mistakes data available</p>
          <p className="empty-hint">Complete training sessions to see patterns in your form!</p>
        </div>
      </div>
    );
  }

  // Sort by count (descending) and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      name: item.mistake.length > 20 ? item.mistake.substring(0, 20) + '...' : item.mistake,
      fullName: item.mistake,
      count: item.count,
    }));

  const maxCount = Math.max(...sortedData.map(d => d.count), 1);

  // Color gradient based on count
  const getColor = (count: number): string => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return '#ef4444'; // Red for high frequency
    if (ratio > 0.4) return '#f59e0b'; // Orange for medium-high
    return '#F0E68C'; // Yellow for lower frequency
  };

  return (
    <div className="common-mistakes-container">
      <div className="common-mistakes-header">
        <h3>Common Mistakes (Past Month)</h3>
        <p className="header-subtitle">Most frequently identified form issues</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            type="number" 
            stroke="rgba(255, 255, 255, 0.6)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="rgba(255, 255, 255, 0.6)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
            }}
            labelStyle={{ color: '#F0E68C', fontWeight: '600' }}
            formatter={(value: any, name: string, props: any) => [
              `${value} occurrence${value !== 1 ? 's' : ''}`,
              props.payload.fullName,
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.count)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="common-mistakes-summary">
        <p className="summary-text">
          Focus on improving the most frequent issues to see the biggest impact on your form.
        </p>
      </div>
    </div>
  );
};

export default CommonMistakesChart;

