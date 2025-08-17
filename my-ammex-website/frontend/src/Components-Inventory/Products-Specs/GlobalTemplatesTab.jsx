import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

function GlobalTemplatesTab() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'model',
      displayName: 'Model',
      type: 'text',
      defaultValue: '',
      required: true,
      order: 1,
      categoryId: null,
      isActive: true,
      description: 'Product model number or identifier'
    },
    {
      id: 2,
      name: 'power_rating',
      displayName: 'Power Rating',
      type: 'text',
      defaultValue: '',
      required: true,
      order: 2,
      categoryId: null,
      isActive: true,
      description: 'Power consumption or output rating'
    },
    {
      id: 3,
      name: 'material',
      displayName: 'Material',
      type: 'select',
      defaultValue: 'Standard',
      options: ['Standard', 'Premium', 'Industrial', 'Custom'],
      required: false,
      order: 3,
      categoryId: null,
      isActive: true,
      description: 'Primary material used in construction'
    },
    {
      id: 4,
      name: 'dimensions',
      displayName: 'Dimensions',
      type: 'text',
      defaultValue: '',
      required: false,
      order: 4,
      categoryId: null,
      isActive: true,
      description: 'Product dimensions (L x W x H)'
    },
    {
      id: 5,
      name: 'warranty',
      displayName: 'Warranty',
      type: 'text',
      defaultValue: '1 year',
      required: false,
      order: 5,
      categoryId: null,
      isActive: true,
      description: 'Warranty period and terms'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    displayName: '',
    type: 'text',
    defaultValue: '',
    required: false,
    order: 0,
    categoryId: null,
    description: ''
  });

  const specTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'date', label: 'Date' }
  ];

  const handleAddTemplate = () => {
    if (newTemplate.name.trim() && newTemplate.displayName.trim()) {
      const template = {
        id: Date.now(),
        ...newTemplate,
        name: newTemplate.name.trim(),
        displayName: newTemplate.displayName.trim(),
        isActive: true
      };
      
      setTemplates(prev => [...prev, template]);
      setNewTemplate({
        name: '',
        displayName: '',
        type: 'text',
        defaultValue: '',
        required: false,
        order: 0,
        categoryId: null,
        description: ''
      });
      setShowAddForm(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate({ ...template });
  };

  const handleSaveTemplate = () => {
    if (editingTemplate && editingTemplate.name.trim() && editingTemplate.displayName.trim()) {
      setTemplates(prev => prev.map(template =>
        template.id === editingTemplate.id ? editingTemplate : template
      ));
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template? This will affect all products using it.')) {
      setTemplates(prev => prev.filter(template => template.id !== templateId));
    }
  };

  const toggleTemplateStatus = (templateId) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId ? { ...template, isActive: !template.isActive } : template
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Global Specification Templates</h2>
          <p className="text-gray-600 mt-1">Manage specification templates that can be applied to all products</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Template</span>
        </button>
      </div>

      {/* Add Template Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Add New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., model, power_rating"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
              <input
                type="text"
                value={newTemplate.displayName}
                onChange={(e) => setNewTemplate({ ...newTemplate, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Model, Power Rating"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newTemplate.type}
                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {specTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
              <input
                type="text"
                value={newTemplate.defaultValue}
                onChange={(e) => setNewTemplate({ ...newTemplate, defaultValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Standard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={newTemplate.order}
                onChange={(e) => setNewTemplate({ ...newTemplate, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTemplate.required}
                  onChange={(e) => setNewTemplate({ ...newTemplate, required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Description of what this specification represents..."
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex gap-2">
              <button
                onClick={handleAddTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Template
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{template.displayName}</div>
                      <div className="text-sm text-gray-500">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {specTypes.find(t => t.value === template.type)?.label || template.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {template.defaultValue || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.required 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.required ? 'Required' : 'Optional'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {template.order}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleTemplateStatus(template.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Total Templates: <span className="font-medium">{templates.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Active: <span className="font-medium text-green-600">
                {templates.filter(t => t.isActive).length}
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

export default GlobalTemplatesTab;
