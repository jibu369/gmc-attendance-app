import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AttendanceRecord } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface MonthlySummaryChartProps {
    records: AttendanceRecord[];
    title: string;
    color: string;
}

const MonthlySummaryChart: React.FC<MonthlySummaryChartProps> = ({ records, title, color }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const data = useMemo(() => {
        const monthlyData: { [key: string]: { total: number, present: number } } = {};

        records.forEach(record => {
            const date = new Date(record.date + 'T00:00:00');
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { total: 0, present: 0 };
            }
            monthlyData[monthKey].total++;
            if (record.present) {
                monthlyData[monthKey].present++;
            }
        });

        return Object.entries(monthlyData)
            .map(([monthKey, { total, present }]) => {
                const [year, month] = monthKey.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
                return {
                    name: `${monthName} '${year.slice(2)}`,
                    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
                };
            })
            .sort((a, b) => {
                const [aYear, aMonth] = a.name.split("'");
                const [bYear, bMonth] = b.name.split("'");
                if (aYear !== bYear) return aYear > bYear ? 1: -1;
                const monthA = new Date(`${aMonth} 1, 20${aYear}`).getMonth();
                const monthB = new Date(`${bMonth} 1, 20${bYear}`).getMonth();
                return monthA - monthB;
            });

    }, [records]);

    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                 <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100 mb-4 text-center">{title}</h3>
                <div className="flex items-center justify-center h-56 text-gray-500 dark:text-gray-400">
                    <p>No attendance data available to show summary.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-80">
            <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100 mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
                    <XAxis dataKey="name" tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 12 }} />
                    <YAxis unit="%" tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 12 }} />
                    <Tooltip
                        cursor={{ fill: 'rgba(128, 128, 128, 0.2)' }}
                        contentStyle={{ 
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: isDark ? '#e5e7eb' : '#1f2937'
                        }}
                    />
                    <Legend wrapperStyle={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                    <Bar dataKey="percentage" name="Attendance" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlySummaryChart;