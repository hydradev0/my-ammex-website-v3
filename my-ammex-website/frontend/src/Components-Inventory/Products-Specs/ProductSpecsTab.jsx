import ProductSpecsTable from '../ProductSpecsTable';

function ProductSpecsTab({ product, onSave, onCancel }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <ProductSpecsTable
          product={product}
          onSave={onSave}
          onCancel={onCancel}
          isEditMode={false}
        />
      </div>
    </div>
  );
}

export default ProductSpecsTab;
