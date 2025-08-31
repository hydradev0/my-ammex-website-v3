import React from 'react';
import AccountsTable from './AccountsTable';

// Tab Navigation
export const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => setActiveTab('sales')}
          className={`whitespace-nowrap py-2 px-1 cursor-pointer border-b-2 font-medium text-sm ${
            activeTab === 'sales'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Sales Department
        </button>
        <button
          onClick={() => setActiveTab('warehouse')}
          className={`whitespace-nowrap py-2 px-1 cursor-pointer border-b-2 font-medium text-sm ${
            activeTab === 'warehouse'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Warehouse Department
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`whitespace-nowrap py-2 px-1 cursor-pointer border-b-2 font-medium text-sm ${
            activeTab === 'clients'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Client Services
        </button>
      </nav>
    </div>
  );
};

// Sales Department Tab
export const SalesDepartmentTab = ({
  accounts,
  onEdit,
  onPasswordChange,
  onDelete,
  onCreateNew
}) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sales Department</h1>
          <p className="mt-1 text-sm text-gray-500">Manage Sales Marketing staff accounts.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span>New Sales Account</span>
        </button>
      </div>

      <AccountsTable
        accounts={accounts}
        onEdit={onEdit}
        onPasswordChange={onPasswordChange}
        onDelete={onDelete}
        roleBadgeStyle="green"
      />
    </>
  );
};

// Warehouse Department Tab
export const WarehouseDepartmentTab = ({
  accounts,
  onEdit,
  onPasswordChange,
  onDelete,
  onCreateNew
}) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Warehouse Department</h1>
          <p className="mt-1 text-sm text-gray-500">Manage Warehouse Supervisor staff accounts.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span>New Warehouse Account</span>
        </button>
      </div>

      <AccountsTable
        accounts={accounts}
        onEdit={onEdit}
        onPasswordChange={onPasswordChange}
        onDelete={onDelete}
        roleBadgeStyle="orange"
      />
    </>
  );
};

// Client Services Tab
export const ClientServicesTab = ({
  accounts,
  onEdit,
  onPasswordChange,
  onDelete,
  onCreateNew
}) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Client Services</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client user accounts.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center cursor-pointer gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span>New Client Account</span>
        </button>
      </div>

      <AccountsTable
        accounts={accounts}
        onEdit={onEdit}
        onPasswordChange={onPasswordChange}
        onDelete={onDelete}
        roleBadgeStyle="blue"
      />
    </>
  );
};
