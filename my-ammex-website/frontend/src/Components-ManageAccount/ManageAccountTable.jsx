import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { TabNavigation, SalesDepartmentTab, WarehouseDepartmentTab, ClientServicesTab } from './AccountTabs';
import { AccountModal, PasswordChangeModal } from './AccountModals';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import SuccessModal from '../Components/SuccessModal';

const ManageAccountTable = () => {
  // Available roles and departments - fetched from API
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'warehouse', or 'clients'

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

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Dropdown state and refs for filters
  const [roleFilterDropdownOpen, setRoleFilterDropdownOpen] = useState(false);
  const [departmentFilterDropdownOpen, setDepartmentFilterDropdownOpen] = useState(false);
  const roleFilterDropdownRef = useRef(null);
  const departmentFilterDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleFilterDropdownRef.current && !roleFilterDropdownRef.current.contains(event.target)) {
        setRoleFilterDropdownOpen(false);
      }
      if (departmentFilterDropdownRef.current && !departmentFilterDropdownRef.current.contains(event.target)) {
        setDepartmentFilterDropdownOpen(false);
      }
    };
    if (roleFilterDropdownOpen || departmentFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleFilterDropdownOpen, departmentFilterDropdownOpen]);

  // Fetch users, roles, and departments on component mount
  useEffect(() => {
    fetchAllUsers();
    fetchRolesAndDepartments();
  }, []);

  const fetchRolesAndDepartments = async () => {
    try {
      // Fetch roles and departments in parallel
      const [rolesResponse, departmentsResponse] = await Promise.all([
        axios.get('/api/auth/roles'),
        axios.get('/api/auth/departments')
      ]);
      
      setAvailableRoles(rolesResponse.data.data);
      setAvailableDepartments(departmentsResponse.data.data);
    } catch (err) {
      console.error('Failed to fetch roles and departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = response.data.data;
      
      // Filter users by department/role, excluding Admin
      const salesUsers = allUsers.filter(user => 
        user.department === 'Sales' && user.role !== 'Admin'
      );
      const warehouseUsers = allUsers.filter(user => 
        user.department === 'Warehouse' && user.role !== 'Admin'
      );
      const clientUsers = allUsers.filter(user => 
        user.role === 'Client' || user.department === 'Client Services'
      );
      
      setSalesAccounts(salesUsers);
      setWarehouseAccounts(warehouseUsers);
      setClientAccounts(clientUsers);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  // Filtered data based on search and filters
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
      // Search filter
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Role filter
      const matchesRole = selectedRoleFilter === '' || user.role === selectedRoleFilter;
      
      // Department filter
      const matchesDepartment = selectedDepartmentFilter === '' || user.department === selectedDepartmentFilter;
      
      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [activeTab, salesAccounts, warehouseAccounts, clientAccounts, searchTerm, selectedRoleFilter, selectedDepartmentFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('');
    setSelectedDepartmentFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedRoleFilter || selectedDepartmentFilter;

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

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) {
      setError('Error: No user selected for deletion.');
      return;
    }
    
    // Get the user ID - check for different possible ID field names
    const userId = userToDelete.id || userToDelete._id || userToDelete.userId;
    
    if (!userId) {
      setError('Error: User ID is missing. Cannot delete user.');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      return;
    }
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Clear any existing errors
      setError('');
      setDeleteModalOpen(false);
      
      // Show success modal for deletion
      setSuccessTitle('Account Deleted!');
      setSuccessMessage(`${userToDelete.name}'s account has been successfully removed from the system.`);
      setShowSuccessModal(true);
      setUserToDelete(null);
      
      // Refresh data to get updated list (without inactive users)
      await fetchAllUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
    setIsDeleting(false);
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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
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
        await axios.put(
          `/api/auth/users/${userId}`,
          updateData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Show success modal for updates
        setSuccessTitle('Account Updated!');
        setSuccessMessage(`${formData.name}'s account has been updated successfully.`);
        setShowSuccessModal(true);
      } else {
        // When creating, exclude confirmPassword from the API call
        const { confirmPassword, ...createData } = formData;
        await axios.post('/api/auth/register', createData, {
          headers: { Authorization: `Bearer ${token}` },
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
      setError(err.response?.data?.message || 'Operation failed');
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
      
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/auth/users/${userId}`,
        {
          password: passwordFormData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
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

      {/* Search and Filters Section */}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {[searchTerm, selectedRoleFilter, selectedDepartmentFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                <div className="relative w-full" ref={roleFilterDropdownRef}>
                  <button
                    type="button"
                    className="cursor-pointer w-full text-sm pl-3 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center"
                    onClick={() => setRoleFilterDropdownOpen((open) => !open)}
                    disabled={isLoading}
                  >
                    <span>{selectedRoleFilter || 'All Roles'}</span>
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${roleFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {roleFilterDropdownOpen && !isLoading && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <li
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-black"
                        onClick={() => {
                          setSelectedRoleFilter('');
                          setRoleFilterDropdownOpen(false);
                        }}
                      >
                        All Roles
                      </li>
                      {availableRoles.map((role) => (
                        <li
                          key={role.value}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-black ${selectedRoleFilter === role.value ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                          onClick={() => {
                            setSelectedRoleFilter(role.value);
                            setRoleFilterDropdownOpen(false);
                          }}
                        >
                          {role.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
                <div className="relative w-full" ref={departmentFilterDropdownRef}>
                  <button
                    type="button"
                    className="cursor-pointer w-full text-sm pl-3 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center"
                    onClick={() => setDepartmentFilterDropdownOpen((open) => !open)}
                    disabled={isLoading}
                  >
                    <span>{selectedDepartmentFilter || 'All Departments'}</span>
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${departmentFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {departmentFilterDropdownOpen && !isLoading && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <li
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-black"
                        onClick={() => {
                          setSelectedDepartmentFilter('');
                          setDepartmentFilterDropdownOpen(false);
                        }}
                      >
                        All Departments
                      </li>
                      {availableDepartments.map((dept) => (
                        <li
                          key={dept.value}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-black ${selectedDepartmentFilter === dept.value ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                          onClick={() => {
                            setSelectedDepartmentFilter(dept.value);
                            setDepartmentFilterDropdownOpen(false);
                          }}
                        >
                          {dept.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

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
        )}
      </div>

      {/* Sales Department Tab */}
      {activeTab === 'sales' && (
        <SalesDepartmentTab
          accounts={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onDelete={handleDelete}
          onCreateNew={handleCreateSalesAccount}
        />
      )}

      {/* Warehouse Department Tab */}
      {activeTab === 'warehouse' && (
        <WarehouseDepartmentTab
          accounts={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onDelete={handleDelete}
          onCreateNew={handleCreateWarehouseAccount}
        />
      )}

      {/* Client Services Tab */}
      {activeTab === 'clients' && (
        <ClientServicesTab
          accounts={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onDelete={handleDelete}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Account"
        entityName={userToDelete?.name}
        description="Are you sure you want to delete this account? The account will be removed from the system."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        loading={isDeleting}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        message={successMessage}
        autoClose={true}
        autoCloseDelay={4000}
      />
    </div>
  );
};

export default ManageAccountTable;
