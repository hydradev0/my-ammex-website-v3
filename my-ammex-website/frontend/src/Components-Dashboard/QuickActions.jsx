import React from 'react';

const QuickActions = ({ actions }) => {
  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-300 h-[500px]">
      <div className='border-b border-gray-300'>
        <h2 className="text-2xl font-semibold px-6 py-3">Quick Actions</h2>
      </div>
      <div className="flex flex-wrap gap-4 p-4">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.link}
            className={`flex items-center px-5 py-2 border rounded-lg font-medium transition ${action.color}`}
            style={{ minWidth: '180px' }}
          >
            {action.icon && action.icon}
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default QuickActions; 