import React from 'react';

const ActionButtons = ({ user, onEdit, onPasswordChange, onDelete }) => {
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
      <button
        onClick={() => onDelete(user.id)}
        className="rounded-md px-2 py-1 text-red-600 hover:bg-blue-50 hover:text-red-700"
      >
        Delete
      </button>
    </div>
  );
};

export default ActionButtons;
