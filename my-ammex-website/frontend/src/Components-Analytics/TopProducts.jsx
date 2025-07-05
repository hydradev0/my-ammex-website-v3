import React from 'react';

const TopProducts = ({ title = "Top Products", data = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-300 p-5 min-h-[250px] flex flex-col">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Monthly Sales</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((product, index) => (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.revenue}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.sales}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    product.growth >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.growth >= 0 ? '+' : ''}{product.growth}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopProducts; 