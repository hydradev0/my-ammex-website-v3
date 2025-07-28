import React, { useEffect, useRef } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const CartSidebar = ({ cart, onUpdateQuantity, onClose, totalPrice, isOpen }) => {
  const sidebarRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Remove conditional rendering for isOpen
  // Always render overlay and sidebar, control visibility with classes
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 right-0 h-full bg-gray-100 flex flex-col z-[1000]
          w-full sm:w-[500px] md:w-[500px] lg:w-[600px]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-3 sm:p-4  border-b border-gray-400 flex items-center justify-between bg-[#2c5282]">
          <h2 className="text-lg bg-[#2c5282] text-white sm:text-xl font-bold">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 cursor-pointer p-1"
          >
            <X size={22} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-gray-500 text-center text-sm sm:text-base">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="border border-gray-400 rounded-lg p-2 sm:p-3 bg-white">
                    <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base leading-tight">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">${item.price.toLocaleString()}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 w-6 h-6 sm:w-8 sm:h-8 rounded-3xl flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Minus size={12} className="sm:w-4 sm:h-4" />
                        </button>
                        <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="bg-gray-200 text-gray-700 w-6 h-6 sm:w-8 sm:h-8 rounded-3xl flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={12} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <span className="font-semibold text-sm sm:text-base">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-400 p-3 sm:p-4 bg-white">
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Total:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button className="w-full bg-[#3182ce] text-white py-2 sm:py-3 rounded-3xl font-semibold hover:bg-[#2c5282] transition-colors text-sm sm:text-base">
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar; 