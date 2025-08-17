import { useState } from 'react';
import { Edit2 } from 'lucide-react';

function CategorySpecsTab() {
  const [categories] = useState([
    { id: 1, name: 'Industrial Equipment', specsCount: 8 },
    { id: 2, name: 'Electronics', specsCount: 12 },
    { id: 3, name: 'Tools', specsCount: 6 },
    { id: 4, name: 'Safety Equipment', specsCount: 10 }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Category-Specific Specifications</h2>
        <p className="text-gray-600 mt-1">Manage specifications that apply to specific product categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {category.specsCount} specs
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Custom specifications specific to {category.name.toLowerCase()} products
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Manage Specs
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySpecsTab;
