import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, onCardClick }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
};

export default ProductGrid; 