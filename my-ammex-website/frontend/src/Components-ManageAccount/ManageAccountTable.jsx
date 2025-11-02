import React, { useState, useEffect, useMemo } from 'react';
import { apiCall } from '../utils/apiConfig';
import { Search, X } from 'lucide-react';
import { TabNavigation, SalesDepartmentTab, WarehouseDepartmentTab, ClientServicesTab } from './AccountTabs';
import { AccountModal, PasswordChangeModal } from './AccountModals';
import SuccessModal from '../Components/SuccessModal';

const ManageAccountTable = () => {
  // Available roles and departments - fetched from API
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'warehouse', or 'clients'

  const [allUsers, setAllUsers] = useState([]); // Store all users for duplicate checking
  const [salesAccounts, setSalesAccounts] = useState([]);
  const [warehouseAccounts, setWarehouseAccounts] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Sales Marketing',
    department: 'Sales',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('');

  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  // Search state
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch users, roles, and departments on component mount
  useEffect(() => {
    fetchAllUsers();
    fetchRolesAndDepartments();
  }, []);

  const fetchRolesAndDepartments = async () => {
    try {
      // Fetch roles and departments in parallel
      const [rolesResponse, departmentsResponse] = await Promise.all([
        apiCall('/auth/roles'),
        apiCall('/auth/departments')
      ]);
      
      setAvailableRoles(rolesResponse.data);
      setAvailableDepartments(departmentsResponse.data);
    } catch (err) {
      console.error('Failed to fetch roles and departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Fetch all users including inactive
      const response = await apiCall('/auth/users?includeInactive=true');
      const users = response.data;
      
      // Store all users for duplicate checking
      setAllUsers(users);
      
      // Filter users by department/role, excluding Admin
      const salesUsers = users.filter(user => 
        user.department === 'Sales' && user.role !== 'Admin'
      );
      const warehouseUsers = users.filter(user => 
        user.department === 'Warehouse' && user.role !== 'Admin'
      );
      const clientUsers = users.filter(user => 
        user.role === 'Client' || user.department === 'Client Services'
      );
      
      setSalesAccounts(salesUsers);
      setWarehouseAccounts(warehouseUsers);
      setClientAccounts(clientUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users');
    }
  };

  // Filtered data based on search only
  const filteredData = useMemo(() => {
    let currentData = [];
    if (activeTab === 'sales') {
      currentData = salesAccounts;
    } else if (activeTab === 'warehouse') {
      currentData = warehouseAccounts;
    } else if (activeTab === 'clients') {
      currentData = clientAccounts;
    }
    
    return currentData.filter(user => {
      // Search filter only
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [activeTab, salesAccounts, warehouseAccounts, clientAccounts, searchTerm]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Check if search is active
  const hasActiveSearch = searchTerm;

  const handleCreateSalesAccount = () => {
    setOpen(true);
    setEditMode(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Sales Marketing',
      department: 'Sales',
    });
  };

  const handleCreateWarehouseAccount = () => {
    setOpen(true);
    setEditMode(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Warehouse Supervisor',
      department: 'Warehouse',
    });
  };

  const handleCreateClientAccount = () => {
    setOpen(true);
    setEditMode(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Client',
      department: 'Client Services',
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setIsSubmitting(false);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      password: '', // This will be excluded when submitting
      confirmPassword: '', // Not used in edit mode
    });
    setEditMode(true);
    setOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (!user) {
      setError('Error: No user selected for status update.');
      return;
    }
    
    // Get the user ID - check for different possible ID field names
    const userId = user.id || user._id || user.userId;
    
    if (!userId) {
      setError('Error: User ID is missing. Cannot update status.');
      return;
    }
    
    // Toggle the isActive status
    const newStatus = user.isActive === false ? true : false;
    
    try {
      await apiCall(`/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newStatus })
      });
      
      // Show success modal for status change
      setSuccessTitle('Status Updated!');
      setSuccessMessage(`${user.name}'s account has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      setShowSuccessModal(true);
      
      // Refresh data to get updated list
      await fetchAllUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setFieldErrors({});
    
    // Validation for both create and edit modes
    const errors = {};
    
    // Name validation (required for both modes)
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Email validation (required for both modes)
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Check for duplicate email
    if (formData.email.trim()) {
      const duplicateEmail = allUsers.find(user => {
        const userEmail = user.email.toLowerCase().trim();
        const inputEmail = formData.email.toLowerCase().trim();
        
        if (editMode) {
          // When editing, exclude the current user being edited
          return userEmail === inputEmail && 
                 user.id !== (selectedEmployee?.id || selectedEmployee?._id || selectedEmployee?.userId);
        } else {
          // When creating, check all users
          return userEmail === inputEmail;
        }
      });
      
      if (duplicateEmail) {
        errors.email = 'This email is already in use by another account';
      }
    }
    
    // Check for duplicate name
    if (formData.name.trim()) {
      const duplicateName = allUsers.find(user => {
        const userName = user.name.toLowerCase().trim();
        const inputName = formData.name.toLowerCase().trim();
        
        if (editMode) {
          // When editing, exclude the current user being edited
          return userName === inputName && 
                 user.id !== (selectedEmployee?.id || selectedEmployee?._id || selectedEmployee?.userId);
        } else {
          // When creating, check all users
          return userName === inputName;
        }
      });

      if (duplicateName) {
        if (formData.role === 'Client') {
            errors.name = 'Company name already exists';
        } else {
            errors.name = 'Name already exists';
        }
    }
    }
    
    // Password validation (only for create mode)
    if (!editMode) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
      
      // Confirm password validation (only for create mode)
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (editMode) {
        // Get the user ID - check for different possible ID field names
        const userId = selectedEmployee.id || selectedEmployee._id || selectedEmployee.userId;
        
        if (!userId) {
          setError('Error: Cannot update user - ID is missing.');
          return;
        }
        
        // When editing, exclude password and confirmPassword from the update
        const { password, confirmPassword, ...updateData } = formData;
        await apiCall(`/auth/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });
        
        // Show success modal for updates
        setSuccessTitle('Account Updated!');
        setSuccessMessage(`${formData.name}'s account has been updated successfully.`);
        setShowSuccessModal(true);
      } else {
        // When creating, exclude confirmPassword from the API call
        const { confirmPassword, ...createData } = formData;
        await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify(createData)
        });
        
        // Show success modal for creation
        setSuccessTitle('Account Created!');
        setSuccessMessage(`${formData.name}'s account has been created successfully.`);
        setShowSuccessModal(true);
      }
      handleClose();
      // Refresh all user lists
      fetchAllUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Operation failed';
      
      // Check if error is about email or name duplication
      if (errorMessage.toLowerCase().includes('email already exists')) {
        setFieldErrors({ email: 'This email is already in use by another account' });
      } else if (errorMessage.toLowerCase().includes('name already exists')) {
        setFieldErrors({ name: 'This name is already in use by another account' });
      } else if (errorMessage.toLowerCase().includes('user already exists')) {
        // Generic fallback for old error messages
        setFieldErrors({ email: 'This email is already in use by another account' });
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error when user starts typing
    if (error) setError('');
  };

  // Password change functions
  const openPasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setPasswordFormData({
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordFieldErrors({});
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setSelectedUserForPassword(null);
    setPasswordFormData({
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordFieldErrors({});
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    setPasswordFormData({
      ...passwordFormData,
      [name]: value,
    });
    
    // Clear field error when user starts typing
    if (passwordFieldErrors[name]) {
      setPasswordFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error when user starts typing
    if (passwordError) setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setPasswordError('');
    setPasswordFieldErrors({});
    
    // Validation
    const errors = {};
    
    // New password validation
    if (!passwordFormData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordFormData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    
    // Confirm password validation
    if (!passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors);
      return;
    }

    try {
      // Get the user ID - check for different possible ID field names
      const userId = selectedUserForPassword.id || selectedUserForPassword._id || selectedUserForPassword.userId;
      
      if (!userId) {
        setPasswordError('Error: Cannot change password - user ID is missing.');
        return;
      }
      
      await apiCall(`/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          password: passwordFormData.newPassword
        })
      });
      
      // Show success modal for password change
      setSuccessTitle('Password Changed!');
      setSuccessMessage(`${selectedUserForPassword.name}'s password has been updated successfully.`);
      setShowSuccessModal(true);
      closePasswordModal();
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };



  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Status Messages */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Clear Search Button */}
          {hasActiveSearch && (
            <button
              onClick={clearSearch}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          {/* Results Count */}
          <div className="flex justify-end items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredData.length} of {
                activeTab === 'sales' ? salesAccounts.length :
                activeTab === 'warehouse' ? warehouseAccounts.length :
                clientAccounts.length
              } accounts
            </div>
          </div>
        </div>
      </div>

      {/* Sales Department Tab */}
      {activeTab === 'sales' && (
        <SalesDepartmentTab
          accounts={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onToggleStatus={handleToggleStatus}
          onCreateNew={handleCreateSalesAccount}
        />
      )}

      {/* Warehouse Department Tab */}
      {activeTab === 'warehouse' && (
        <WarehouseDepartmentTab
          accounts={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onToggleStatus={handleToggleStatus}
          onCreateNew={handleCreateWarehouseAccount}
        />
      )}

      {/* Client Services Tab */}
      {activeTab === 'clients' && (
        <ClientServicesTab
          accounts={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onToggleStatus={handleToggleStatus}
          onCreateNew={handleCreateClientAccount}
        />
      )}

      {/* Modal for creating/editing accounts */}
      <AccountModal
        open={open}
        editMode={editMode}
        formData={formData}
        error={error}
        success={success}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />

      {/* Password Change Modal */}
      <PasswordChangeModal
        open={passwordModalOpen}
        user={selectedUserForPassword}
        formData={passwordFormData}
        error={passwordError}
        success={passwordSuccess}
        fieldErrors={passwordFieldErrors}
        onClose={closePasswordModal}
        onSubmit={handlePasswordSubmit}
        onChange={handlePasswordChange}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        message={successMessage}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
};

export default ManageAccountTable;
