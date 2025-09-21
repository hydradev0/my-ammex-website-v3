import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { X, RotateCcw } from 'lucide-react';
import ScrollLock from './ScrollLock';
import { useAuth } from '../contexts/AuthContext';
import { getArchivedItems, restoreItem } from '../services/inventoryService';
import { getCustomers, updateCustomer } from '../services/customerService';
import { getArchivedAccounts, restoreAccount } from '../services/authService';
import { getArchivedSuppliers, restoreSupplier } from '../services/supplierService';

function ArchiveModal({ isOpen = false, onClose, onDataRestored }) {
  const { user } = useAuth();
  const role = user?.role;

  // Tabs by role
  const showItemsTab = role === 'Admin' || role === 'Warehouse Supervisor';
  const showCustomersTab = role === 'Admin' || role === 'Sales Marketing';
  const showSuppliersTab = role === 'Admin' || role === 'Warehouse Supervisor';
  const showAccountsTab = role === 'Admin';

  const defaultTab = showItemsTab ? 'Items' : showCustomersTab ? 'Customers' : showSuppliersTab ? 'Suppliers' : 'Accounts';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(showItemsTab ? 'Items' : showCustomersTab ? 'Customers' : showSuppliersTab ? 'Suppliers' : 'Accounts');
    }
  }, [isOpen, showItemsTab, showCustomersTab, showSuppliersTab]);

  // Items state (server-side pagination only)
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [restoringItems, setRestoringItems] = useState(new Set());

  const fetchArchivedItemsData = async ({ page = itemsPage, limit = itemsPerPage } = {}) => {
    try {
      setItemsLoading(true);
      setItemsError('');
      const resp = await getArchivedItems({ page, limit });
      if (resp?.success) {
        setItems(resp.data || []);
        setItemsPage(resp.pagination?.currentPage || page);
        setItemsTotalPages(resp.pagination?.totalPages || 1);
        setItemsTotal(resp.pagination?.totalItems || 0);
      } else {
        setItemsError(resp?.message || 'Failed to load archived items');
      }
    } catch (err) {
      setItemsError(err.message || 'Failed to load archived items');
    } finally {
      setItemsLoading(false);
    }
  };

  // Fetch when modal opens or pagination changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'Items' || !showItemsTab) return;
    fetchArchivedItemsData({ page: itemsPage, limit: itemsPerPage });
  }, [isOpen, activeTab, itemsPage, itemsPerPage, showItemsTab]);

  const handleRestoreItem = async (item) => {
    try {
      setRestoringItems(prev => new Set([...prev, item.id]));
      const resp = await restoreItem(item.id);
      if (resp?.success) {
        // Refresh current page
        fetchArchivedItemsData();
        // Notify parent component that data was restored
        if (onDataRestored) {
          onDataRestored('item', item);
        }
      }
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setRestoringItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Customers state (server-side pagination only)
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState('');
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPerPage] = useState(10);
  const [customersTotalPages, setCustomersTotalPages] = useState(1);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [restoringCustomers, setRestoringCustomers] = useState(new Set());

  const fetchArchivedCustomersData = async ({ page = customersPage, limit = customersPerPage } = {}) => {
    try {
      setCustomersLoading(true);
      setCustomersError('');
      const resp = await getCustomers({ page, limit, isActive: false });
      if (resp?.success) {
        setCustomers(resp.data || []);
        setCustomersPage(resp.pagination?.currentPage || page);
        setCustomersTotalPages(resp.pagination?.totalPages || 1);
        setCustomersTotal(resp.pagination?.totalItems || 0);
      } else {
        setCustomersError(resp?.message || 'Failed to load archived customers');
      }
    } catch (err) {
      setCustomersError(err.message || 'Failed to load archived customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  // Fetch customers when modal opens or pagination changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'Customers' || !showCustomersTab) return;
    fetchArchivedCustomersData({ page: customersPage, limit: customersPerPage });
  }, [isOpen, activeTab, customersPage, customersPerPage, showCustomersTab]);

  const handleRestoreCustomer = async (customer) => {
    try {
      setRestoringCustomers(prev => new Set([...prev, customer.id]));
      const resp = await updateCustomer(customer.id, { isActive: true });
      if (resp?.success) {
        // Refresh current page
        fetchArchivedCustomersData();
        // Notify parent component that data was restored
        if (onDataRestored) {
          onDataRestored('customer', customer);
        }
      }
    } catch (err) {
      console.error('Restore customer failed:', err);
    } finally {
      setRestoringCustomers(prev => {
        const newSet = new Set(prev);
        newSet.delete(customer.id);
        return newSet;
      });
    }
  };

  // Suppliers state (server-side pagination only)
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState('');
  const [suppliersPage, setSuppliersPage] = useState(1);
  const [suppliersPerPage] = useState(10);
  const [suppliersTotalPages, setSuppliersTotalPages] = useState(1);
  const [suppliersTotal, setSuppliersTotal] = useState(0);
  const [restoringSuppliers, setRestoringSuppliers] = useState(new Set());

  const fetchArchivedSuppliersData = async ({ page = suppliersPage, limit = suppliersPerPage } = {}) => {
    try {
      setSuppliersLoading(true);
      setSuppliersError('');
      const resp = await getArchivedSuppliers({ page, limit });
      if (resp?.success) {
        setSuppliers(resp.data || []);
        setSuppliersPage(resp.pagination?.currentPage || page);
        setSuppliersTotalPages(resp.pagination?.totalPages || 1);
        setSuppliersTotal(resp.pagination?.totalItems || 0);
      } else {
        setSuppliersError(resp?.message || 'Failed to load archived suppliers');
      }
    } catch (err) {
      setSuppliersError(err.message || 'Failed to load archived suppliers');
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Fetch suppliers when modal opens or pagination changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'Suppliers' || !showSuppliersTab) return;
    fetchArchivedSuppliersData({ page: suppliersPage, limit: suppliersPerPage });
  }, [isOpen, activeTab, suppliersPage, suppliersPerPage, showSuppliersTab]);

  const handleRestoreSupplier = async (supplier) => {
    try {
      setRestoringSuppliers(prev => new Set([...prev, supplier.id]));
      const resp = await restoreSupplier(supplier.id);
      if (resp?.success) {
        // Refresh current page
        fetchArchivedSuppliersData();
        // Notify parent component that data was restored
        if (onDataRestored) {
          onDataRestored('supplier', supplier);
        }
      }
    } catch (err) {
      console.error('Restore supplier failed:', err);
    } finally {
      setRestoringSuppliers(prev => {
        const newSet = new Set(prev);
        newSet.delete(supplier.id);
        return newSet;
      });
    }
  };

  // Accounts state (server-side pagination only)
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsPerPage] = useState(10);
  const [accountsTotalPages, setAccountsTotalPages] = useState(1);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [restoringAccounts, setRestoringAccounts] = useState(new Set());

  const fetchArchivedAccountsData = async ({ page = accountsPage, limit = accountsPerPage } = {}) => {
    try {
      setAccountsLoading(true);
      setAccountsError('');
      const resp = await getArchivedAccounts({ page, limit });
      if (resp?.success) {
        setAccounts(resp.data || []);
        setAccountsPage(resp.pagination?.currentPage || page);
        setAccountsTotalPages(resp.pagination?.totalPages || 1);
        setAccountsTotal(resp.pagination?.totalItems || 0);
      } else {
        setAccountsError(resp?.message || 'Failed to load archived accounts');
      }
    } catch (err) {
      setAccountsError(err.message || 'Failed to load archived accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  // Fetch accounts when modal opens or pagination changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'Accounts' || !showAccountsTab) return;
    fetchArchivedAccountsData({ page: accountsPage, limit: accountsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, accountsPage, accountsPerPage, showAccountsTab]);

  const handleRestoreAccount = async (account) => {
    try {
      setRestoringAccounts(prev => new Set([...prev, account.id]));
      const resp = await restoreAccount(account.id);
      if (resp?.success) {
        // Refresh current page
        fetchArchivedAccountsData();
        // Notify parent component that data was restored
        if (onDataRestored) {
          onDataRestored('account', account);
        }
      }
    } catch (err) {
      console.error('Restore account failed:', err);
    } finally {
      setRestoringAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(account.id);
        return newSet;
      });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <ScrollLock active={isOpen} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
      style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Archive</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="flex gap-2 border-b border-gray-200">
            {showItemsTab && (
              <button
                className={`px-3 cursor-pointer py-2 -mb-px border-b-2 ${activeTab === 'Items' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('Items')}
              >
                Items
              </button>
            )}
            {showCustomersTab && (
              <button
                className={`px-3 cursor-pointer py-2 -mb-px border-b-2 ${activeTab === 'Customers' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('Customers')}
              >
                Customers
              </button>
            )}
            {showSuppliersTab && (
              <button
                className={`px-3 cursor-pointer py-2 -mb-px border-b-2 ${activeTab === 'Suppliers' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('Suppliers')}
              >
                Suppliers
              </button>
            )}
            {showAccountsTab && (
              <button
                className={`px-3 cursor-pointer py-2 -mb-px border-b-2 ${activeTab === 'Accounts' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('Accounts')}
              >
                Accounts
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto">
          {activeTab === 'Items' && showItemsTab && (
            <div className="flex flex-col gap-4">
              {/* Error */}
              {itemsError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{itemsError}</div>
              )}

              {/* List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                  <div>Item Code</div>
                  <div>Model No.</div>
                  <div>Category</div>
                  <div>Archived At</div>
                  <div className="text-right">Action</div>
                </div>
                <div>
                  {itemsLoading ? (
                    <div className="p-6 text-center text-gray-600">Loading...</div>
                  ) : items.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">No archived items</div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.id} className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="truncate" title={item.itemCode}>{item.itemCode}</div>
                        <div className="truncate" title={item.modelNo}>{item.modelNo}</div>
                        <div className="truncate" title={item.category?.name || '-'}>{item.category?.name || '-'}</div>
                        <div>{item.archivedAt ? new Date(item.archivedAt).toLocaleString() : '-'}</div>
                        <div className="text-right">
                          <button
                            onClick={() => handleRestoreItem(item)}
                            disabled={restoringItems.has(item.id)}
                            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className={`h-4 w-4 ${restoringItems.has(item.id) ? 'animate-spin' : ''}`} /> 
                            {restoringItems.has(item.id) ? 'Restoring...' : 'Restore'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Simple Pagination */}
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div>Total: {itemsTotal}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setItemsPage(Math.max(1, itemsPage - 1))}
                    disabled={itemsPage <= 1}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>Page {itemsPage} of {itemsTotalPages}</span>
                  <button
                    onClick={() => setItemsPage(Math.min(itemsTotalPages, itemsPage + 1))}
                    disabled={itemsPage >= itemsTotalPages}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Customers' && showCustomersTab && (
            <div className="flex flex-col gap-4">
              {/* Error */}
              {customersError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{customersError}</div>
              )}

              {/* List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                  <div>Customer ID</div>
                  <div>Company Name</div>
                  <div>Email</div>
                  <div>Archived At</div>
                  <div className="text-right">Action</div>
                </div>
                <div>
                  {customersLoading ? (
                    <div className="p-6 text-center text-gray-600">Loading...</div>
                  ) : customers.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">No archived customers</div>
                  ) : (
                    customers.map((customer, idx) => (
                      <div key={customer.id} className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="truncate" title={customer.customerId}>{customer.customerId}</div>
                        <div className="truncate" title={customer.customerName}>{customer.customerName}</div>
                        <div className="truncate" title={customer.email1 || '-'}>{customer.email1 || '-'}</div>
                        <div>{customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : '-'}</div>
                        <div className="text-right">
                          <button
                            onClick={() => handleRestoreCustomer(customer)}
                            disabled={restoringCustomers.has(customer.id)}
                            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className={`h-4 w-4 ${restoringCustomers.has(customer.id) ? 'animate-spin' : ''}`} /> 
                            {restoringCustomers.has(customer.id) ? 'Restoring...' : 'Restore'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Simple Pagination */}
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div>Total: {customersTotal}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustomersPage(Math.max(1, customersPage - 1))}
                    disabled={customersPage <= 1}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>Page {customersPage} of {customersTotalPages}</span>
                  <button
                    onClick={() => setCustomersPage(Math.min(customersTotalPages, customersPage + 1))}
                    disabled={customersPage >= customersTotalPages}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Suppliers' && showSuppliersTab && (
            <div className="flex flex-col gap-4">
              {/* Error */}
              {suppliersError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{suppliersError}</div>
              )}

              {/* List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                  <div>Supplier ID</div>
                  <div>Company Name</div>
                  <div>Contact Name</div>
                  <div>Archived At</div>
                  <div className="text-right">Action</div>
                </div>
                <div>
                  {suppliersLoading ? (
                    <div className="p-6 text-center text-gray-600">Loading...</div>
                  ) : suppliers.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">No archived suppliers</div>
                  ) : (
                    suppliers.map((supplier, idx) => (
                      <div key={supplier.id} className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="truncate" title={supplier.supplierId}>{supplier.supplierId}</div>
                        <div className="truncate" title={supplier.companyName}>{supplier.companyName}</div>
                        <div className="truncate" title={supplier.contactName || '-'}>{supplier.contactName || '-'}</div>
                        <div>{supplier.archivedAt ? new Date(supplier.archivedAt).toLocaleString() : '-'}</div>
                        <div className="text-right">
                          <button
                            onClick={() => handleRestoreSupplier(supplier)}
                            disabled={restoringSuppliers.has(supplier.id)}
                            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className={`h-4 w-4 ${restoringSuppliers.has(supplier.id) ? 'animate-spin' : ''}`} /> 
                            {restoringSuppliers.has(supplier.id) ? 'Restoring...' : 'Restore'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Simple Pagination */}
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div>Total: {suppliersTotal}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSuppliersPage(Math.max(1, suppliersPage - 1))}
                    disabled={suppliersPage <= 1}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>Page {suppliersPage} of {suppliersTotalPages}</span>
                  <button
                    onClick={() => setSuppliersPage(Math.min(suppliersTotalPages, suppliersPage + 1))}
                    disabled={suppliersPage >= suppliersTotalPages}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Accounts' && showAccountsTab && (
            <div className="flex flex-col gap-4">
              {/* Error */}
              {accountsError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{accountsError}</div>
              )}

              {/* List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Department</div>
                  <div>Deleted At</div>
                  <div className="text-right">Action</div>
                </div>
                <div>
                  {accountsLoading ? (
                    <div className="p-6 text-center text-gray-600">Loading...</div>
                  ) : accounts.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">No archived accounts</div>
                  ) : (
                    accounts.map((account, idx) => (
                      <div key={account.id} className={`grid grid-cols-6 gap-2 px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="truncate" title={account.name}>{account.name}</div>
                        <div className="truncate" title={account.email}>{account.email}</div>
                        <div className="truncate" title={account.role}>{account.role}</div>
                        <div className="truncate" title={account.department}>{account.department}</div>
                        <div>{account.updatedAt ? new Date(account.updatedAt).toLocaleString() : '-'}</div>
                        <div className="text-right">
                          <button
                            onClick={() => handleRestoreAccount(account)}
                            disabled={restoringAccounts.has(account.id)}
                            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className={`h-4 w-4 ${restoringAccounts.has(account.id) ? 'animate-spin' : ''}`} /> 
                            {restoringAccounts.has(account.id) ? 'Restoring...' : 'Restore'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Simple Pagination */}
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div>Total: {accountsTotal}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAccountsPage(Math.max(1, accountsPage - 1))}
                    disabled={accountsPage <= 1}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>Page {accountsPage} of {accountsTotalPages}</span>
                  <button
                    onClick={() => setAccountsPage(Math.min(accountsTotalPages, accountsPage + 1))}
                    disabled={accountsPage >= accountsTotalPages}
                    className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

ArchiveModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onDataRestored: PropTypes.func
};

export default ArchiveModal;


