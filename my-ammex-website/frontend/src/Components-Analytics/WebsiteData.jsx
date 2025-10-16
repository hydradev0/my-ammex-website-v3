import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer
} from 'recharts';
import { Eye, MousePointer, ShoppingCart, BarChart3, ArrowLeft, ChartBar } from 'lucide-react';
import RoleBasedLayout from '../Components/RoleBasedLayout';

const WebsiteData = () => {
  const navigate = useNavigate();
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
    { name: 'Phone Case', additions: 450, value: 13500 },
    { name: 'USB Cable', additions: 380, value: 7600 },
    { name: 'Water Bottle', additions: 320, value: 9600 },
    { name: 'Notebook Set', additions: 290, value: 5800 },
    { name: 'Desk Lamp', additions: 250, value: 12500 }
  ];

  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const generateInsights = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setInsights({
        trends: [
          'Electronics category leads with 28% of traffic - consider expanding product offerings',
          'Running Shoes and Smart Watches show strong click-through rates - potential for bundled promotions',
          'USB Cables have high cart additions but lower value - opportunity for upselling premium variants'
        ],
        recommendations: [
          'Focus marketing efforts on Electronics and Clothing categories',
          'Create "Trending Now" section featuring Wireless Headphones and Running Shoes',
          'Implement "Frequently Bought Together" for Phone Cases and USB Cables',
          'Consider discount bundles for Home & Garden items to boost cart additions'
        ]
      });
      setIsGenerating(false);
    }, 2000);
  };

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
    <div className="min-h-screen p-8 ">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center -mx-36 gap-4 mb-5">
            <button
              onClick={() => navigate('/home/analytics')}
              className="group flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2 -mt-17">
            <ChartBar className="w-8 h-8 text-indigo-600" />
            Website Traffics
          </h1>
          <p className="text-gray-600 -mt-2">Analyze website traffic patterns and user behavior insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* AI Insights Button */}
      <div className="max-w-6xl mx-auto mt-6 flex justify-center">
        <button
          onClick={generateInsights}
          disabled={isGenerating}
          className="group cursor-pointer relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="flex items-center gap-3">
            <svg 
              className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isGenerating ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              )}
            </svg>
            {isGenerating ? 'Generating Insights...' : 'Generate AI Insights & Recommendations'}
          </span>
          <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Insights Display */}
      {insights && (
        <div className="max-w-6xl mx-auto mt-6 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-sm border border-purple-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Key Trends
              </h4>
              <ul className="space-y-2">
                {insights.trends.map((trend, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{trend}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-pink-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recommendations
              </h4>
              <ul className="space-y-2">
                {insights.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-pink-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
};

export default WebsiteData;