import React from 'react';

const ProductCard = ({ product, onCardClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 ease-out 
      border-2 border-gray-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-[#3182ce] 
      focus:outline-none focus:border-transparent flex flex-col h-full cursor-pointer"
      onClick={() => onCardClick(product)}
    >
      {/* Product Image */}
      <div className="w-full h-[120px] sm:h-[180px] bg-gray-200 flex items-center justify-center text-2xl sm:text-4xl text-gray-400">
        {product.image.startsWith('/') || product.image.startsWith('http') ? (
          <img 
            src={product.image} 
            alt={product.modelNo}
            className="object-contain w-full h-full"
          />
        ) : (
          <span>{product.image}</span>
        )}
      </div>
      {/* Product Info */}
      <div className="p-2 sm:p-4 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-gray-700 line-clamp-2 leading-tight">{product.modelNo}</h3>
        <p className="text-gray-500 mb-1 sm:mb-2 text-xs leading-tight">{product.category}</p>
        <div className="flex flex-col sm:flex-row sm:justify-between mb-2 sm:mb-3">
          <div className="text-sm sm:text-lg font-bold text-[#2c5282] mb-1 sm:mb-0">₱{product.price.toLocaleString()}</div>
          <div className="text-xs text-gray-600">
            Stock: <span className={`font-semibold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {product.stock}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductCard; 