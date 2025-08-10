import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { unitDropdownActions } from '../Components/dropdownActions';
import { createUnit, updateUnit, deleteUnit } from '../services/inventoryService';

function UnitTable({ units, setUnits }) {
  // State for new unit input
  const [newUnitName, setNewUnitName] = useState('');

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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
      header: 'Name'
    }
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
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await createUnit({ name: newUnitName.trim() });
      
      if (response.success) {
        // Add the new unit to the list
        setUnits([...units, response.data]);
        setNewUnitName('');
        setSuccess('Unit added successfully');
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

  // Handle unit update
  const handleUpdateUnit = async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateUnit(id, updatedData);
      
      if (response.success) {
        // Update the unit in the list
        const updatedUnits = units.map(unit => 
          unit.id === id ? response.data : unit
        );
        setUnits(updatedUnits);
        setSuccess('Unit updated successfully');
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
    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteUnit(id);
      
      if (response.success) {
        // Remove the unit from the list
        const updatedUnits = units.filter(unit => unit.id !== id);
        setUnits(updatedUnits);
        setSuccess('Unit deleted successfully');
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
          onClick: (unit) => {
            // For now, just log. You can implement an edit modal later
            console.log('Edit unit:', unit);
            // TODO: Implement edit modal
          }
        };
      }
      if (action.id === 'delete') {
        return {
          ...action,
          onClick: (unit) => {
            if (window.confirm(`Are you sure you want to delete "${unit.name}"?`)) {
              handleDeleteUnit(unit.id);
            }
          }
        };
      }
      return action;
    });
  }, []);
  
  // Filter units based on search term
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const searchLower = searchTerm.toLowerCase();
      return unit.name.toLowerCase().includes(searchLower);
    });
  }, [units, searchTerm]);

  return (
    <div className="w-full min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto px-5 py-8">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Unit</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col gap-4 mb-6">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredUnits.length}
            filterOptions={['Filter by...']}
            placeholder="Search units..."
          />
          
          {/* New Unit Input Field and Success Message */}
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <form onSubmit={handleAddUnit} className="w-full sm:w-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="Enter new unit..."
                  className="flex-1 w-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  className={`bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
            {success && (
              <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded animate-fade-in">
                {success}
              </div>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Generic Table for Units */}
        <GenericTable 
          data={filteredUnits}
          columns={unitColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No units found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={enhancedDropdownActions}
          width="max-w-7xl"
        />
      </div>
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
