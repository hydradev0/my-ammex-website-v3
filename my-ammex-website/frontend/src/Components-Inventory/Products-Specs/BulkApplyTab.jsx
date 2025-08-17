import { useState } from 'react';

function BulkApplyTab() {
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [applyMode, setApplyMode] = useState('add');

  const templates = [
    { id: 1, name: 'Model', type: 'text', required: true },
    { id: 2, name: 'Power Rating', type: 'text', required: true },
    { id: 3, name: 'Material', type: 'select', required: false },
    { id: 4, name: 'Dimensions', type: 'text', required: false },
    { id: 5, name: 'Warranty', type: 'text', required: false }
  ];

  const categories = [
    { id: 1, name: 'Industrial Equipment' },
    { id: 2, name: 'Electronics' },
    { id: 3, name: 'Tools' },
    { id: 4, name: 'Safety Equipment' }
  ];

  const handleApplySpecs = () => {
    console.log('Applying specifications:', {
      templates: selectedTemplates,
      categories: selectedCategories,
      mode: applyMode
    });
    alert('Specifications applied successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Bulk Apply Specifications</h2>
        <p className="text-gray-600 mt-1">Apply specification templates to multiple products or categories at once</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Templates Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Templates</h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <label key={template.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(template.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTemplates([...selectedTemplates, template.id]);
                      } else {
                        setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      template.required 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Categories Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Target Categories</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{category.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Mode */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Apply Mode</h3>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="add"
                checked={applyMode === 'add'}
                onChange={(e) => setApplyMode(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900">Add new specifications (keep existing)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="replace"
                checked={applyMode === 'replace'}
                onChange={(e) => setApplyMode(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900">Replace existing specifications</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Preview Changes
          </button>
          <button
            onClick={handleApplySpecs}
            disabled={selectedTemplates.length === 0 || selectedCategories.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Specifications
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkApplyTab;
