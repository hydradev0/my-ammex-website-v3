import { useState, useMemo, useEffect } from 'react';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import RecordsModal from './RecordsModal';
import ViewDetailsModal from '../Components/ViewDetailsModal';
import EditDetailsModal from '../Components/EditDetailsModal';
import SuccessModal from '../Components/SuccessModal';
import { customerViewConfig, editCustomerConfig } from '../Components/viewConfigs';
import { baseDropdownActions } from '../Components/dropdownActions';
import { Plus } from 'lucide-react';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
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

  // Load customers on component mount and when filter changes (not search term)
  useEffect(() => {
    fetchCustomers('', filterValue);
  }, [filterValue]);

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
          title: 'Customer Archived Successfully!',
          message: 'The customer has been moved to archive and can be restored later.'
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
      header: 'Customer ID',
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'customerName', 
      header: 'Company Name',
      width: 'w-80',
      cellClassName: 'w-80',
      truncate: true
    },
    { 
      key: 'contactName', 
      header: 'Contact Name',
      width: 'w-56',
      cellClassName: 'w-56',
      truncate: true
    },
    { 
      key: 'userEmail', 
      header: 'Email',
      width: 'w-56',  
      cellClassName: 'w-56',
      truncate: true,
      render: (value, customer) => customer?.user?.email || customer?.email1 || ''
    },
    { 
      key: 'telephone1', 
      header: 'Telephone',
      width: 'w-56',
      cellClassName: 'w-56',
      truncate: true
    },
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
  
  // Filter customers based on search term and filter value (local filtering)
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      const matchesSearch = 
        (customer.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.customerId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }, [customers, searchTerm, filterValue]);

  if (loading && customers.length === 0) {
    return (
        <div className="max-w-full mx-15 mt-8 px-5">   
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Customers</h1>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          </div>
        </div>
    );
  }

  return (
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
              (loading ||creatingCustomer || updatingCustomer) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading || creatingCustomer || updatingCustomer}
            onClick={handleNewCustomerClick}
          >
            <Plus className="h-6 w-6 mr-2" />
            <span>New Customer</span>
          </button>
          
          
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
          title="Customer"
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

        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Delete Customer"
          entityName={deleteModal.customerName}
          description="Are you sure you want to delete this customer? The customer will be removed from the system."
          confirmLabel={deletingCustomer ? 'Deleting...' : 'Delete Customer'}
          cancelLabel="Cancel"
          loading={deletingCustomer}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
        
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
  );
}

export default CustomerTable;