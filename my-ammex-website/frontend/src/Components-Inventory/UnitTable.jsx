import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { unitDropdownActions } from '../Components/dropdownActions';

function UnitTable() {
  // State for units data
  const [units, setUnits] = useState([
    {
      id: 1,
      name: 'Piece',
    },
    {
      id: 2,
      name: 'Box',
    },
    {
      id: 3,
      name: 'Kilogram',
    },
    {
      id: 4,
      name: 'Liter',
    },
    {
      id: 5,
      name: 'Meter',
    }
  ]);

  // State for new unit input
  const [newUnitName, setNewUnitName] = useState('');

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Auto-remove success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
  const handleAddUnit = (e) => { 
    e.preventDefault();
    if (!newUnitName.trim()) {
      setError('Unit name cannot be empty');
      return;
    }
    
    const newUnit = {
      id: units.length + 1,
      name: newUnitName.trim()
    };
    
    setUnits([...units, newUnit]);
    setNewUnitName('');
    setSuccess('Unit added successfully');
    setError(null);
  };
  
  // Filter units based on search term
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const searchLower = searchTerm.toLowerCase();
      return unit.name.toLowerCase().includes(searchLower);
    });
  }, [units, searchTerm]);

  return (
    <div className="bg-gray-100 min-h-screen">
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
                />
                <button 
                  type="submit"
                  className="bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors"
                >
                  Add
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
          dropdownActions={unitDropdownActions}
          width="max-w-7xl"
        />
      </div>
    </div>
  );
}

export default UnitTable;
