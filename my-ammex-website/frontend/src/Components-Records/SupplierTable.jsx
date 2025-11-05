import { useState, useMemo, useEffect } from 'react';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import RecordsModal from './RecordsModal';
import ViewDetailsModal from '../Components/ViewDetailsModal';
import EditDetailsModal from '../Components/EditDetailsModal';
import SuccessModal from '../Components/SuccessModal';
import { supplierViewConfig, editSupplierConfig } from '../Components/viewConfigs';
import { baseDropdownActions } from '../Components/dropdownActions';
import { Plus } from 'lucide-react';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import { formatPhoneNumber } from '../utils/phoneFormatter';

function SupplierTable() {
  const { refreshTriggers } = useDataRefresh();
  
  // State for suppliers data
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [updatingSupplier, setUpdatingSupplier] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    supplierName: '',
    supplierId: null
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
  
  // Fetch suppliers from API
  const fetchSuppliers = async (search = '', filter = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: search || undefined,
        isActive: filter === 'Active Accounts' ? true : filter === 'Inactive Accounts' ? false : undefined,
        limit: 1000 // Request all suppliers instead of default 10
      };
      
      const response = await getSuppliers(params);
      
      if (response.success) {
        // Backend should return suppliers sorted by createdAt DESC (newest first)
        // But we'll add a fallback sort just in case
        const sortedSuppliers = response.data.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          // Fallback to ID sorting if no creation date
          return b.id - a.id;
        });
        setSuppliers(sortedSuppliers);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers on component mount and when filter changes (not search term)
  useEffect(() => {
    fetchSuppliers('', filterValue);
  }, [filterValue]);

  // Listen for data refresh events
  useEffect(() => {
    const suppliersRefreshTrigger = refreshTriggers.suppliers;
    if (suppliersRefreshTrigger) {
      // Refresh suppliers when they are restored
      fetchSuppliers(searchTerm, filterValue);
    }
  }, [refreshTriggers.suppliers, searchTerm, filterValue]);

  // Handle adding a new supplier
  const handleAddSupplier = async (supplierData) => {
    try {
      setCreatingSupplier(true);
      setError(null);
      
      // Transform form data to match backend model
      const supplierPayload = {
        companyName: supplierData.companyName,
        street: supplierData.street,
        city: supplierData.city,
        postalCode: supplierData.postalCode,
        country: supplierData.country,
        contactName: supplierData.contactName,
        telephone1: supplierData.telephone1,
        telephone2: supplierData.telephone2,
        email1: supplierData.email1,
        email2: supplierData.email2
      };
      
      const response = await createSupplier(supplierPayload);
      
      if (response.success) {
        // Add new supplier to the top of the list
        setSuppliers([response.data, ...suppliers]);
        setIsModalOpen(false);
        setSuccessModal({
          isOpen: true,
          title: 'Supplier Added Successfully!',
          message: 'The new supplier has been added to your records. You can now view and manage their information.'
        });
      } else {
        setError(response.message || 'Failed to create supplier');
      }
    } catch (err) {
      console.error('Error creating supplier:', err);
      setError(err.message || 'Failed to create supplier');
    } finally {
      setCreatingSupplier(false);
    }
  };

  // Handle view supplier details
  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setIsViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedSupplier(null);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedSupplier(null);
  };

  // Handle new supplier button click
  const handleNewSupplierClick = () => {
    setIsEditMode(false);
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  // Modern confirmation dialog for delete operations
  const showDeleteConfirmation = (supplierName, supplierId) => {
    setDeleteModal({
      isOpen: true,
      supplierName,
      supplierId
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteModal.supplierId) return;

    try {
      setDeletingSupplier(true);
      setError(null);
      
      const response = await deleteSupplier(deleteModal.supplierId);
      
      if (response.success) {
        setSuppliers(prevSuppliers => prevSuppliers.filter(s => s.id !== deleteModal.supplierId));
        setDeleteModal({ isOpen: false, supplierName: '', supplierId: null });
        setSuccessModal({
          isOpen: true,
          title: 'Supplier Archived Successfully!',
          message: 'The supplier has been moved to archive and can be restored later.'
        });
      } else {
        setError(response.message || 'Failed to delete supplier');
      }
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError(err.message || 'An unexpected error occurred while deleting the supplier');
    } finally {
      setDeletingSupplier(false);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, supplierName: '', supplierId: null });
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  // Handle supplier updated from EditDetailsModal
  const handleSupplierUpdated = (updatedSupplier) => {
    try {
      setUpdatingSupplier(true);
      setError(null);
      
      setSuppliers(suppliers.map(supplier => 
        supplier.id === updatedSupplier.id ? updatedSupplier : supplier
      ));
      setIsEditModalOpen(false);
      setSelectedSupplier(null);
      setSuccessModal({
        isOpen: true,
        title: 'Supplier Updated Successfully!',
        message: 'The supplier information has been updated successfully. You can now view the changes.'
      });
    } catch (err) {
      console.error('Error updating supplier:', err);
      setError(err.message || 'Failed to update supplier');
    } finally {
      setUpdatingSupplier(false);
    }
  };
  
  // Define columns for the supplier table
  const supplierColumns = [
    { 
      key: 'supplierId', 
      header: 'Supplier ID',
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'companyName', 
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
      key: 'email1', 
      header: 'Email',
      width: 'w-56',
      cellClassName: 'w-56',
      truncate: true
    },
    { 
      key: 'telephone1', 
      header: 'Telephone',
      width: 'w-56',
      cellClassName: 'w-56',
      truncate: true,
      render: (value) => formatPhoneNumber(value)
    },
  ];
  
  // Custom dropdown actions for suppliers with view, edit, and delete functionality
  const customSupplierDropdownActions = useMemo(() => {
    return baseDropdownActions.map(action => {
      if (action.id === 'view') {
        return {
          ...action,
          onClick: handleViewSupplier
        };
      } else if (action.id === 'edit') {
        return {
          ...action,
          onClick: handleEditSupplier
        };
      } else if (action.id === 'delete') {
        return {
          ...action,
          onClick: (supplier) => {
            showDeleteConfirmation(supplier.companyName, supplier.id);
          }
        };
      }
      return action;
    });
  }, []);
  
  // Row click handler (optional)
  const handleRowClick = (supplier) => {
    console.log('Supplier selected:', supplier);
    // Add navigation or details view here if needed
  };
  
  // Filter suppliers based on search term and filter value (local filtering)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Search filter
      const matchesSearch = 
        (supplier.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.supplierId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.email1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.telephone1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.contactName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      let matchesFilter = true;
      if (filterValue === 'Active Accounts') {
        matchesFilter = supplier.isActive === true;
      } else if (filterValue === 'Inactive Accounts') {
        matchesFilter = supplier.isActive === false;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [suppliers, searchTerm, filterValue]);

  if (loading && suppliers.length === 0) {
    return (
        <div className="max-w-full mx-15 mt-8 px-5">   
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Suppliers</h1>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading suppliers...</p>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Suppliers</h1>
        
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
            customerCount={filteredSuppliers.length}
            filterOptions={['Filter by...', 'Active Accounts', 'Inactive Accounts']}
            placeholder="Search suppliers by name, email, etc."
          />
          
          {/* New Supplier Button */}
          <button 
            className={`w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            ${
              (loading ||creatingSupplier || updatingSupplier) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading || creatingSupplier || updatingSupplier}
            onClick={handleNewSupplierClick}
          >
            <Plus className="h-6 w-6 mr-2" />
            <span>New Supplier</span>
          </button>
          
          
        </div>
        
        {/* Generic Table for Suppliers */}
        <GenericTable 
          data={filteredSuppliers}
          columns={supplierColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No suppliers found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={customSupplierDropdownActions}
        />

        {/* New Supplier Modal */}
        <RecordsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddSupplier}
          title="Supplier"
          buttonText="Add Supplier"
          existingSuppliers={suppliers}
        />

        {/* View Supplier Modal */}
        <ViewDetailsModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          data={selectedSupplier}
          title={supplierViewConfig.title}
          sections={supplierViewConfig.sections}
        />

        {/* Edit Supplier Modal */}
        <EditDetailsModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSupplier(null);
          }}
          data={selectedSupplier}
          onDataUpdated={handleSupplierUpdated}
          config={editSupplierConfig}
          updateService={updateSupplier}
          existingSuppliers={suppliers} // provide for duplicate checks
        />

        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Delete Supplier"
          entityName={deleteModal.supplierName}
          description="Are you sure you want to delete this supplier? The supplier will be removed from the system."
          confirmLabel={deletingSupplier ? 'Deleting...' : 'Delete Supplier'}
          cancelLabel="Cancel"
          loading={deletingSupplier}
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

export default SupplierTable;