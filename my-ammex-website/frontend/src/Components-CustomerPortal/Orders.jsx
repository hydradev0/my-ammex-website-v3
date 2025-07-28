import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import TopBarPortal from './TopBarPortal';

const Orders = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  return (
    <>
    <TopBarPortal />
    <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-30 lg:-mx-40 xl:-mx-48">
        <button 
          onClick={() => handleBreadcrumbClick('/Products')}
          className="hover:text-blue-600 transition-colors"
        >
          Products
        </button>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-700 font-medium">Orders</span>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-6 sm:mt-8 sm:-mx-1 md:-mx-25 lg:-mx-30 xl:-mx-35">
        <button 
          onClick={handleBack}
          className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">My Orders</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8 lg:p-10">
        <p className="text-gray-600 text-sm sm:text-base">This is your orders page. You can view your past and current orders here.</p>
        {/* Add order list/table here */}
      </div>
    </div>
    </>
  );
};

export default Orders;
