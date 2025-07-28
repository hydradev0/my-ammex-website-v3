import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Edit, Save, X, User, Building, Phone, Mail, MapPin } from 'lucide-react';
import TopBarPortal from './TopBarPortal';

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data - in a real app, this would come from authentication context or API
  const [userData, setUserData] = useState({
    customerId: 'AC1001',
    companyName: 'ABC Corporation',
    contactName: 'John Smith',
    street: '123 Main St',
    city: 'New York',
    postalCode: '10001',
    country: 'USA',
    telephone1: '(555) 123-4567',
    telephone2: '(555) 987-6543',
    email1: 'accounts@abcmfg.com',
    email2: 'contact@abcmfg.com',
    balance: 1250.00,
    notes: 'Preferred contact method: Email'
  });

  const [editData, setEditData] = useState({ ...userData });

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

  const handleSave = () => {
    setUserData({ ...editData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">My Profile</h1>
        <div className="w-full sm:ml-auto sm:w-auto">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center justify-center gap-2 bg-[#48bb78] hover:bg-[#38a169] text-white px-4 py-2 rounded-3xl transition-colors w-full sm:w-auto"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 bg-[#48bb78] hover:bg-[#38a169] text-white px-4 py-2 rounded-3xl transition-colors w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-3xl transition-colors w-full sm:w-auto"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

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
                  value={editData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
                />
              ) : (
                <div className="text-gray-900 text-sm sm:text-base">{userData.companyName}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Contact Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3182ce] focus:border-transparent text-sm sm:text-base"
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
