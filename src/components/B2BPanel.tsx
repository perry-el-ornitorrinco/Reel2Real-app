import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Mon', views: 400 },
  { name: 'Tue', views: 300 },
  { name: 'Wed', views: 600 },
  { name: 'Thu', views: 800 },
  { name: 'Fri', views: 500 },
  { name: 'Sat', views: 900 },
  { name: 'Sun', views: 700 },
];

export const HeatmapChart: React.FC = () => {
  return (
    <div className="h-64 w-full bg-white rounded-3xl p-4 shadow-sm border border-black/5">
      <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Visualizaciones del Evento</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="views" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.views > 700 ? '#007AFF' : '#e5e7eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const B2BStatsCard: React.FC<{ label: string; value: string; trend: string }> = ({ label, value, trend }) => (
  <div className="bg-white p-6 rounded-[25px] shadow-sm border border-black/5 flex flex-col gap-1">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className="text-3xl font-bold text-gray-900">{value}</span>
    <span className="text-xs text-green-500 font-medium">{trend} vs last week</span>
  </div>
);
