import React from 'react';
import ActionButtons from './ActionButtons';

const AccountsTable = ({ 
  accounts, 
  onEdit, 
  onPasswordChange, 
  onToggleStatus,
  roleBadgeStyle = 'gray',
  isLoading = false
}) => {
  const getBadgeClasses = (style) => {
    switch (style) {
      case 'blue':
        return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'green':
        return 'bg-green-100 text-green-700 ring-green-200';
      case 'orange':
        return 'bg-orange-100 text-orange-700 ring-orange-200';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-700 ring-gray-200';
    }
  };

  const getStatusBadgeClasses = (isActive) => {
    return isActive !== false
      ? 'bg-green-100 text-green-800 ring-green-200'
      : 'bg-red-100 text-red-800 ring-red-200';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No accounts found
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr 
                  key={account.id} 
                  className={`hover:bg-gray-50/70 ${account.isActive === false ? 'opacity-60' : ''}`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{account.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{account.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getBadgeClasses(roleBadgeStyle)}`}>
                      {account.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClasses(account.isActive)}`}>
                      {account.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => onToggleStatus && onToggleStatus(account)}
                      disabled={isLoading}
                      className={`relative cursor-pointer border-2 border-transparent hover:border-2 hover:border-blue-400 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        account.isActive !== false ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          account.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <ActionButtons
                      user={account}
                      onEdit={onEdit}
                      onPasswordChange={onPasswordChange}
                      isLoading={isLoading}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsTable;
