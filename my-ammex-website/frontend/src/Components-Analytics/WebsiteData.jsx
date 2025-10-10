import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer
} from 'recharts';
import { Eye, MousePointer, ShoppingCart } from 'lucide-react';
import RoleBasedLayout from '../Components/RoleBasedLayout';

const WebsiteData = () => {
  const categoryTrafficData = [
    { category: 'Electronics', clicks: 4500, percentage: 28 },
    { category: 'Clothing', clicks: 3200, percentage: 20 },
    { category: 'Home & Garden', clicks: 2800, percentage: 17 },
    { category: 'Sports', clicks: 2100, percentage: 13 },
    { category: 'Books', clicks: 1900, percentage: 12 },
    { category: 'Toys', clicks: 1600, percentage: 10 }
  ];

  const topClickedItems = [
    { name: 'Wireless Headphones', clicks: 1250 },
    { name: 'Running Shoes', clicks: 980 },
    { name: 'Smart Watch', clicks: 875 },
    { name: 'Yoga Mat', clicks: 720 },
    { name: 'Coffee Maker', clicks: 650 }
  ];

  const cartAdditionsData = [
    { name: 'Phone Case', additions: 450, revenue: 13500 },
    { name: 'USB Cable', additions: 380, revenue: 7600 },
    { name: 'Water Bottle', additions: 320, revenue: 9600 },
    { name: 'Notebook Set', additions: 290, revenue: 5800 },
    { name: 'Desk Lamp', additions: 250, revenue: 12500 }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <RoleBasedLayout />
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category Traffic Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Category Traffic Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryTrafficData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.category} (${entry.percentage}%)`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="clicks"
              >
                {categoryTrafficData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Most Clicked Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-pink-600" />
            Most Clicked Items
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClickedItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="clicks" fill="#ec4899" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Added to Cart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            Most Added to Cart
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cartAdditionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="additions" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
    </>
  );
};

export default WebsiteData;
