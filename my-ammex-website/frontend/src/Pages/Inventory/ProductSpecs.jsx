import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, FileText, Globe, Tag, Layers } from 'lucide-react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import {
  ProductSpecsTab,
  GlobalTemplatesTab,
  CategorySpecsTab,
  BulkApplyTab
} from '../../Components-Inventory/Products-Specs';

function ProductSpecs() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('product-specs');
  const [product, setProduct] = useState(null);

  // Get product data from navigation state or use mock data
  useEffect(() => {
    if (location.state?.product) {
      setProduct(location.state.product);
    }
  }, [location.state]);

  const handleSave = (productData) => {
    console.log('Saving product data:', productData);
    // TODO: Implement save functionality with backend
    alert('Product specifications saved successfully!');
  };

  const handleCancel = () => {
    navigate('/Inventory/Items');
  };

  const tabs = [
    { id: 'product-specs', name: 'Product Specifications', icon: FileText },
    { id: 'global-templates', name: 'Global Templates', icon: Globe },
    { id: 'category-specs', name: 'Category Specifications', icon: Tag },
    { id: 'bulk-apply', name: 'Bulk Apply', icon: Layers }
  ];

  return (
    <>
    <RoleBasedLayout />
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Product Specifications Management</h1>
                <p className="text-gray-600 mt-1">Manage global specification templates and product-specific specifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-10">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
          <h2 className=" text-gray-400">Hello World. This is search bar...</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'product-specs' && (
          <ProductSpecsTab 
            product={product} 
            onSave={handleSave} 
            onCancel={handleCancel} 
          />
        )}
        {activeTab === 'global-templates' && (
          <GlobalTemplatesTab />
        )}
        {activeTab === 'category-specs' && (
          <CategorySpecsTab />
        )}
        {activeTab === 'bulk-apply' && (
          <BulkApplyTab />
        )}
      </div>
    </div>
    </>
  );
}

export default ProductSpecs;
