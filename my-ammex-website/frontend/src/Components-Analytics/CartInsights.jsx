import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Eye } from 'lucide-react';
import AnalyticsModal from './AnalyticsModal';
import { analyticsData } from '../data/analyticsData';

const COLORS = ['#10B981', '#EF4444'];

// Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-gray-800">{label}</p>
        <p style={{ color: payload[0].color }}>
          {payload[0].name}: {payload[0].value}
          {payload[0].name === 'count' ? ' items' : '%'}
        </p>
      </div>
    );
  }
  return null;
};

const CartInsights = () => {
  // Data from analyticsData
  const abandonedProducts = analyticsData.cartInsights.abandonedProducts;
  const conversionRate = analyticsData.cartInsights.conversionRate;
  const itemsAbandoned = analyticsData.cartInsights.itemsAbandoned;
  const cartConversion = analyticsData.cartInsights.cartConversion;

  // Modal open state
  const [viewAllOpen, setViewAllOpen] = useState(false);

  // Render a single row for the modal's paginated table using flex layout
  const renderAbandonedProduct = (item, idx, opts) => {
    if (!item) {
      return (
        <div className="text-center text-gray-500 py-4">No abandoned products found.</div>
      );
    }
    
    // Render header for the first row of each page
    if (opts.startIndex === idx) {
      return (
        <>
          {/* Header Row */}
          <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wider">
            <div className="w-16 text-left">Rank</div>
            <div className="flex-1 text-left">Product Name</div>
            <div className="w-40 text-left">Abandoned Count</div>
            <div className="w-20 text-center">Action</div>
          </div>
          {/* Data Row */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50">
            <div className="w-16 text-sm text-gray-900">{idx + 1}</div>
            <div className="flex-1 text-sm text-gray-900">{item.name}</div>
            <div className="w-32 text-sm text-gray-900 text-center">{item.count}</div>
            <div className="w-20 text-center">
              <button className="text-blue-600 hover:underline text-sm font-medium">Details</button>
            </div>
          </div>
        </>
      );
    }
    
    // Render just the data row for subsequent items
    return (
      <div className="flex items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50">
        <div className="w-16 text-sm text-gray-900">{idx + 1}</div>
        <div className="flex-1 text-sm text-gray-900">{item.name}</div>
        <div className="w-32 text-sm text-gray-900 text-center">{item.count}</div>
        <div className="w-20 text-center">
          <button className="text-blue-600 hover:underline text-sm font-medium">Details</button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-5 min-h-[250px] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Cart Insights</h2>
        <p className="text-gray-600 text-sm">Monitor cart abandonment and conversion rates</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{itemsAbandoned}</div>
          <div className="text-sm text-gray-600">Items Abandoned</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Abandoned Products */}
        <div className="lg:col-span-2 relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Top Abandoned Products</h3>
            <button
              className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
              onClick={() => setViewAllOpen(true)}
              aria-label="View all abandoned products"
            >
              <Eye className="w-4 h-4 mr-1" /> View All
            </button>
          </div>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer>
              <BarChart
                data={abandonedProducts.slice(0, 4)}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* View All Modal */}
          <AnalyticsModal
            isOpen={viewAllOpen}
            onClose={() => setViewAllOpen(false)}
            title="All Abandoned Products"
            items={abandonedProducts}
            itemsPerPage={8}
            showPagination={abandonedProducts.length > 8}
            renderItem={renderAbandonedProduct}
          />
        </div>

        {/* Conversion Rate */}
        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Conversion Overview</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <div style={{ width: '140px', height: '140px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={cartConversion}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      cx="50%"
                      cy="50%"
                    >
                      {cartConversion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{conversionRate}%</div>
                  <div className="text-sm text-gray-500">Converted</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {cartConversion.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  ></div>
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartInsights;
