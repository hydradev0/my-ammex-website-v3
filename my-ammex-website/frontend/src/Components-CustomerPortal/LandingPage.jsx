import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBarPortal from './TopBarPortal';

const LandingPage = () => {
  const navigate = useNavigate();



  const handleEnterCatalog = () => {
    try {
    navigate('/products');
    } 
    catch (error) {
      console.error('Error entering product section:', error);
    }
  };

  return (
    <>
    <TopBarPortal />
    <div className="min-h-screen flex items-center justify-center p-8 font-sans text-slate-800">
      <div className="max-w-4xl w-full text-center relative">

        
        
        {/* Main Content */}
        <div className="bg-white rounded-3xl p-12 shadow-2xl border border-white/80 relative z-10 hover:shadow-3xl transition-shadow duration-300">
          <div className="inline-block bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 transition-colors duration-200">
            🚀 Premium Industrial Equipment
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-6 leading-tight">
            Find Your Perfect<br />Machine Tool
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 leading-relaxed font-normal max-w-2xl mx-auto">
            Browse our extensive catalog of CNC machines, lathes, and precision equipment from leading manufacturers. Quality you can trust, service you can count on.
          </p>
          
          <button
            onClick={handleEnterCatalog}
            className="inline-flex cursor-pointer items-center gap-3 bg-[#3182ce] text-white px-12 py-5 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl hover:bg-[#4992d6] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            🔍 Explore Products
          </button>
          
          {/* Trust Section */}
          <div className="mt-12 pt-12 border-t border-slate-200">
            <p className="text-slate-600 text-sm mb-8 font-medium">
              Trusted by manufacturing companies worldwide
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-center gap-2 hover:transform hover:-translate-y-1 transition-transform duration-200 cursor-default">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-slate-600 text-sm font-semibold">
                  Machines Available
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2 hover:transform hover:-translate-y-1 transition-transform duration-200 cursor-default">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  25+
                </div>
                <div className="text-slate-600 text-sm font-semibold">
                  Years Experience
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2 hover:transform hover:-translate-y-1 transition-transform duration-200 cursor-default sm:col-span-2 lg:col-span-1">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  1,200+
                </div>
                <div className="text-slate-600 text-sm font-semibold">
                  Happy Customers
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="mt-8 text-slate-400 text-sm">
          <div className="flex justify-center gap-8 flex-wrap mt-4">
            <div className="flex items-center gap-2 text-slate-600 text-sm hover:text-blue-600 transition-colors duration-200">
              📞 1-800-MACHINE
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-sm hover:text-blue-600 transition-colors duration-200">
              📧 sales@precisiontools.com
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-sm hover:text-blue-600 transition-colors duration-200">
              🕒 Mon-Fri 8AM-6PM EST
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Overlay */}
    </div>
    </>
  );
};

export default LandingPage;