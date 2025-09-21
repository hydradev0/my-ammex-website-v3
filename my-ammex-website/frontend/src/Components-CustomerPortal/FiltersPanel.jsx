import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CircleSmall } from 'lucide-react';

const FiltersPanel = ({ 
  categories = [], 
  selectedCategory, 
  onCategorySelect 
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorySelect = (categoryName) => {
    onCategorySelect(categoryName);
  };

  const renderCategory = (category, level = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.name;

    const handleCategoryClick = () => {
      if (hasSubcategories) {
        toggleCategory(category.id);
      } else {
        handleCategorySelect(category.name);
      }
    };

    return (
      <div key={category.id} className="w-full">
        <button
          onClick={handleCategoryClick}
          className={`w-full text-left px-3 cursor-pointer lg:px-4 py-2 lg:py-3 rounded-lg transition-colors border text-sm lg:text-base ${
            isSelected
              ? 'bg-blue-50 text-[#3182ce] font-medium border-blue-200'
              : 'text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}
          style={{ marginLeft: level * 16 }}
        >
          <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{category.name}</span>
              {hasSubcategories && (
                <span className="text-lg text-gray-600 ml-2">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 transition-transform duration-300" />
                  ) : (
                    <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                  )}
                </span>
            )}
          </div>
        </button>
        
        {hasSubcategories && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {category.subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => handleCategorySelect(subcategory.name)}
                className={`w-full text-left px-3 cursor-pointer lg:px-4 py-2 lg:py-3 rounded-lg transition-colors border text-sm lg:text-base ${
                  selectedCategory === subcategory.name
                    ? 'bg-blue-50 text-[#3182ce] font-medium border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <CircleSmall className="h-2 w-2 mr-2 text-gray-400" />
                  <span>{subcategory.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 lg:sticky lg:top-6">
        {/* Categories Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
          <div className="space-y-1">
            {/* All Categories Option */}
            <button
              onClick={() => handleCategorySelect('All')}
              className={`w-full text-left px-3 cursor-pointer lg:px-4 py-2 lg:py-3 rounded-lg transition-colors border text-sm lg:text-base ${
                selectedCategory === 'All'
                  ? 'bg-blue-50 text-[#3182ce] font-medium border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              All Categories
            </button>
            
            {/* Main Categories with Subcategories */}
            {categories.length > 0 ? (
              categories.map((category) => renderCategory(category))
            ) : (
              <div className="text-gray-500 text-sm py-2">No categories available</div>
            )}
          </div>
        </div>

        {/* Future Filters Sections */}
        {/* 
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Range</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Brand A</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Brand B</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Availability</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Low Stock</span>
            </label>
          </div>
        </div>
        */}
      </div>
    </div>
  );
};

export default FiltersPanel;
