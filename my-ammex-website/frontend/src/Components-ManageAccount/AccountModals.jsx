import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';

// Account Creation/Editing Modal
export const AccountModal = ({
  open,
  editMode,
  formData,
  error,
  success,
  fieldErrors,
  isSubmitting,
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
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  fieldErrors?.name 
                    ? 'border-red-300 focus:ring-red-500 focus:border-white' 
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-white'
                }`}
                placeholder="Enter Name (Company Name for Client Accounts)"
              />
              {fieldErrors?.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={onChange}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  fieldErrors?.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-white' 
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-white'
                }`}
                placeholder="Enter email address"
              />
              {fieldErrors?.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            
            {!editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={onChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    fieldErrors?.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-white' 
                      : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-white'
                  }`}
                  placeholder="Enter password (min. 6 characters)"
                />
                {fieldErrors?.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>
            )}
            {!editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword || ''}
                  onChange={onChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    fieldErrors?.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500 focus:border-white' 
                      : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-white'
                  }`}
                  placeholder="Confirm your password"
                />
                {fieldErrors?.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                readOnly
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm text-gray-700 cursor-not-allowed"
                placeholder="Role will be set based on department"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                readOnly
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm text-gray-700 cursor-not-allowed"
                placeholder="Department will be set based on tab"
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
                disabled={isSubmitting}
                className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isSubmitting 
                    ? 'bg-blue-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editMode ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editMode ? 'Update' : 'Create'
                )}
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
  fieldErrors,
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
              Change password for "{user?.name}" ({user?.email})
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
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={onChange}
                minLength={6}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  fieldErrors?.newPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-white' 
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-white'
                }`}
                placeholder="Enter new password (min. 6 characters)"
              />
              {fieldErrors?.newPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={onChange}
                minLength={6}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  fieldErrors?.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-white' 
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-white'
                }`}
                placeholder="Confirm new password"
              />
              {fieldErrors?.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
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
