import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard,
  TrendingUp,
  Save
} from 'lucide-react';
import RoleBasedLayout from './RoleBasedLayout';
import ManagePayMongoMethods from '../Components-CustomerPayments/ManagePayMongoMethods';
import SuccessModal from './SuccessModal';

// Tab components
const CompanyProfile = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    // website: '', // Commented out
    // description: '' // Commented out
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load company profile data on component mount
  React.useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/company`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFormData({
              companyName: data.data.company_name || '',
              email: data.data.company_email || '',
              phone: data.data.company_phone || '',
              address: data.data.company_address || '',
              // website: data.data.company_website || '', // Commented out
              // description: data.data.company_description || '' // Commented out
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch company profile:', error);
      }
    };

    fetchCompanyProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/company`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: formData.companyName,
          company_email: formData.email,
          company_phone: formData.phone,
          company_address: formData.address,
          // company_website: formData.website, // Commented out
          // company_description: formData.description // Commented out
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowSuccessModal(true);
        } else {
          alert('Failed to save company profile: ' + (data.message || 'Unknown error'));
        }
      } else {
        alert('Failed to save company profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving company profile:', error);
      alert('Error saving company profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div> */}
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div> */}
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
    
    {/* Success Modal */}
    <SuccessModal
      isOpen={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
      title="Company Profile Updated"
      message="Your company information has been saved successfully."
      autoClose={true}
      autoCloseDelay={3000}
    />
    </>
  );
};

const MarkupSettings = () => {
  const [markupSettings, setMarkupSettings] = useState({
    markupRate: 30, // Match NewItem.jsx default of 30%
    markupType: 'percentage' // Always percentage to match NewItem.jsx
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load markup settings on component mount
  React.useEffect(() => {
    const fetchMarkupSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/markup`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMarkupSettings({
              markupRate: data.data.markup_rate || 30,
              markupType: data.data.markup_type || 'percentage'
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch markup settings:', error);
      }
    };

    fetchMarkupSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMarkupSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/markup`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markup_rate: parseFloat(markupSettings.markupRate),
          markup_type: markupSettings.markupType
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowSuccessModal(true);
        } else {
          alert('Failed to save markup settings: ' + (data.message || 'Unknown error'));
        }
      } else {
        alert('Failed to save markup settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving markup settings:', error);
      alert('Error saving markup settings. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Markup Configuration</h3>
        <div className="space-y-6">
          {/* Current Markup Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-sm font-medium text-blue-900">Current Markup</h4>
            </div>
            <p className="text-sm text-blue-700">
              Products are automatically marked up by <strong>{markupSettings.markupRate}%</strong> from supplier price.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Example: ₱100 supplier price → ₱{((100 * (1 + markupSettings.markupRate / 100)).toFixed(2))} selling price
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markup Percentage (%)
            </label>
            <input
              type="number"
              name="markupRate"
              value={markupSettings.markupRate}
              onChange={handleInputChange}
              min="0"
              max="1000"
              step="0.01"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              This percentage will be applied to all new products when creating items.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Save size={16} />
          Save Markup Settings
        </button>
      </div>
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Markup Settings Updated"
        message="Your markup configuration has been saved successfully."
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
};

// PayMongo Methods component (using existing ManagePayMongoMethods)
const PayMongoMethods = () => {
  return <ManagePayMongoMethods />;
};

// Main Settings component
function Settings() {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2, component: CompanyProfile },
    { id: 'paymongo', label: 'PayMongo Methods', icon: CreditCard, component: PayMongoMethods },
    { id: 'markup', label: 'Markup Settings', icon: TrendingUp, component: MarkupSettings }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <>
    <RoleBasedLayout />
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
          </div>
          
          <div className="flex">
            {/* Sidebar with tabs */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} className="mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main content area */}
            <div className="flex-1 p-6">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Settings;
