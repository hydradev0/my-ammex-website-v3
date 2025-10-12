import React from 'react';

const MetricsCard = ({ 
  title, 
  value, 
  growth, 
  previousValue, 
  previousLabel = 'yesterday',
  valuePrefix = '',
  valueSuffix = '',
  growthColor = 'green',
  formatValue = (val) => val.toLocaleString(),
  statusIndicator = null,
  subtitle = null
}) => {
  const growthColorClasses = {
    green: 'text-green-500 bg-green-50',
    red: 'text-red-500 bg-red-50',
    yellow: 'text-yellow-500 bg-yellow-50',
    orange: 'text-orange-500 bg-orange-50'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-600">{title}</h3>
        {statusIndicator ? (
          <span className={`${growthColorClasses[statusIndicator.color]} px-2 py-1 rounded-full text-sm`}>
            {statusIndicator.text}
          </span>
        ) : growth !== undefined && (
          <span className={`${growthColorClasses[growthColor]} px-2 py-1 rounded-full text-sm`}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {valuePrefix}{formatValue(value)}{valueSuffix}
      </p>
      {subtitle !== null && (
        <p className="text-md text-gray-500 mt-2">
          <span className={statusIndicator?.color === 'red' ? 'text-red-500' : 'text-gray-500'}>{subtitle}</span>
        </p>
      )}
      {previousValue !== undefined && (
        <p className="text-lg text-gray-500 mt-2">
          vs. {valuePrefix}{formatValue(previousValue)}{valueSuffix} {previousLabel}
        </p>
      )}
    </div>
  );
};

export default MetricsCard; 