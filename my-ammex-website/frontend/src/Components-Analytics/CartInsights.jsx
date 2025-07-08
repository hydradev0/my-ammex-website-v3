import React from 'react';
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

// Default data moved to component props

const COLORS = ['#10B981', '#EF4444'];

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

const CartInsights = ({ data = {} }) => {
  // Default data structure
  const {
    conversionRate = 34,
    itemsAbandoned = 205,
    abandonedProducts = [
      { name: 'Product A', count: 80 },
      { name: 'Product B', count: 65 },
      { name: 'Product C', count: 40 },
      { name: 'Product D', count: 20 },
    ],
    cartConversion = [
      { name: 'Converted', value: 34 },
      { name: 'Abandoned', value: 66 },
    ]
  } = data;

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
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Top Abandoned Products</h3>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer>
              <BarChart 
                data={abandonedProducts} 
                layout="vertical" 
                margin={{ left: 50, right: 20, top: 10, bottom: 10 }}
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
                  width={50}
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
