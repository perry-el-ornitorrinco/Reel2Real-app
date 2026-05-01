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
    <div className="h-[280px] w-full bg-white rounded-[32px] p-6 shadow-sm border border-gray-200">
      <h4 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">Visualizaciones del Evento</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
            cursor={{ fill: '#F9FAFB' }}
          />
          <Bar dataKey="views" radius={[8, 8, 8, 8]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.views > 700 ? '#FF6B00' : '#F3F4F6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const B2BStatsCard: React.FC<{ label: string; value: string; trend: string }> = ({ label, value, trend }) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-200 flex flex-col gap-2">
    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{value}</span>
    <span className="text-xs text-green-600 font-bold bg-green-50 w-fit px-2 py-1 rounded-full">{trend} vs last week</span>
  </div>
);
