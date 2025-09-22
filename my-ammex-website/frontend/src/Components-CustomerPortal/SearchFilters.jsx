import React, { useState } from "react";
import { Search } from "lucide-react";

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-8 shadow-lg">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto">
          {/* Hero Search Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Machine Tool</h1>
          </div>
          
          {/* Prominent Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center">
                <div className="pl-6 pr-4">
                  <Search
                    className="text-[#3182ce]"
                    size={28}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search for products, categories, models etc."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 py-6 pr-6 text-xl border-none outline-none placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
                />
                <div className="pr-6 pl-4">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="max-w-full">
          {/* Mobile Hero Section */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Find Machine Tool</h1>
          </div>
          
          {/* Mobile Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center">
                <div className="pl-4 pr-3">
                  <Search
                    className="text-[#3182ce]"
                    size={22}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 py-4 pr-4 text-lg border-none outline-none placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;