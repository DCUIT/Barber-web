import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * RevenueChart Component
 * Hiển thị biểu đồ cột cho doanh thu và số lượng lịch hẹn.
 * Dữ liệu đầu vào: Array<{ name: string, revenue: number, count: number }>
 */
export default function RevenueChart({ data }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <i className="fas fa-chart-line text-green-500"></i>
        Thống Kê Doanh Thu & Lịch Hẹn (30 ngày qua)
      </h3>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              fontSize={12} 
              tickFormatter={(value) => value.split('-').slice(1).reverse().join('/')}
            />
            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              cursor={{ fill: '#f3f4f6' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Bar 
              yAxisId="left" 
              dataKey="revenue" 
              name="Doanh thu (đ)" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={30}
            />
            <Bar 
              yAxisId="right" 
              dataKey="count" 
              name="Số lịch hẹn" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}