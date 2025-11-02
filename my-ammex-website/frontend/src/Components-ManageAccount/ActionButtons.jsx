import React from 'react';

const ActionButtons = ({ user, onEdit, onPasswordChange, onToggleStatus, isLoading }) => {
  const handleToggle = () => {
    if (onToggleStatus) {
      onToggleStatus(user);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => onEdit(user)}
        className="rounded-md px-2 py-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      >
        Edit
      </button>
      <button
        onClick={() => onPasswordChange(user)}
        className="rounded-md px-2 py-1 text-green-600 hover:bg-green-50 hover:text-green-700"
      >
        Password
      </button>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={user.isActive !== false}
          onChange={handleToggle}
          disabled={isLoading}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        <span className="ml-2 text-sm font-medium text-gray-700">
          {user.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </label>
    </div>
  );
};

export default ActionButtons;
