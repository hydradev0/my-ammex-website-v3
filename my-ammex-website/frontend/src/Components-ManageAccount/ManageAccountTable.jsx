import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { TabNavigation, StaffAccountsTab, ClientAccountsTab } from './AccountTabs';
import { AccountModal, PasswordChangeModal } from './AccountModals';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';

const ManageAccountTable = () => {
  // Available roles and departments - fetched from API
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'clients'

  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Sales Marketing',
    department: 'Sales',
  });

  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  // Fetch employees, roles, and departments on component mount
  useEffect(() => {
    fetchEmployees();
    fetchClients();
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

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for non-client users (staff)
      const staffUsers = response.data.data.filter(user => user.role !== 'Client');
      setEmployees(staffUsers);
    } catch (err) {
      setError('Failed to fetch employees');
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for client users only
      const clientUsers = response.data.data.filter(user => user.role === 'Client');
      setClients(clientUsers);
    } catch (err) {
      setError('Failed to fetch clients');
    }
  };

  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    const currentData = activeTab === 'staff' ? employees : clients;
    
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
  }, [activeTab, employees, clients, searchTerm, selectedRoleFilter, selectedDepartmentFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('');
    setSelectedDepartmentFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedRoleFilter || selectedDepartmentFilter;

  const handleOpen = () => {
    setOpen(true);
    setEditMode(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Sales Marketing',
      department: 'Sales',
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      password: '', // This will be excluded when submitting
    });
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Account deleted successfully');
      // Refresh both lists
      fetchEmployees();
      fetchClients();
      setDeleteModalOpen(false);
      setUserToDelete(null);
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
    try {
      const token = localStorage.getItem('token');
      if (editMode) {
        // When editing, exclude password from the update since it's not shown/required
        const { password, ...updateData } = formData;
        await axios.put(
          `/api/auth/users/${selectedEmployee.id}`,
          updateData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess('Account updated successfully');
      } else {
        // When creating, include password as it's required for new accounts
        await axios.post('/api/auth/register', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Account created successfully');
      }
      handleClose();
      // Refresh both lists
      fetchEmployees();
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
  };

  const handlePasswordChange = (e) => {
    setPasswordFormData({
      ...passwordFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordFormData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/auth/users/${selectedUserForPassword.id}`,
        {
          password: passwordFormData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setPasswordSuccess('Password changed successfully');
      setTimeout(() => {
        closePasswordModal();
      }, 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleCreateClient = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Client',
      department: 'Client Services',
    });
    setOpen(true);
    setEditMode(false);
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

      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
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
                  Showing {filteredData.length} of {(activeTab === 'staff' ? employees : clients).length} accounts
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff Accounts Tab */}
      {activeTab === 'staff' && (
        <StaffAccountsTab
          employees={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onDelete={handleDelete}
          onCreateNew={handleOpen}
        />
      )}

      {/* Client Accounts Tab */}
      {activeTab === 'clients' && (
        <ClientAccountsTab
          clients={filteredData}
          onEdit={handleEdit}
          onPasswordChange={openPasswordModal}
          onDelete={handleDelete}
          onCreateNew={handleCreateClient}
        />
      )}

      {/* Modal for creating/editing accounts */}
      <AccountModal
        open={open}
        editMode={editMode}
        formData={formData}
        availableRoles={availableRoles}
        availableDepartments={availableDepartments}
        isLoading={isLoading}
        error={error}
        success={success}
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
    </div>
  );
};

export default ManageAccountTable;
