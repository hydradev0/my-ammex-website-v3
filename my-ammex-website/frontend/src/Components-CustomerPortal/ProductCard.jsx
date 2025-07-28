import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg flex flex-col h-full">
      {/* Product Image */}
      <div className="w-full h-[150px] sm:h-[200px] bg-gray-200 flex items-center justify-center text-4xl sm:text-5xl text-gray-400">
        {product.image.startsWith('/') || product.image.startsWith('http') ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="object-contain w-full h-full"
          />
        ) : (
          <span>{product.image}</span>
        )}
      </div>
      {/* Product Info */}
      <div className="p-3 sm:p-5 flex flex-col flex-1">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-700 line-clamp-2">{product.name}</h3>
        <p className="text-gray-500 mb-2 text-xs sm:text-sm leading-relaxed">{product.category}</p>
        <div className="flex justify-between mb-2">
          <div className="text-lg sm:text-xl font-bold text-[#2c5282]">${product.price.toLocaleString()}</div>
          <div className="text-xs sm:text-sm mt-1 text-gray-600">
            Stock: <span className={`font-semibold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {product.stock} units
            </span>
          </div>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="bg-[#48bb78] cursor-pointer hover:bg-[#38a169] text-white border-0 py-2 sm:py-3 px-3 sm:px-5 rounded-3xl w-full text-xs sm:text-sm font-bold transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard; 