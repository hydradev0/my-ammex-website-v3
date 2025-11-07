import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Edit, Save, X, User, Building, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import TopBarPortal from './TopBarPortal';
import PhoneInputField from '../Components/PhoneInputField';
import { getCustomers, updateCustomer, getMyCustomer } from '../services/customerService';
import { updateMyUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

// Philippine cities organized by major regions
const PHILIPPINE_CITIES = [
  // Metro Manila
  'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Manila', 'Marikina', 'Muntinlupa',
  'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'Pateros', 'Quezon City', 'San Juan', 'Taguig', 'Valenzuela',

  // Luzon (North)
  'Baguio', 'Dagupan', 'San Fernando (La Union)', 'Vigan', 'Tuguegarao', 'Batac', 'Laoag',

  // Luzon (Central)
  'Angeles', 'San Fernando (Pampanga)', 'Olongapo', 'Balanga', 'Cabanatuan', 'Gapan', 'Palayan',
  'San Jose del Monte', 'Tuguegarao', 'Batac', 'Laoag',

  // Luzon (South)
  'Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Lucena', 'Tayabas', 'San Pablo',
  'Calamba', 'Santa Rosa', 'Biñan', 'Cabuyao', 'San Pedro', 'Santa Cruz', 'Alaminos',

  // Visayas
  'Cebu City', 'Mandaue', 'Lapu-Lapu', 'Talisay', 'Toledo', 'Danao', 'Carcar', 'Bogo',
  'Bacolod', 'Talisay (Negros Occidental)', 'Silay', 'Cadiz', 'Escalante', 'Sagay', 'Victorias',
  'Iloilo City', 'Passi', 'Roxas', 'Tacloban', 'Ormoc', 'Baybay', 'Calbayog',

  // Mindanao
  'Davao City', 'Tagum', 'Panabo', 'Digos', 'Mati', 'Samal', 'Cagayan de Oro', 'Iligan',
  'Butuan', 'Surigao', 'Bislig', 'Tandag', 'Bayugan', 'Malaybalay', 'Valencia', 'Ozamiz',
  'Tangub', 'Oroquieta', 'Dipolog', 'Dapitan', 'Pagadian', 'Zamboanga City', 'Isabela',

  // Other major cities
  'General Santos', 'Koronadal', 'Tacurong', 'Kidapawan', 'Cotabato City', 'Marawi',
  'Lamitan', 'Samal', 'Dipolog', 'Pagadian', 'Surigao', 'Butuan'
].sort();

const Profile = () => {
  const navigate = useNavigate();
  const { customerId } = useParams(); // Get customer ID from URL params
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Customer data state
  const [userData, setUserData] = useState({
    id: null,
    customerId: '',
    companyName: '',
    contactName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Philippines',
    telephone1: '',
    telephone2: '',
    email1: '',
    email2: '',
    balance: 0,
    notes: '',
    isActive: true
  });

  // User account email state (from auth context)
  const [userEmail, setUserEmail] = useState('');

  const [editData, setEditData] = useState({ ...userData });
  const [editUserEmail, setEditUserEmail] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Helper function to format customer data consistently
  const formatCustomerData = (customer) => ({
    id: customer.id,
    customerId: customer.customerId || '',
    companyName: customer.customerName || '', // Map customerName to companyName for display
    contactName: customer.contactName || '',
    street: customer.street || '',
    city: customer.city || '',
    postalCode: customer.postalCode || '',
    country: customer.country || 'Philippines',
    telephone1: customer.telephone1 || '',
    telephone2: customer.telephone2 || '',
    email1: customer.email1 || '',
    email2: customer.email2 || '',
    balance: customer.balance || 0,
    notes: customer.notes || '',
    isActive: customer.isActive !== undefined ? customer.isActive : true
  });

  // Fetch customer data on component mount (client loads own record; admin uses URL param)
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize user email from auth context
        if (user?.email) {
          setUserEmail(user.email);
          setEditUserEmail(user.email);
        }

        if (user?.role === 'Client') {
          const me = await getMyCustomer();
          if (me.success && me.data) {
            const c = me.data;
            const formattedData = formatCustomerData(c);
            setUserData(formattedData);
            setEditData(formattedData);
            // Opens edit mode if required fields are missing
            if (!formattedData.companyName || !formattedData.telephone1 || !user?.email || 
              !formattedData.street || !formattedData.city || !formattedData.postalCode || !formattedData.country) {
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
              const formattedData = formatCustomerData(customer);
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

  // Handle click outside city dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownOpen && !event.target.closest('.city-dropdown-container')) {
        setCityDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cityDropdownOpen]);

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleEdit = () => {
    setEditData({ ...userData });
    setEditUserEmail(userEmail);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      setError(null);
      setFormError(null);
      setFieldErrors({});
      
      // Validation helpers
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phPostalRegex = /^\d{4}$/;
      const phStreetRegex = /^[A-Za-z0-9\s]+$/;

      const newErrors = {};

      // Required fields: companyName, account email, and telephone1
      if (!editData.companyName || editData.companyName.trim() === '') {
        newErrors.companyName = 'Company name is required';
      }
      if (!editUserEmail || editUserEmail.trim() === '') {
        newErrors.email1 = 'Account email is required';
      } else if (!emailRegex.test(editUserEmail)) {
        newErrors.email1 = 'Please enter a valid email address';
      }
      // Check if telephone1 is empty or incomplete
      if (!editData.telephone1 ||
          editData.telephone1.trim() === '' ||
          editData.telephone1 === '+' ||
          (editData.telephone1.startsWith('+') && editData.telephone1.length < 13) || // Too short for a complete number
          /^\+\d{1,3}$/.test(editData.telephone1)) { // Just country code
        newErrors.telephone1 = 'Telephone 1 is empty or incomplete';
      }

      // Optional fields: validate format only if provided
      if (editData.contactName && !phStreetRegex.test(editData.contactName)) {
        newErrors.contactName = 'Please enter a valid name';
      }
      if (editData.email2 && !emailRegex.test(editData.email2)) {
        newErrors.email2 = 'Please enter a valid email address';
      }
      if (editData.street && !phStreetRegex.test(editData.street)) {
        newErrors.street = 'Please enter a valid street';
      }
      // City validation is handled by dropdown selection
      if (editData.postalCode && !phPostalRegex.test(editData.postalCode)) {
        newErrors.postalCode = 'Please enter a valid 4-digit postal code';
      }
      // Country validation is not needed since it's fixed to Philippines and non-editable

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        setFormError('Please fix the highlighted fields');
        return;
      }
      
      // Check if all required fields are filled to determine profile completion
      const requiredFields = [
        editData.companyName,
        editUserEmail,
        editData.telephone1,
        editData.street,
        editData.city,
        editData.postalCode,
        editData.country
      ];
      
      const allRequiredFieldsFilled = requiredFields.every(field => 
        field && field.toString().trim() !== ''
      );

      // Transform form data to match backend model
      const updatePayload = {
        customerName: editData.companyName, // Map companyName to customerName for backend
        street: editData.street,
        city: editData.city,
        postalCode: editData.postalCode,
        country: editData.country,
        contactName: editData.contactName,
        telephone1: editData.telephone1,
        telephone2: editData.telephone2,
        email1: editUserEmail, // Use account email as email1
        email2: editData.email2, // Keep original email2 as email2
        notes: editData.notes
        // profileCompleted will be auto-determined by backend based on required fields
      };
      
      // Update customer record
      const customerResponse = await updateCustomer(userData.id, updatePayload);
      
      if (customerResponse.success) {
        // Update user account if it's a Client account
        if (user?.role === 'Client') {
          try {
            const userUpdateData = {};
            
            // Update name if company name changed
            if (editData.companyName !== userData.companyName) {
              userUpdateData.name = editData.companyName;
            }
            
            // Update email if user email changed
            if (editUserEmail !== userEmail) {
              userUpdateData.email = editUserEmail;
            }
            
            // Only call update if there are changes
            if (Object.keys(userUpdateData).length > 0) {
              const userResponse = await updateMyUser(userUpdateData);
              if (!userResponse.success) {
                setFormError(userResponse.message || 'Failed to update user account');
                return;
              }
            }
          } catch (userErr) {
            console.error('Failed to update user account:', userErr);
            setFormError(userErr.message || 'Failed to update user account');
            return;
          }
        }
        
        setUserData({ ...userData, ...editData });
        setUserEmail(editUserEmail);
        setIsEditing(false);
        // You could show a success message here
      } else {
        setError(customerResponse.message || 'Failed to update customer');
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
    setEditUserEmail(userEmail);
    setIsEditing(false);
    setError(null);
    setFormError(null);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleUserEmailChange = (value) => {
    setEditUserEmail(value);
    if (fieldErrors.email1) {
      setFieldErrors(prev => ({ ...prev, email1: null }));
    }
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

      {/* Required Fields Notice */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              Required Fields for Ordering
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              The following fields are required to place orders:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Company Name</li>
              <li>• Telephone 1</li>
              <li>• Email Address</li>
              <li>• Complete Address (Street, City, Postal Code, Country)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(error || formError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error || formError}</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Account Email</label>
              <div className="text-gray-900 font-medium text-sm sm:text-base break-all">{userEmail}</div>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Current Balance</label>
              <div className="text-gray-900 font-medium text-sm sm:text-base">${userData.balance.toLocaleString()}</div>
            </div> */}
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
                <>
                  <input
                    type="text"
                    value={editData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    aria-invalid={!!fieldErrors.companyName}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base ${fieldErrors.companyName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.companyName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>
                  )}
                </>
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.companyName}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Contact Name</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base ${fieldErrors.contactName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    aria-invalid={!!fieldErrors.contactName}
                  />
                  {fieldErrors.contactName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.contactName}</p>
                  )}
                </>
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
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Telephone 1 </label>
              {isEditing ? (
                <>
                  <PhoneInputField
                    id="telephone1"
                    label=""
                    value={editData.telephone1}
                    onChange={(e) => handleInputChange('telephone1', e.target.value)}
                    error={fieldErrors.telephone1}
                    width="w-full"
                  />
                </>
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.telephone1}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Telephone 2</label>
              {isEditing ? (
                <>
                  <PhoneInputField
                    id="telephone2"
                    label=""
                    value={editData.telephone2}
                    onChange={(e) => handleInputChange('telephone2', e.target.value)}
                    error={fieldErrors.telephone2}
                    width="w-full"
                    defaultCountry="ph"
                  />
                </>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Email 1 (Account Email)</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => handleUserEmailChange(e.target.value)}
                    aria-invalid={!!fieldErrors.email1}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base ${
                      fieldErrors.email1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {fieldErrors.email1 && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email1}</p>
                  )}
                </>
              ) : (
                <div className="text-gray-900 break-all text-sm sm:text-base font-medium">{userEmail}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Email 2</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={editData.email2}
                    onChange={(e) => handleInputChange('email2', e.target.value)}
                    aria-invalid={!!fieldErrors.email2}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base ${fieldErrors.email2 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.email2 && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email2}</p>
                  )}
                </>
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
                <>
                  <input
                    type="text"
                    value={editData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    aria-invalid={!!fieldErrors.street}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base ${fieldErrors.street ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.street && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.street}</p>
                  )}
                </>
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.street}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">City</label>
              {isEditing ? (
                <>
                  <div className="city-dropdown-container relative">
                    <div
                      className={`w-full px-3 py-2 md:px-4 md:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base cursor-pointer flex items-center justify-between ${fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                    >
                      <span className={editData.city ? 'text-gray-900' : 'text-gray-500'}>
                        {editData.city || 'Select a city'}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transform transition-transform ${cityDropdownOpen ? 'rotate-90' : ''}`} />
                    </div>

                    {cityDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500"
                          onClick={() => {
                            handleInputChange('city', '');
                            setCityDropdownOpen(false);
                          }}
                        >
                          Select a city
                        </div>
                        {PHILIPPINE_CITIES.map((city) => (
                          <div
                            key={city}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${editData.city === city ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                            onClick={() => {
                              handleInputChange('city', city);
                              setCityDropdownOpen(false);
                            }}
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {fieldErrors.city && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>
                  )}
                </>
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.city}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Postal Code</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    aria-invalid={!!fieldErrors.postalCode}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 border focus:outline-none rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base ${fieldErrors.postalCode ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.postalCode && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.postalCode}</p>
                  )}
                </>
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.postalCode}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Country</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value="Philippines"
                    disabled={true}
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg text-sm sm:text-base cursor-not-allowed"
                  />
                </>
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.country || 'Philippines'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        {/* <div className="border-t border-gray-200 mb-4 md:mb-6"></div> */}

        {/* Additional Information */}
        {/* <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
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
        </div> */}
      </div>
    </div>
    </>
  );
};

export default Profile;
