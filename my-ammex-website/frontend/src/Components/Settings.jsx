import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard,
  TrendingUp,
  Save,
  ShieldUser
} from 'lucide-react';
import RoleBasedLayout from './RoleBasedLayout';
import ManagePayMongoMethods from '../Components-CustomerPayments/ManagePayMongoMethods';
import SuccessModal from './SuccessModal';
import { getTiers, saveTiers } from '../services/tierService';

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
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load company profile data on component mount
  React.useEffect(() => {
    const fetchCompanyProfile = async () => {
      setIsLoadingData(true);
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
      } finally {
        setIsLoadingData(false);
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
      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      ) : (
        <>
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
        </>
      )}
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
  const [markupError, setMarkupError] = useState('');

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
            setMarkupError(''); // Clear any errors when loading settings
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
    
    if (name === 'markupRate') {
      // Validate markup percentage on change
      const numValue = parseFloat(value);
      if (value === '') {
        // Clear error if field is empty
        setMarkupError('');
      } else if (!isNaN(numValue)) {
        if (numValue < 0) {
          setMarkupError('Markup percentage must be a non-negative number');
        } else if (numValue > 150) {
          setMarkupError('Markup percentage cannot exceed 150%');
        } else {
          // Valid range, clear error
          setMarkupError('');
        }
      }
    }
    
    setMarkupSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Validate before submitting
    const markupValue = parseFloat(markupSettings.markupRate);
    
    if (isNaN(markupValue) || markupValue < 0) {
      setMarkupError('Markup percentage must be a non-negative number');
      return;
    }
    
    if (markupValue > 150) {
      setMarkupError('Markup percentage cannot exceed 150%');
      return;
    }
    
    // Clear any existing errors
    setMarkupError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/markup`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markup_rate: markupValue,
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
              max="150"
              className={`w-full max-w-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${markupError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
            />
            {markupError && (
              <p className="text-red-500 text-sm mt-1">{markupError}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              This percentage will be applied to all new products when creating items. Must be between 0 and 150%.
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

// Account Tiers settings
const TiersSettings = () => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getTiers();
        if (res.success) {
          setTiers(Array.isArray(res.data) ? res.data : []);
        } else {
          setTiers([]);
        }
      } catch (e) {
        setError('Failed to load tiers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateTier = (index, key, value) => {
    setTiers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  // Format number with commas
  const formatNumberWithCommas = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const numStr = num.toString();
    // Split by decimal point if exists
    const parts = numStr.split('.');
    // Add commas to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Parse number from formatted string (remove commas)
  const parseFormattedNumber = (str) => {
    if (!str) return 0;
    const cleaned = str.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const addTier = () => {
    setTiers(prev => [
      ...prev,
      { name: '', discountPercent: 0, minSpend: 0, isActive: true, priority: (prev[prev.length - 1]?.priority || 0) + 1 }
    ]);
  };

  const removeTier = (index) => {
    setTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const payload = tiers.map(t => ({
        name: String(t.name || '').trim(),
        discountPercent: Number(t.discountPercent || 0),
        minSpend: Number(t.minSpend || 0),
        isActive: !!t.isActive,
        priority: Number(t.priority || 0)
      }));
      const res = await saveTiers(payload);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to save tiers');
      }
    } catch (e) {
      setError(e?.message || 'Failed to save tiers');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading tiers...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
              Tiers saved successfully.
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Tiers</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure customer tiers. Discounts are applied as the best-of between product promotions and tier. No stacking.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount %</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Spend</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tiers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={t.priority ?? 0}
                          onChange={(e) => updateTier(idx, 'priority', parseInt(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={t.name || ''}
                          onChange={(e) => updateTier(idx, 'name', e.target.value)}
                          className="w-48 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={t.discountPercent ?? 0}
                          onChange={(e) => updateTier(idx, 'discountPercent', parseFloat(e.target.value))}
                          className="w-28 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formatNumberWithCommas(t.minSpend ?? 0)}
                          onChange={(e) => {
                            const parsed = parseFormattedNumber(e.target.value);
                            updateTier(idx, 'minSpend', parsed);
                          }}
                          onBlur={(e) => {
                            // Ensure the value is properly formatted on blur
                            const parsed = parseFormattedNumber(e.target.value);
                            updateTier(idx, 'minSpend', parsed);
                          }}
                          className="w-36 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => updateTier(idx, 'isActive', !t.isActive)}
                          className={`relative cursor-pointer border-2 border-transparent hover:border-2 hover:border-blue-400 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            t.isActive ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              t.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => removeTier(idx)}
                          className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={addTier}
                className="px-4 py-2 cursor-pointer bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Add Tier
              </button>
              <div className="flex-1" />
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Tiers
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Over-the-Counter Payments component
// const OverTheCounterPayments = () => {
//   const [formData, setFormData] = useState({
//     invoiceId: '',
//     amount: '',
//     paymentMethod: 'cash',
//     reference: '',
//     notes: ''
//   });
//   const [invoices, setInvoices] = useState([]);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [error, setError] = useState('');

//   // Load invoices on component mount
//   React.useEffect(() => {
//     const fetchInvoices = async () => {
//       setIsLoadingInvoices(true);
//       try {
//         const [awaitingRes, partialRes, overdueRes] = await Promise.all([
//           getInvoicesByStatus('awaiting payment', 1, 100),
//           getInvoicesByStatus('partially paid', 1, 100),
//           getInvoicesByStatus('overdue', 1, 100)
//         ]);
        
//         const allInvoices = [
//           ...(awaitingRes?.data || []),
//           ...(partialRes?.data || []),
//           ...(overdueRes?.data || [])
//         ];

//         // Transform and filter invoices with remaining balance
//         const filteredInvoices = allInvoices
//           .map(inv => ({
//             id: inv.id,
//             invoiceNumber: inv.invoiceNumber || inv.invoice_number || '',
//             customerName: inv.customer?.customerName || 'Unknown',
//             totalAmount: Number(inv.totalAmount || 0),
//             paidAmount: Number(inv.paidAmount || 0),
//             remainingAmount: Number(
//               inv.remainingBalance != null 
//                 ? inv.remainingBalance 
//                 : (inv.totalAmount || 0) - (inv.paidAmount || 0)
//             ),
//             dueDate: inv.dueDate,
//             status: inv.status
//           }))
//           .filter(inv => inv.remainingAmount > 0)
//           .filter((inv, index, self) => 
//             index === self.findIndex(i => i.id === inv.id)
//           );

//         setInvoices(filteredInvoices);
//       } catch (error) {
//         console.error('Failed to fetch invoices:', error);
//         setError('Failed to load invoices. Please try again.');
//       } finally {
//         setIsLoadingInvoices(false);
//       }
//     };

//     fetchInvoices();
//   }, []);

//   // Filter invoices based on search
//   const filteredInvoices = invoices.filter(inv => {
//     if (!searchTerm) return true;
//     const term = searchTerm.toLowerCase();
//     return (
//       inv.invoiceNumber.toLowerCase().includes(term) ||
//       inv.customerName.toLowerCase().includes(term)
//     );
//   });

//   // Handle invoice selection
//   const handleInvoiceSelect = (invoice) => {
//     setSelectedInvoice(invoice);
//     setFormData(prev => ({
//       ...prev,
//       invoiceId: invoice.id,
//       amount: invoice.remainingAmount.toFixed(2)
//     }));
//     setSearchTerm('');
//   };

//   // Handle form input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//     setError('');
//   };

//   // Validate form
//   const validateForm = () => {
//     if (!formData.invoiceId) {
//       setError('Please select an invoice');
//       return false;
//     }
//     if (!formData.amount || parseFloat(formData.amount) <= 0) {
//       setError('Please enter a valid payment amount');
//       return false;
//     }
//     if (selectedInvoice && parseFloat(formData.amount) > selectedInvoice.remainingAmount) {
//       setError(`Payment amount cannot exceed remaining balance of ₱${selectedInvoice.remainingAmount.toFixed(2)}`);
//       return false;
//     }
//     if (!formData.paymentMethod) {
//       setError('Please select a payment method');
//       return false;
//     }
//     return true;
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!validateForm()) {
//       return;
//     }

//     setIsLoading(true);
//     try {
//       // TODO: Call API endpoint to record over-the-counter payment
//       // const response = await recordOverTheCounterPayment(formData);
      
//       // For now, just show success (will be implemented when backend is ready)
//       console.log('Recording payment:', formData);
      
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       setShowSuccessModal(true);
//       setFormData({
//         invoiceId: '',
//         amount: '',
//         paymentMethod: 'cash',
//         reference: '',
//         notes: ''
//       });
//       setSelectedInvoice(null);
//       setSearchTerm('');
//     } catch (error) {
//       console.error('Error recording payment:', error);
//       setError(error.message || 'Failed to record payment. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatCurrency = (amount) => `₱${Number(amount).toFixed(2)}`;

//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="text-lg font-semibold text-gray-900 mb-2">Record Over-the-Counter Payment</h3>
//         <p className="text-sm text-gray-600 mb-6">
//           Record payments received in person (cash, check, bank transfer, etc.) that don't go through PayMongo.
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Invoice Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Select Invoice *
//             </label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search by invoice number or customer name..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             {searchTerm && (
//               <div className="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg z-10">
//                 {isLoadingInvoices ? (
//                   <div className="p-4 text-center text-gray-500">
//                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
//                     <p className="mt-2 text-sm">Loading invoices...</p>
//                   </div>
//                 ) : filteredInvoices.length === 0 ? (
//                   <div className="p-4 text-center text-gray-500 text-sm">
//                     No invoices found
//                   </div>
//                 ) : (
//                   filteredInvoices.map((invoice) => (
//                     <button
//                       key={invoice.id}
//                       type="button"
//                       onClick={() => handleInvoiceSelect(invoice)}
//                       className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
//                     >
//                       <div className="flex justify-between items-start">
//                         <div>
//                           <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
//                           <p className="text-sm text-gray-600">{invoice.customerName}</p>
//                         </div>
//                         <div className="text-right">
//                           <p className="text-sm font-medium text-gray-900">
//                             {formatCurrency(invoice.remainingAmount)}
//                           </p>
//                           <p className="text-xs text-gray-500">remaining</p>
//                         </div>
//                       </div>
//                     </button>
//                   ))
//                 )}
//               </div>
//             )}

//             {/* Selected Invoice Display */}
//             {selectedInvoice && (
//               <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="font-medium text-gray-900">{selectedInvoice.invoiceNumber}</p>
//                     <p className="text-sm text-gray-600">{selectedInvoice.customerName}</p>
//                     <p className="text-xs text-gray-500 mt-1">
//                       Total: {formatCurrency(selectedInvoice.totalAmount)} • 
//                       Paid: {formatCurrency(selectedInvoice.paidAmount)} • 
//                       Remaining: <span className="font-medium text-red-600">{formatCurrency(selectedInvoice.remainingAmount)}</span>
//                     </p>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setSelectedInvoice(null);
//                       setFormData(prev => ({ ...prev, invoiceId: '', amount: '' }));
//                     }}
//                     className="text-gray-400 hover:text-gray-600"
//                   >
//                     ×
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Payment Amount */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Payment Amount *
//             </label>
//             <input
//               type="number"
//               name="amount"
//               value={formData.amount}
//               onChange={handleInputChange}
//               step="0.01"
//               min="0.01"
//               max={selectedInvoice?.remainingAmount || ''}
//               placeholder="0.00"
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               required
//             />
//             {selectedInvoice && (
//               <p className="text-xs text-gray-500 mt-1">
//                 Maximum: {formatCurrency(selectedInvoice.remainingAmount)}
//               </p>
//             )}
//           </div>

//           {/* Payment Method */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Payment Method *
//             </label>
//             <select
//               name="paymentMethod"
//               value={formData.paymentMethod}
//               onChange={handleInputChange}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               required
//             >
//               <option value="cash">Cash</option>
//               <option value="check">Check</option>
//               <option value="bank_transfer">Bank Transfer</option>
//               <option value="gcash">GCash</option>
//               <option value="maya">Maya</option>
//               <option value="other">Other</option>
//             </select>
//           </div>

//           {/* Reference Number */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Reference Number (Optional)
//             </label>
//             <input
//               type="text"
//               name="reference"
//               value={formData.reference}
//               onChange={handleInputChange}
//               placeholder="Check number, transaction ID, etc."
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           {/* Notes */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Notes (Optional)
//             </label>
//             <textarea
//               name="notes"
//               value={formData.notes}
//               onChange={handleInputChange}
//               rows={3}
//               placeholder="Additional notes about this payment..."
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="p-3 bg-red-50 border border-red-200 rounded-md">
//               <p className="text-sm text-red-600">{error}</p>
//             </div>
//           )}

//           {/* Submit Button */}
//           <div className="flex justify-end">
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               {isLoading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                   Recording...
//                 </>
//               ) : (
//                 <>
//                   Record Payment
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Success Modal */}
//       <SuccessModal
//         isOpen={showSuccessModal}
//         onClose={() => setShowSuccessModal(false)}
//         title="Payment Recorded Successfully"
//         message="The over-the-counter payment has been recorded and the invoice balance has been updated."
//         autoClose={true}
//         autoCloseDelay={3000}
//       />
//     </div>
//   );
// };

// Main Settings component
function Settings() {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2, component: CompanyProfile },
    { id: 'paymongo', label: 'PayMongo Methods', icon: CreditCard, component: PayMongoMethods },
    { id: 'markup', label: 'Markup Settings', icon: TrendingUp, component: MarkupSettings },
    { id: 'tiers', label: 'Account Tiers', icon: ShieldUser, component: TiersSettings },
    // { id: 'otc', label: 'OTC Payments', icon: DollarSign, component: OverTheCounterPayments }
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
