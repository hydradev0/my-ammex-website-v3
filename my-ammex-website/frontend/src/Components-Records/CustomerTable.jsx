import { useState, useMemo, useEffect } from 'react';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import RecordsModal from './RecordsModal';
import ViewDetailsModal from '../Components/ViewDetailsModal';
import EditDetailsModal from '../Components/EditDetailsModal';
import SuccessModal from '../Components/SuccessModal';
import { customerViewConfig, editCustomerConfig } from '../Components/viewConfigs';
import { baseDropdownActions } from '../Components/dropdownActions';
import { Plus, AlertTriangle, X } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';

function CustomerTable() {
  // State for customers data
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    customerName: '',
    customerId: null
  });
  
  // State for success modals
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  

  
  // Fetch customers from API
  const fetchCustomers = async (search = '', filter = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: search || undefined,
        isActive: filter === 'Active Accounts' ? true : filter === 'Inactive Accounts' ? false : undefined
      };
      
      const response = await getCustomers(params);
      
      if (response.success) {
        // Backend should return customers sorted by createdAt DESC (newest first)
        // But we'll add a fallback sort just in case
        const sortedCustomers = response.data.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          // Fallback to ID sorting if no creation date
          return b.id - a.id;
        });
        setCustomers(sortedCustomers);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount and when search/filter changes
  useEffect(() => {
    fetchCustomers(searchTerm, filterValue);
  }, [searchTerm, filterValue]);

  // Handle adding a new customer
  const handleAddCustomer = async (customerData) => {
    try {
      setCreatingCustomer(true);
      setError(null);
      
      // Transform form data to match backend model
      const customerPayload = {
        customerName: customerData.companyName,
        street: customerData.street,
        city: customerData.city,
        postalCode: customerData.postalCode,
        country: customerData.country,
        contactName: customerData.contactName,
        telephone1: customerData.telephone1,
        telephone2: customerData.telephone2,
        email1: customerData.email1,
        email2: customerData.email2
      };
      
      const response = await createCustomer(customerPayload);
      
      if (response.success) {
        // Add new customer to the top of the list
        setCustomers([response.data, ...customers]);
        setIsModalOpen(false);
        setSuccessModal({
          isOpen: true,
          title: 'Customer Added Successfully!',
          message: 'The new customer has been added to your records. You can now view and manage their information.'
        });
      } else {
        setError(response.message || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err.message || 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Handle view customer details
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCustomer(null);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedCustomer(null);
  };

  // Handle new customer button click
  const handleNewCustomerClick = () => {
    setIsEditMode(false);
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

    // Modern confirmation dialog for delete operations
  const showDeleteConfirmation = (customerName, customerId) => {
    setDeleteModal({
      isOpen: true,
      customerName,
      customerId
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteModal.customerId) return;

    try {
      setDeletingCustomer(true);
      setError(null);
      
      const response = await deleteCustomer(deleteModal.customerId);
      
      if (response.success) {
        setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== deleteModal.customerId));
        setDeleteModal({ isOpen: false, customerName: '', customerId: null });
        setSuccessModal({
          isOpen: true,
          title: 'Customer Deleted Successfully!',
          message: 'The customer has been permanently removed from your records.'
        });
      } else {
        setError(response.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err.message || 'An unexpected error occurred while deleting the customer');
    } finally {
      setDeletingCustomer(false);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, customerName: '', customerId: null });
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  // Handle customer updated from EditDetailsModal
  const handleCustomerUpdated = (updatedCustomer) => {
    try {
      setUpdatingCustomer(true);
      setError(null);
      
      setCustomers(customers.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      ));
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      setSuccessModal({
        isOpen: true,
        title: 'Customer Updated Successfully!',
        message: 'The customer information has been updated successfully. You can now view the changes.'
      });
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message || 'Failed to update customer');
    } finally {
      setUpdatingCustomer(false);
    }
  };
  
  // Define columns for the customer table
  const customerColumns = [
    { 
      key: 'customerId', 
      header: 'Customer ID'
    },
    { 
      key: 'customerName', 
      header: 'Customer Name'
    },
    { 
      key: 'contactName', 
      header: 'Contact Name'
    },
    { 
      key: 'email1', 
      header: 'Email'
    },
    { 
      key: 'telephone1', 
      header: 'Telephone'
    },
    { 
      key: 'city', 
      header: 'City'
    },
    { 
      key: 'country', 
      header: 'Country'
    }
  ];
  
  // Custom dropdown actions for customers with view, edit, and delete functionality
  const customCustomerDropdownActions = useMemo(() => {
    return baseDropdownActions.map(action => {
      if (action.id === 'view') {
        return {
          ...action,
          onClick: handleViewCustomer
        };
      } else if (action.id === 'edit') {
        return {
          ...action,
          onClick: handleEditCustomer
        };
      } else if (action.id === 'delete') {
        return {
          ...action,
          onClick: (customer) => {
            showDeleteConfirmation(customer.customerName, customer.id);
          }
        };
      }
      return action;
    });
  }, []);
  
  // Row click handler (optional)
  const handleRowClick = (customer) => {
    console.log('Customer selected:', customer);
    // Add navigation or details view here if needed
  };
  
  // Filter customers based on search term and filter value
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = 
      (customer.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.customerId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.telephone1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.contactName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    let matchesFilter = true;
    if (filterValue === 'Active Accounts') {
      matchesFilter = customer.isActive === true;
    } else if (filterValue === 'Inactive Accounts') {
      matchesFilter = customer.isActive === false;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading && customers.length === 0) {
    return (
      <div className="bg-gray-100">
        <div className="max-w-full mx-15 mt-8 px-5">   
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Customers</h1>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 ">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Customers</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <span className="text-red-800">Error: {error}</span>
          </div>
        )}
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredCustomers.length}
            filterOptions={['Filter by...', 'Active Accounts', 'Inactive Accounts']}
            placeholder="Search customers..."
          />
          
          {/* New Customer Button */}
          <button 
            className={`w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            ${
              (loading || creatingCustomer || updatingCustomer) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading || creatingCustomer || updatingCustomer}
            onClick={handleNewCustomerClick}
          >
            <Plus className="h-6 w-6 mr-2" />
            <span>New Customer</span>
          </button>
          
          {/* Loading Status */}
          {(creatingCustomer || updatingCustomer) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>
                {creatingCustomer ? 'Creating customer...' : 
                 updatingCustomer ? 'Updating customer...' :  ''}
              </span>
            </div>
          )}
        </div>
        
        {/* Generic Table for Customers */}
        <GenericTable 
          data={filteredCustomers}
          columns={customerColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No customers found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={customCustomerDropdownActions}
        />

        {/* New Customer Modal */}
        <RecordsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddCustomer}
        />

        {/* View Customer Modal */}
        <ViewDetailsModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          data={selectedCustomer}
          title={customerViewConfig.title}
          sections={customerViewConfig.sections}
        />

        {/* Edit Customer Modal */}
        <EditDetailsModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCustomer(null);
          }}
          data={selectedCustomer}
          onDataUpdated={handleCustomerUpdated}
          config={editCustomerConfig}
          updateService={updateCustomer}
        />

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Delete Customer</h3>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.customerName}"</span>?
                </p>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  ⚠️ This action cannot be undone. The customer will be permanently removed from the system.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 cursor-pointer border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingCustomer}
                  className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {deletingCustomer ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete Customer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
          title={successModal.title}
          message={successModal.message}
          autoClose={true}
          autoCloseDelay={4000}
        />
        
      </div>
    </div>
  );
}

export default CustomerTable;