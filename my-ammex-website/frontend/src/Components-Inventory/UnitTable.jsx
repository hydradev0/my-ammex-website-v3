import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import GenericTable from '../Components/GenericTable';
import ScrollLock from '../Components/ScrollLock';
import { unitDropdownActions } from '../Components/dropdownActions';
import { createUnit, updateUnit, deleteUnit } from '../services/inventoryService';

function UnitTable({ units, setUnits }) {
  // State for new unit input
  const [newUnitName, setNewUnitName] = useState('');

  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for edit modal
  const [editingUnit, setEditingUnit] = useState(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Auto-remove success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-remove error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Define columns for the units table
  const unitColumns = [
    { 
      key: 'name', 
      header: 'Unit Name',
      width: 'w-180',
      cellClassName: 'w-180 font-medium text-gray-900',
      truncate: true
    },
  ];
  
  // Row click handler
  const handleRowClick = (unit) => {
    console.log('Unit selected:', unit);
    // Add navigation or details view here if needed
  };

  // Handle adding new unit
  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) {
      setError('Unit name cannot be empty');
      return;
    }

    // Check for duplicate names
    const isDuplicate = units.some(unit => 
      unit.name.toLowerCase() === newUnitName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setError('A unit with this name already exists');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await createUnit({ name: newUnitName.trim() });
      
      if (response.success) {
        // Add the new unit to the list
        setUnits([...units, response.data]);
        setNewUnitName('');
        setSuccess(`Unit "${response.data.name}" added successfully`);
      } else {
        setError(response.message || 'Failed to add unit');
      }
    } catch (err) {
      console.error('Error adding unit:', err);
      setError(err.message || 'Failed to add unit');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit modal open
  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setEditUnitName(unit.name);
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUnit(null);
    setEditUnitName('');
  };

  // Handle unit update
  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    
    if (!editUnitName.trim()) {
      setError('Unit name cannot be empty');
      return;
    }

    // Check for duplicate names (excluding the current unit)
    const isDuplicate = units.some(unit => 
      unit.id !== editingUnit.id && 
      unit.name.toLowerCase() === editUnitName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setError('A unit with this name already exists');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await updateUnit(editingUnit.id, { 
        name: editUnitName.trim() 
      });
      
      if (response.success) {
        // Update the unit in the list
        const updatedUnits = units.map(unit => 
          unit.id === editingUnit.id ? response.data : unit
        );
        setUnits(updatedUnits);
        setSuccess(`Unit updated to "${response.data.name}" successfully`);
        handleCloseEditModal();
      } else {
        setError(response.message || 'Failed to update unit');
      }
    } catch (err) {
      console.error('Error updating unit:', err);
      setError(err.message || 'Failed to update unit');
    } finally {
      setLoading(false);
    }
  };

  // Handle unit deletion
  const handleDeleteUnit = async (id) => {
    const unitToDelete = units.find(unit => unit.id === id);
    
    if (!window.confirm(`Are you sure you want to delete "${unitToDelete?.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteUnit(id);
      
      if (response.success) {
        // Remove the unit from the list
        const updatedUnits = units.filter(unit => unit.id !== id);
        setUnits(updatedUnits);
        setSuccess(`Unit "${unitToDelete?.name}" deleted successfully`);
      } else {
        setError(response.message || 'Failed to delete unit');
      }
    } catch (err) {
      console.error('Error deleting unit:', err);
      setError(err.message || 'Failed to delete unit');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced dropdown actions with API integration
  const enhancedDropdownActions = useMemo(() => {
    return unitDropdownActions.map(action => {
      if (action.id === 'edit') {
        return {
          ...action,
          onClick: handleEditUnit
        };
      }
      if (action.id === 'delete') {
        return {
          ...action,
          onClick: (unit) => handleDeleteUnit(unit.id)
        };
      }
      return action;
    });
  }, []);
  
  // Filter units based on search term
  const filteredUnits = useMemo(() => {
    if (!searchTerm.trim()) return units;
    
    return units.filter(unit => {
      const searchLower = searchTerm.toLowerCase();
      return unit.name.toLowerCase().includes(searchLower);
    });
  }, [units, searchTerm]);

  // Edit Modal Component with Portal and ScrollLock
  const EditModal = () => {
    if (!showEditModal) return null;

    const modalContent = (
      <>
        <ScrollLock active={showEditModal} />
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full"
          style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Unit</h3>
              <p className="text-sm text-gray-600 mt-1">
                Modify the unit name below
              </p>
            </div>
            
            <form onSubmit={handleUpdateUnit} className="p-6">
              <div className="mb-4">
                <label htmlFor="editUnitName" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name
                </label>
                <input
                  id="editUnitName"
                  type="text"
                  value={editUnitName}
                  onChange={(e) => setEditUnitName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter unit name..."
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !editUnitName.trim()}
                >
                  {loading ? 'Updating...' : 'Update Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );

    return createPortal(modalContent, document.body);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto px-5 py-8">   
        {/* Header Section */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Units</h1>
        </div>
        
        {/* Alerts Section */}
        <div className="space-y-3 mb-4">
          {error && (
            <div className="flex items-center p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto">
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 cursor-pointer hover:text-red-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="flex items-center p-4 bg-green-50 border-l-4 border-green-400 rounded-md animate-pulse">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content Card */}
        <div className="bg-gray-50 rounded-lg">
          {/* Search and Add Section */}
          <div className="py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                  placeholder="Search units..."
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Add Unit Form */}
              <form onSubmit={handleAddUnit} className="flex gap-2 min-w-0">
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="Add new unit..."
                  className="flex-1 min-w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                  disabled={loading || !newUnitName.trim()}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add Unit'
                  )}
                </button>
              </form>
            </div>
            
          </div>
          
          {/* Table Section */}
          <div className="overflow-hidden">
            <GenericTable 
              data={filteredUnits}
              columns={unitColumns}
              onRowClick={handleRowClick}
              pagination={true}
              itemsPerPage={7}
              emptyMessage={
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {searchTerm ? 'No units found' : 'No units yet'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? `Try adjusting your search term "${searchTerm}"`
                      : 'Get started by adding your first unit above'
                    }
                  </p>
                </div>
              }
              alternateRowColors={true}
              dropdownActions={enhancedDropdownActions}
              width="max-w-7xl"
            />
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      <EditModal />
    </div>
  );
}

UnitTable.propTypes = {
  units: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  setUnits: PropTypes.func.isRequired
};

export default UnitTable;