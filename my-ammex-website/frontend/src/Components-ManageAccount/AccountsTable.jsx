import React from 'react';
import ActionButtons from './ActionButtons';

const AccountsTable = ({ 
  accounts, 
  onEdit, 
  onPasswordChange, 
  onDelete, 
  roleBadgeStyle = 'gray' 
}) => {
  const getBadgeClasses = (style) => {
    switch (style) {
      case 'blue':
        return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-700 ring-gray-200';
    }
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50/70">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{account.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{account.email}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getBadgeClasses(roleBadgeStyle)}`}>
                    {account.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <ActionButtons
                    user={account}
                    onEdit={onEdit}
                    onPasswordChange={onPasswordChange}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsTable;
