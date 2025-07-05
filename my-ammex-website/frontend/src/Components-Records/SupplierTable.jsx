// SupplierList.jsx
import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Phone } from 'lucide-react';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from './GenericTable';
import RecordsModal from './RecordsModal';
function SupplierTable() {
  // State for suppliers data
  const [suppliers, setSuppliers] = useState([
    {
      id: 'SUP001',
      companyName: 'Tech Components Ltd',
      contactPerson: 'David Miller',
      category: 'Electronics',
      rating: 4.8,
      email: 'david@techcomponents.com',
      telephone: '(555) 111-2233'
    },
    {
      id: 'SUP002',
      companyName: 'Office Supplies Co',
      contactPerson: 'Amanda Chen',
      category: 'Office Supplies',
      rating: 4.2,
      email: 'amanda@officesupplies.com',
      telephone: '(555) 222-3344'
    },
    {
      id: 'SUP003',
      companyName: 'Global Logistics',
      contactPerson: 'James Wilson',
      category: 'Transportation',
      rating: 3.9,
      email: 'jwilson@globallogistics.com',
      telephone: '(555) 333-4455'
    },
    {
      id: 'SUP004',
      companyName: 'Fresh Produce Inc',
      contactPerson: 'Maria Rodriguez',
      category: 'Food & Beverage',
      rating: 4.6,
      email: 'maria@freshproduce.com',
      telephone: '(555) 444-5566'
    },
    {
      id: 'SUP005',
      companyName: 'Industrial Parts Co',
      contactPerson: 'Thomas Zhang',
      category: 'Manufacturing',
      rating: 4.1,
      email: 'tzhang@industrialparts.com',
      telephone: '(555) 555-6677'
    }
  ]);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for category filter
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
  // Define columns for the supplier table
  const supplierColumns = [
    { 
      key: 'id', 
      header: 'ID'
    },
    { 
      key: 'companyName', 
      header: 'Company Name'
    },
    { 
      key: 'contactPerson', 
      header: 'Contact Person'
    },
    { 
      key: 'category', 
      header: 'Category',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {value}
        </span>
      )
    },
    { 
      key: 'rating', 
      header: 'Rating',
      render: (value) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= Math.floor(value) ? "text-yellow-500" : "text-gray-300"}>
              ★
            </span>
          ))}
          <span className="ml-1 text-sm text-gray-600">({value})</span>
        </div>
      )
    }
  ];
  
  // Custom row actions for supplier table
  const customRowAction = (supplier) => (
    <div className="flex items-center space-x-3">
      <button 
        className="text-blue-700 hover:text-blue-800"
        onClick={(e) => {
          e.stopPropagation();
          console.log('View supplier details:', supplier);
        }}
      >
        <Eye className="h-4 w-4" />
      </button>
      <button 
        className="text-green-700 hover:text-green-800"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Call supplier:', supplier);
        }}
      >
        <Phone className="h-4 w-4" />
      </button>
      <button 
        className="text-gray-700 hover:text-gray-800"
        onClick={(e) => {
          e.stopPropagation();
          console.log('More options for:', supplier);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
  
  // Get unique categories for filter
  const categories = ['All Categories', ...new Set(suppliers.map(supplier => supplier.category))];
  
  // Handle adding a new supplier (placeholder)
  const handleAddSupplier = () => {
    setIsModalOpen(true);
    // Add implementation for new supplier modal
  };
  
  // Filter suppliers based on search term and category filter
  const filteredSuppliers = suppliers.filter(supplier => {
    // Search filter
    const matchesSearch = 
      supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'All Categories' || supplier.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-gray-100">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Suppliers</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Category Filter */}
            <select
              className="w-full sm:w-48 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            
            <div className="text-sm text-gray-600 self-center hidden sm:block">
              {filteredSuppliers.length} suppliers found
            </div>
          </div>
          
          {/* New Supplier Button */}
          <button 
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            onClick={handleAddSupplier}
          >
            <Plus className="h-4 w-4" />
            <span>New Supplier</span>
          </button>
        </div>
        
        {/* Supplier count for mobile */}
        <div className="text-sm text-gray-600 mb-3 sm:hidden">
          {filteredSuppliers.length} suppliers found
        </div>
        
        {/* Generic Table for Suppliers */}
        <GenericTable 
          data={filteredSuppliers}
          columns={supplierColumns}
          customRowAction={customRowAction}
          pagination={true}
          itemsPerPage={10}
          emptyMessage="No suppliers found"
          className="mb-8"
          alternateRowColors={true}
        />
        
        {/* New Supplier Modal */}
        {isModalOpen && (
          <RecordsModal 
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddSupplier}
          />
        )}
      </div>
    </div>
  );
}

export default SupplierTable;