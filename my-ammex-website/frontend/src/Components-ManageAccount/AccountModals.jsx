import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';

// Account Creation/Editing Modal
export const AccountModal = ({
  open,
  editMode,
  formData,
  availableRoles,
  availableDepartments,
  isLoading,
  error,
  success,
  onClose,
  onSubmit,
  onChange
}) => {
  // Dropdown open states and refs
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const departmentDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target)) {
        setDepartmentDropdownOpen(false);
      }
    };
    if (roleDropdownOpen || departmentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleDropdownOpen, departmentDropdownOpen]);

  if (!open) return null;

  const modalContent = (
    <>
      <ScrollLock active={open} />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
          <div className="flex items-center justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editMode ? 'Edit Account' : 'Create Account'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {editMode ? 'Update account information.' : 'Fill out the details to create a new account.'}
            </p>
          </div>
            <button
                type="button"
                onClick={onClose}
                className="p-2 mb-6 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X className="h-5 w-5" />
            </button>
          </div>
          

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

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            {!editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <div className="relative w-full" ref={roleDropdownRef}>
                <button
                  type="button"
                  className="cursor-pointer w-full text-sm pl-3 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center"
                  onClick={() => setRoleDropdownOpen((open) => !open)}
                  disabled={isLoading}
                >
                  <span>{formData.role || 'Select role'}</span>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {roleDropdownOpen && !isLoading && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {availableRoles.map((role) => (
                      <li
                        key={role.value}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-black ${formData.role === role.value ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                        onClick={() => {
                          onChange({ target: { name: 'role', value: role.value } });
                          setRoleDropdownOpen(false);
                        }}
                      >
                        {role.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <div className="relative w-full" ref={departmentDropdownRef}>
                <button
                  type="button"
                  className="cursor-pointer w-full text-sm pl-3 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center"
                  onClick={() => setDepartmentDropdownOpen((open) => !open)}
                  disabled={isLoading}
                >
                  <span>{formData.department || 'Select department'}</span>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${departmentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {departmentDropdownOpen && !isLoading && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {availableDepartments.map((dept) => (
                      <li
                        key={dept.value}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-black ${formData.department === dept.value ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                        onClick={() => {
                          onChange({ target: { name: 'department', value: dept.value } });
                          setDepartmentDropdownOpen(false);
                        }}
                      >
                        {dept.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg cursor-pointer bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

// Password Change Modal
export const PasswordChangeModal = ({
  open,
  user,
  formData,
  error,
  success,
  onClose,
  onSubmit,
  onChange
}) => {
  if (!open) return null;

  const modalContent = (
    <>
      <ScrollLock active={open} />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
          <div className="flex items-center justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            <p className="mt-1 text-sm text-gray-500">
              Change password for {user?.name} ({user?.email})
            </p>
          </div>
          <button
                type="button"
                onClick={onClose}
                className="p-2 mb-12 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X className="h-5 w-5" />
            </button>
          </div>

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

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={onChange}
                required
                minLength={6}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChange}
                required
                minLength={6}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg cursor-pointer bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
