import React from 'react';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SalesPerformance = ({ data }) => {
  console.log("SalesPerformance data:", data);
  if (!data || !data.monthlySales) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-5 min-h-[350px]">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <Activity className="h-6 w-6 text-orange-400"/>Sales Performance
      </h3>
      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.monthlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={value => `₱${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="sales" stroke="#f59e42" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesPerformance; 