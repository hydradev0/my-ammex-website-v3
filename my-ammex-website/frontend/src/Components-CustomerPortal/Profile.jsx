import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Edit, Save, X, User, Building, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import TopBarPortal from './TopBarPortal';
import { getCustomers, getCustomerById, updateCustomer, getMyCustomer } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { customerId } = useParams(); // Get customer ID from URL params
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Customer data state
  const [userData, setUserData] = useState({
    id: null, // Numeric primary key from database
    customerId: '', // String customer ID like "CUST0001"
    customerName: '',
    contactName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    telephone1: '',
    telephone2: '',
    email1: '',
    email2: '',
    balance: 0,
    notes: '',
    isActive: true
  });

  const [editData, setEditData] = useState({ ...userData });

  // Fetch customer data on component mount (client loads own record; admin uses URL param)
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (user?.role === 'Client') {
          const me = await getMyCustomer();
          if (me.success && me.data) {
            const c = me.data;
            const formattedData = {
              id: c.id,
              customerId: c.customerId || '',
              customerName: c.customerName || '',
              contactName: c.contactName || '',
              street: c.street || '',
              city: c.city || '',
              postalCode: c.postalCode || '',
              country: c.country || '',
              telephone1: c.telephone1 || '',
              telephone2: c.telephone2 || '',
              email1: c.email1 || '',
              email2: c.email2 || '',
              balance: c.balance || 0,
              notes: c.notes || '',
              isActive: c.isActive !== undefined ? c.isActive : true
            };
            setUserData(formattedData);
            setEditData(formattedData);
            // Force edit mode if required fields are missing
            if (!formattedData.customerName || !formattedData.telephone1 || !formattedData.email1) {
              setIsEditing(true);
            }
          } else {
            setError('Customer not found');
          }
        } else {
          // Admin/staff path via URL param
          const customerIdToSearch = customerId;
          if (!customerIdToSearch) {
            setError('Customer not specified');
            return;
          }
          const searchResponse = await getCustomers({ search: customerIdToSearch });
          if (searchResponse.success && searchResponse.data.length > 0) {
            const customer = searchResponse.data.find(c => c.customerId === customerIdToSearch);
            if (customer) {
              const formattedData = {
                id: customer.id,
                customerId: customer.customerId || '',
                customerName: customer.customerName || '',
                contactName: customer.contactName || '',
                street: customer.street || '',
                city: customer.city || '',
                postalCode: customer.postalCode || '',
                country: customer.country || '',
                telephone1: customer.telephone1 || '',
                telephone2: customer.telephone2 || '',
                email1: customer.email1 || '',
                email2: customer.email2 || '',
                balance: customer.balance || 0,
                notes: customer.notes || '',
                isActive: customer.isActive !== undefined ? customer.isActive : true
              };
              setUserData(formattedData);
              setEditData(formattedData);
            } else {
              setError('Customer not found');
            }
          } else {
            setError('Customer not found');
          }
        }
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError(err.message || 'Failed to fetch customer data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId, user]);

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleEdit = () => {
    setEditData({ ...userData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      setError(null);
     
      
      // Transform form data to match backend model
      const updatePayload = {
        customerName: editData.customerName,
        street: editData.street,
        city: editData.city,
        postalCode: editData.postalCode,
        country: editData.country,
        contactName: editData.contactName,
        telephone1: editData.telephone1,
        telephone2: editData.telephone2,
        email1: editData.email1,
        email2: editData.email2,
        notes: editData.notes,
        profileCompleted: user?.role === 'Client' ? true : undefined
      };
      
      // Use the numeric ID for the update
      const response = await updateCustomer(userData.id, updatePayload);
      
      if (response.success) {
        setUserData({ ...userData, ...editData });
        setIsEditing(false);
        // You could show a success message here
      } else {
        setError(response.message || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message || 'Failed to update customer');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <TopBarPortal />
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <TopBarPortal />
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Profile</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <TopBarPortal />
    <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-30 lg:-mx-40 xl:-mx-48">
        <button 
          onClick={() => handleBreadcrumbClick('/Products')}
          className="hover:text-gray-800 cursor-pointer transition-colors"
        >
          Products
        </button>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-700 font-medium">Profile</span>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-6 sm:mt-8 sm:-mx-1 md:-mx-25 lg:-mx-30 xl:-mx-35">
        <button 
          onClick={handleBack}
          className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">Profile</h1>
        <div className="w-full sm:ml-auto sm:w-auto">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center cursor-pointer justify-center gap-2 bg-[#48bb78] hover:bg-[#38a169] text-white px-4 py-2 rounded-3xl transition-colors w-full sm:w-auto"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSave}
                disabled={updating}
                className={`flex items-center justify-center gap-2 bg-[#48bb78] hover:bg-[#38a169] text-white px-4 py-2 rounded-3xl transition-colors w-full sm:w-auto ${
                  updating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {updating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-3xl transition-colors w-full sm:w-auto"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8 lg:p-10">
        {/* Account Information */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <User className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
            Account Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Customer ID</label>
              <div className="text-gray-900 font-medium text-sm sm:text-base">{userData.customerId}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Account Status</label>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userData.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {userData.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Current Balance</label>
              <div className="text-gray-900 font-medium text-sm sm:text-base">${userData.balance.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4 md:mb-6"></div>

        {/* Company Information */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
            Company Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.customerName}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Contact Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.contactName}</div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4 md:mb-6"></div>

        {/* Contact Information */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Telephone 1</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.telephone1}
                  onChange={(e) => handleInputChange('telephone1', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.telephone1}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Telephone 2</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.telephone2}
                  onChange={(e) => handleInputChange('telephone2', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.telephone2}</div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4 md:mb-6"></div>

        {/* Email Information */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
            Email Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Email 1</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email1}
                  onChange={(e) => handleInputChange('email1', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 break-all text-sm sm:text-base">{userData.email1}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Email 2</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email2}
                  onChange={(e) => handleInputChange('email2', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 break-all text-sm sm:text-base">{userData.email2}</div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4 md:mb-6"></div>

        {/* Address Information */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
            Address Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Street</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.street}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">City</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.city}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Postal Code</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.postalCode}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Country</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.country}</div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4 md:mb-6"></div>

        {/* Additional Information */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">Additional Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Notes</label>
            {isEditing ? (
              <textarea
                value={editData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
              />
            ) : (
              <div className="text-gray-900 text-sm sm:text-base">{userData.notes}</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;
