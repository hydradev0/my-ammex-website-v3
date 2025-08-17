import { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Search, Filter } from 'lucide-react';
import PropTypes from 'prop-types';

function ProductSpecsTable({ 
  product = null, 
  onSave = () => {},
  onCancel = () => {},
  isEditMode = false 
}) {
  // Initialize product data from prop or use mock data
  const [productData, setProductData] = useState(() => {
    if (product) {
      // If product prop is provided, use it and add default specifications
      return {
        ...product,
        specifications: product.specifications || [
          { id: 1, name: 'Model', value: 'Standard', type: 'text', required: true },
          { id: 2, name: 'Material', value: 'Standard', type: 'text', required: false },
          { id: 3, name: 'Dimensions', value: 'Standard', type: 'text', required: false }
        ]
      };
    }
    
    // Mock product data for UI demonstration
    return {
      id: 1,
      itemCode: 'ITM-001',
      itemName: 'Industrial Pump Model X-2000',
      vendor: 'Vendor A',
      category: 'Industrial Equipment',
      specifications: [
        { id: 1, name: 'Model', value: 'X-2000', type: 'text', required: true },
        { id: 2, name: 'Power Rating', value: '5.5 kW', type: 'text', required: true },
        { id: 3, name: 'Flow Rate', value: '200 L/min', type: 'text', required: true },
        { id: 4, name: 'Max Pressure', value: '8 bar', type: 'text', required: true },
        { id: 5, name: 'Material', value: 'Stainless Steel', type: 'select', required: false },
        { id: 6, name: 'Weight', value: '45 kg', type: 'text', required: false },
        { id: 7, name: 'Dimensions', value: '400x300x250 mm', type: 'text', required: false },
        { id: 8, name: 'Warranty', value: '2 years', type: 'text', required: false },
        { id: 9, name: 'Accessories', value: 'Mounting brackets, User manual', type: 'textarea', required: false },
        { id: 10, name: 'Certifications', value: 'ISO 9001, CE Mark', type: 'text', required: false }
      ]
    };
  });

  const [editingSpec, setEditingSpec] = useState(null);
  const [newSpec, setNewSpec] = useState({ name: '', value: '', type: 'text', required: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Update productData when product prop changes
  useEffect(() => {
    if (product) {
      setProductData({
        ...product,
        specifications: product.specifications || [
          { id: 1, name: 'Model', value: 'Standard', type: 'text', required: true },
          { id: 2, name: 'Material', value: 'Standard', type: 'text', required: false },
          { id: 3, name: 'Dimensions', value: 'Standard', type: 'text', required: false }
        ]
      });
    }
  }, [product]);

  // Specification types for the dropdown
  const specTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'date', label: 'Date' }
  ];

  // Filter specifications based on search and type
  const filteredSpecs = productData.specifications.filter(spec => {
    const matchesSearch = spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spec.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || spec.type === filterType;
    return matchesSearch && matchesType;
  });

  // Handle adding new specification
  const handleAddSpec = () => {
    if (newSpec.name.trim() && newSpec.value.trim()) {
      const spec = {
        id: Date.now(),
        ...newSpec,
        name: newSpec.name.trim(),
        value: newSpec.value.trim()
      };
      
      setProductData(prev => ({
        ...prev,
        specifications: [...prev.specifications, spec]
      }));
      
      setNewSpec({ name: '', value: '', type: 'text', required: false });
      setShowAddForm(false);
    }
  };

  // Handle editing specification
  const handleEditSpec = (spec) => {
    setEditingSpec({ ...spec });
  };

  // Handle saving edited specification
  const handleSaveSpec = () => {
    if (editingSpec && editingSpec.name.trim() && editingSpec.value.trim()) {
      setProductData(prev => ({
        ...prev,
        specifications: prev.specifications.map(spec =>
          spec.id === editingSpec.id ? editingSpec : spec
        )
      }));
      setEditingSpec(null);
    }
  };

  // Handle deleting specification
  const handleDeleteSpec = (specId) => {
    if (window.confirm('Are you sure you want to delete this specification?')) {
      setProductData(prev => ({
        ...prev,
        specifications: prev.specifications.filter(spec => spec.id !== specId)
      }));
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingSpec(null);
  };

  // Toggle row expansion
  const toggleRowExpansion = (specId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(specId)) {
      newExpanded.delete(specId);
    } else {
      newExpanded.add(specId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle save all changes
  const handleSaveAll = () => {
    onSave(productData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Details</h1>
          <p className="text-gray-600 mt-1">Manage product specifications and details</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Product Basic Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Item Code</label>
            <p className="text-gray-900 font-medium">{productData.itemCode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Item Name</label>
            <p className="text-gray-900 font-medium">{productData.itemName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Category</label>
            <p className="text-gray-900 font-medium">{productData.category}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Vendor</label>
            <p className="text-gray-900 font-medium">{productData.vendor}</p>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Product Specifications</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4" />
            Add Specification
          </button>
        </div>

        {/* Add New Specification Form */}
        {showAddForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-md font-medium text-blue-800 mb-3">Add New Specification</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newSpec.name}
                  onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Model, Power Rating"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newSpec.type}
                  onChange={(e) => setNewSpec({ ...newSpec, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {specTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                <input
                  type="text"
                  value={newSpec.value}
                  onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., X-2000"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSpec.required}
                    onChange={(e) => setNewSpec({ ...newSpec, required: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
                <button
                  onClick={handleAddSpec}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {specTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Specifications Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specification Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSpecs.map((spec) => (
                <tr key={spec.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRowExpansion(spec.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedRows.has(spec.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {editingSpec?.id === spec.id ? (
                      <input
                        type="text"
                        value={editingSpec.name}
                        onChange={(e) => setEditingSpec({ ...editingSpec, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{spec.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingSpec?.id === spec.id ? (
                      <input
                        type="text"
                        value={editingSpec.value}
                        onChange={(e) => setEditingSpec({ ...editingSpec, value: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-700">{spec.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingSpec?.id === spec.id ? (
                      <select
                        value={editingSpec.type}
                        onChange={(e) => setEditingSpec({ ...editingSpec, type: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {specTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {specTypes.find(t => t.value === spec.type)?.label || spec.type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingSpec?.id === spec.id ? (
                      <input
                        type="checkbox"
                        checked={editingSpec.required}
                        onChange={(e) => setEditingSpec({ ...editingSpec, required: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        spec.required 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {spec.required ? 'Required' : 'Optional'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingSpec?.id === spec.id ? (
                        <>
                          <button
                            onClick={handleSaveSpec}
                            className="text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditSpec(spec)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpec(spec.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredSpecs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              {searchTerm || filterType !== 'all' 
                ? 'No specifications match your search criteria.' 
                : 'No specifications added yet. Click "Add Specification" to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Total Specifications: <span className="font-medium">{productData.specifications.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Required: <span className="font-medium text-red-600">
                {productData.specifications.filter(s => s.required).length}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Last Modified: <span className="font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

ProductSpecsTable.propTypes = {
  product: PropTypes.object,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  isEditMode: PropTypes.bool
};

export default ProductSpecsTable;
