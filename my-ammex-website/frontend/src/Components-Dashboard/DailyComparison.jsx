import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasDailyComparisonAccess } from '../utils/roleManager';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const DailyComparison = ({ metrics }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only show for Admin and Sales Marketing roles
  if (!hasDailyComparisonAccess(user?.role)) {
    return null;
  }

  // Prepare data for bar charts
  const salesComparisonData = [
    {
      name: 'Yesterday',
      value: metrics.comparison?.yesterday?.sales || 0,
      label: 'Yesterday'
    },
    {
      name: 'Today',
      value: metrics.sales?.total || 0,
      label: 'Today'
    }
  ];

  const ordersComparisonData = [
    {
      name: 'Yesterday',
      value: metrics.comparison?.yesterday?.orders || 0,
      label: 'Yesterday'
    },
    {
      name: 'Today',
      value: metrics.orders?.total || 0,
      label: 'Today'
    }
  ];

  // Get max value for scaling
  const getMaxValue = (data) => {
    const max = Math.max(...data.map(d => d.value));
    return max > 0 ? Math.ceil(max * 1.1) : 1;
  };

  const salesMax = getMaxValue(salesComparisonData);
  const ordersMax = getMaxValue(ordersComparisonData);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{payload[0].payload.label}</p>
          <p className="text-blue-600 font-medium">
            {payload[0].name === 'Sales' ? '₱' : ''}
            {payload[0].value.toLocaleString()}
            {payload[0].name === 'Orders' ? ' orders' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // if (loading) {
  //   return (
  //     <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-300">
  //       <div className='border-b border-gray-300'>
  //         <h2 className="text-2xl font-semibold px-6 py-3">Daily Comparison</h2>
  //       </div>
  //       <div className="p-6 flex items-center justify-center">
  //         <div className="text-gray-600">Loading daily comparison...</div>
  //       </div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-300">
  //       <div className='border-b border-gray-300'>
  //         <h2 className="text-2xl font-semibold px-6 py-3">Daily Comparison</h2>
  //       </div>
  //       <div className="p-6 flex items-center justify-center">
  //         <div className="text-red-600">Error loading daily comparison: {error}</div>
  //       </div>
  //     </div>
  //   );
  // }

  const renderSalesMarketingComparison = () => (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700">Sales Performance</h3>
        
        {/* Sales Comparison Bar Chart */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesComparisonData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={[0, salesMax]}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `₱${(value / 1000).toFixed(0)}K`;
                  return `₱${value}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {salesComparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#94a3b8' : '#10b981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Today:</span>
            <span className="font-semibold text-green-600">
              ₱{(metrics.sales?.total || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Yesterday:</span>
            <span className="font-semibold text-gray-700">
              ₱{(metrics.comparison?.yesterday?.sales || 0).toLocaleString()}
            </span>
          </div>
          {(metrics.sales?.growth || 0) !== 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth:</span>
              <span className={`font-semibold ${
                (metrics.sales?.growth || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(metrics.sales?.growth || 0) > 0 ? '+' : ''}
                {(metrics.sales?.growth || 0).toFixed(1)}%
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Avg Order Value:</span>
            <span className="font-semibold text-blue-600">
              ₱{(metrics.sales?.averageOrderValue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700">Order Performance</h3>
        
        {/* Orders Comparison Bar Chart */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersComparisonData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={[0, ordersMax]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {ordersComparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#94a3b8' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Today:</span>
            <span className="font-semibold text-blue-600">
              {metrics.orders?.total || 0} orders
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Yesterday:</span>
            <span className="font-semibold text-gray-700">
              {metrics.comparison?.yesterday?.orders || 0} orders
            </span>
          </div>
          {(metrics.orders?.growth || 0) !== 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth:</span>
              <span className={`font-semibold ${
                (metrics.orders?.growth || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(metrics.orders?.growth || 0) > 0 ? '+' : ''}
                {(metrics.orders?.growth || 0).toFixed(1)}%
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending Orders:</span>
            <span className="font-semibold text-orange-600">
              {metrics.orders?.pending || 0}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const renderAdminComparison = () => (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700">Sales Performance</h3>
        
        {/* Sales Comparison Bar Chart */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesComparisonData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={[0, salesMax]}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `₱${(value / 1000).toFixed(0)}K`;
                  return `₱${value}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {salesComparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#94a3b8' : '#10b981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Today:</span>
            <span className="font-semibold text-green-600">
              ₱{(metrics.sales?.total || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Yesterday:</span>
            <span className="font-semibold text-gray-700">
              ₱{(metrics.comparison?.yesterday?.sales || 0).toLocaleString()}
            </span>
          </div>
          {(metrics.sales?.growth || 0) !== 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth:</span>
              <span className={`font-semibold ${
                (metrics.sales?.growth || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(metrics.sales?.growth || 0) > 0 ? '+' : ''}
                {(metrics.sales?.growth || 0).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700">Order Performance</h3>
        
        {/* Orders Comparison Bar Chart */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersComparisonData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={[0, ordersMax]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {ordersComparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#94a3b8' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Today:</span>
            <span className="font-semibold text-blue-600">
              {metrics.orders?.total || 0} orders
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Yesterday:</span>
            <span className="font-semibold text-gray-700">
              {metrics.comparison?.yesterday?.orders || 0} orders
            </span>
          </div>
          {(metrics.orders?.growth || 0) !== 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth:</span>
              <span className={`font-semibold ${
                (metrics.orders?.growth || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(metrics.orders?.growth || 0) > 0 ? '+' : ''}
                {(metrics.orders?.growth || 0).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderWarehouseComparison = () => (
    <>
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-700">Stock Status</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Low Stock:</span>
          <span className="font-semibold text-yellow-600">
            {metrics.inventory?.lowStock || 0} items
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Out of Stock:</span>
          <span className="font-semibold text-red-600">
            {metrics.inventory?.outOfStock || 0} items
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Reorder Pending:</span>
          <span className="font-semibold text-orange-600">
            {metrics.inventory?.reorderPending || 0} items
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-700">Inventory Value</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Stock Value:</span>
          <span className="font-semibold text-green-600">
            ₱{(metrics.inventory?.totalStockValue || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Critical Items:</span>
          <span className="font-semibold text-red-600">
            {metrics.inventory?.critical || 0} items
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Stock Health:</span>
          <span className={`font-semibold ${
            (metrics.inventory?.critical || 0) === 0 && (metrics.inventory?.lowStock || 0) < 5 
              ? 'text-green-600' 
              : (metrics.inventory?.critical || 0) > 0 
                ? 'text-red-600' 
                : 'text-yellow-600'
          }`}>
            {(metrics.inventory?.critical || 0) === 0 && (metrics.inventory?.lowStock || 0) < 5 
              ? 'Good' 
              : (metrics.inventory?.critical || 0) > 0 
                ? 'Critical' 
                : 'Warning'}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Comparison</h2>
      <div className="grid grid-cols-2 gap-6">
        {user?.role === 'Warehouse Supervisor' 
          ? renderWarehouseComparison() 
          : user?.role === 'Sales Marketing'
          ? renderSalesMarketingComparison()
          : renderAdminComparison()
        }
      </div>
      
      {/* Additional insights for Admin users */}
      {user?.role === 'Admin' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Performance Insights</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Avg Order Value:</span>
                <span className="font-semibold">
                  ₱{(metrics.sales?.averageOrderValue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Orders:</span>
                <span className="font-semibold text-orange-600">
                  {metrics.orders?.pending || 0}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Active Customers:</span>
                <span className="font-semibold">
                  {metrics.customers?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Signups:</span>
                <span className="font-semibold text-green-600">
                  {metrics.customers?.newSignups || 0}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Low Stock Items:</span>
                <span className="font-semibold text-yellow-600">
                  {metrics.inventory?.lowStock || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Critical Items:</span>
                <span className="font-semibold text-red-600">
                  {metrics.inventory?.critical || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyComparison;
