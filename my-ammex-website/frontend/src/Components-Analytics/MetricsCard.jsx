import React from 'react';

const MetricsCard = ({ title, value, percentageChange, previousMonth }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-600">{title}</h3>
        {percentageChange !== undefined && (
          <span className={`${percentageChange >= 0 ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full text-sm`}>
            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {previousMonth && (
        <p className="text-lg text-gray-500 mt-2">
          vs. {previousMonth} last month
        </p>
      )}
    </div>
  );
};

export default MetricsCard; 