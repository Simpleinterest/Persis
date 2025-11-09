import React from 'react';
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import './CalendarHeatmap.css';

interface CalendarHeatmapProps {
  data: Array<{
    date: Date;
    duration: number;
    sessions: number;
  }>;
  year?: number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ data, year }) => {
  const currentYear = year || new Date().getFullYear();
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 0, 1));
  const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Create a map of date to duration/sessions
  const dataMap = new Map<string, { duration: number; sessions: number }>();
  data.forEach(item => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    const existing = dataMap.get(dateKey);
    if (existing) {
      dataMap.set(dateKey, {
        duration: existing.duration + item.duration,
        sessions: existing.sessions + item.sessions,
      });
    } else {
      dataMap.set(dateKey, {
        duration: item.duration,
        sessions: item.sessions || 1,
      });
    }
  });

  // Get max duration for scaling
  const maxDuration = Math.max(...Array.from(dataMap.values()).map(d => d.duration), 1);

  // Get intensity level (0-4) based on duration
  const getIntensity = (duration: number): number => {
    if (duration === 0) return 0;
    const ratio = duration / maxDuration;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  // Group days by week (simplified approach)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Fill in days before year start to align with Monday
  const firstDayOfWeek = yearStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToSkip = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Days to skip to get to Monday
  
  for (let i = 0; i < daysToSkip; i++) {
    currentWeek.push(new Date(0)); // Placeholder for empty days
  }
  
  daysInYear.forEach(day => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  // Fill remaining days if needed
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(0)); // Placeholder
    }
    weeks.push(currentWeek);
  }

  // Month labels - find first occurrence of each month
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStarts: { month: string; weekIndex: number }[] = [];
  const seenMonths = new Set<number>();
  
  weeks.forEach((week, weekIndex) => {
    week.forEach(day => {
      if (day.getTime() !== 0) {
        const month = day.getMonth();
        if (!seenMonths.has(month)) {
          monthStarts.push({ month: monthLabels[month], weekIndex });
          seenMonths.add(month);
        }
      }
    });
  });

  return (
    <div className="calendar-heatmap-container">
      <div className="calendar-heatmap-header">
        <h3>Training Consistency - {currentYear}</h3>
        <div className="calendar-legend">
          <span className="legend-label">Less</span>
          <div className="legend-squares">
            <div className="legend-square intensity-0" title="No training"></div>
            <div className="legend-square intensity-1" title="Light training"></div>
            <div className="legend-square intensity-2" title="Moderate training"></div>
            <div className="legend-square intensity-3" title="Heavy training"></div>
            <div className="legend-square intensity-4" title="Very heavy training"></div>
          </div>
          <span className="legend-label">More</span>
        </div>
      </div>
      <div className="calendar-heatmap-content">
        <div className="calendar-wrapper">
          <div className="month-labels-row">
            {monthStarts.map(({ month, weekIndex }, index) => (
              <div
                key={index}
                className="month-label-item"
                style={{ marginLeft: `${weekIndex * 14}px` }}
              >
                {month}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            <div className="day-labels">
              <div className="day-label">Mon</div>
              <div className="day-label"></div>
              <div className="day-label">Wed</div>
              <div className="day-label"></div>
              <div className="day-label">Fri</div>
              <div className="day-label"></div>
              <div className="day-label"></div>
            </div>
            <div className="weeks-container">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="week-row">
                  {week.map((day, dayIndex) => {
                    if (day.getTime() === 0) {
                      return <div key={dayIndex} className="day-cell empty"></div>;
                    }
                    
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayData = dataMap.get(dateKey);
                    const intensity = dayData ? getIntensity(dayData.duration) : 0;
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`day-cell intensity-${intensity} ${isToday ? 'today' : ''}`}
                        title={`${format(day, 'MMM d, yyyy')}: ${dayData ? `${Math.round(dayData.duration / 60)}min, ${dayData.sessions} session(s)` : 'No training'}`}
                      >
                        {isToday && <div className="today-indicator"></div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;

