import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import SearchFilter from '../Components/SearchFilter';
import { MoreHorizontal } from 'lucide-react';
import Table from './Table';

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
  
  // Custom row action for units table
  const customRowAction = (unit) => (
    <button 
      className="cursor-pointer text-blue-900 hover:text-blue-600"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Unit actions:', unit);
      }}
    >
      <MoreHorizontal className="h-6 w-6" />
    </button>
  );
  
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-5 py-8">   
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Unit</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="w-full">
            <div className="flex items-center gap-2">
              <SearchFilter 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterValue={filterValue}
                setFilterValue={setFilterValue}
                customerCount={filteredUnits.length}
                filterOptions={['Filter by...']}
                placeholder="Search units..."
              />
            </div>
          </div>
          
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
        
        {/* Table for Units */}
        <div className="w-full">
          <Table 
            data={filteredUnits}
            onRowClick={handleRowClick}
            customRowAction={customRowAction}
            pagination={true}
            itemsPerPage={10}
            emptyMessage="No units found"
            className="mb-8"
            alternateRowColors={true}
          />
        </div>
      </div>
    </div>
  );
}

export default UnitTable;
