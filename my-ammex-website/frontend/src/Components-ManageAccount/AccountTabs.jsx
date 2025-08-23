import React from 'react';
import AccountsTable from './AccountsTable';

// Tab Navigation
export const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => setActiveTab('staff')}
          className={`whitespace-nowrap py-2 px-1 cursor-pointer border-b-2 font-medium text-sm ${
            activeTab === 'staff'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Staff Accounts
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`whitespace-nowrap py-2 px-1 cursor-pointer border-b-2 font-medium text-sm ${
            activeTab === 'clients'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Client Accounts
        </button>
      </nav>
    </div>
  );
};

// Staff Accounts Tab
export const StaffAccountsTab = ({
  employees,
  onEdit,
  onPasswordChange,
  onDelete,
  onCreateNew
}) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Staff Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Create, edit, and remove employee accounts and roles.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span>New Staff Account</span>
        </button>
      </div>

      <AccountsTable
        accounts={employees}
        onEdit={onEdit}
        onPasswordChange={onPasswordChange}
        onDelete={onDelete}
        roleBadgeStyle="gray"
      />
    </>
  );
};

// Client Accounts Tab
export const ClientAccountsTab = ({
  clients,
  onEdit,
  onPasswordChange,
  onDelete,
  onCreateNew
}) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Client Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client user accounts with Client role.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span>New Client Account</span>
        </button>
      </div>

      <AccountsTable
        accounts={clients}
        onEdit={onEdit}
        onPasswordChange={onPasswordChange}
        onDelete={onDelete}
        roleBadgeStyle="blue"
      />
    </>
  );
};
