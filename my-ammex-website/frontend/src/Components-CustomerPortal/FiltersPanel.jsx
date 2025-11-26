import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Layers, Tag } from 'lucide-react';

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

  const renderCategory = (category) => {
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
          className={`filter-category-btn w-full text-left px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm lg:text-base
            ${isSelected
              ? 'bg-[#e1eaf5] text-[#2c5282] font-semibold border-l-4 border-[#2c5282] shadow-sm'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className={`w-4 h-4 ${isSelected ? 'text-[#2c5282]' : 'text-slate-400'}`} />
              <span>{category.name}</span>
            </div>
            {hasSubcategories && (
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className={`h-4 w-4 ${isSelected ? 'text-[#2c5282]' : 'text-slate-400'}`} />
              </span>
            )}
          </div>
        </button>
        
        {hasSubcategories && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-slate-200">
              {category.subcategories.map((subcategory) => {
                const isSubSelected = selectedCategory === subcategory.name;
                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleCategorySelect(subcategory.name)}
                    className={`w-full text-left px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-200 text-sm
                      ${isSubSelected
                        ? 'bg-[#2c5282] text-white font-medium shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSubSelected ? 'bg-white' : 'bg-slate-300'}`}></span>
                      <span>{subcategory.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:sticky lg:top-6 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c5282] to-[#234066] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Categories</h3>
              <p className="text-blue-100 text-xs">Browse by category</p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
          {/* All Categories Option */}
          <button
            onClick={() => handleCategorySelect('All')}
            className={`filter-category-btn w-full text-left px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm lg:text-base
              ${selectedCategory === 'All'
                ? 'bg-[#2c5282] text-white font-semibold shadow-lg'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
              }`}
          >
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${selectedCategory === 'All' ? 'text-white' : 'text-slate-400'}`} />
              <span>All Categories</span>
            </div>
          </button>
          
          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-slate-200"></div>
          </div>
          
          {/* Main Categories with Subcategories */}
          {categories.length > 0 ? (
            categories.map((category) => renderCategory(category))
          ) : (
            <div className="text-slate-400 text-sm py-4 text-center">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No categories available
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            {categories.length} categories available
          </p>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
