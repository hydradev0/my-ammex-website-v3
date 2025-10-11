import React from 'react';
import { createPortal } from 'react-dom';
import ScrollLock from '../Components/ScrollLock';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const ProfileCompletionModal = ({ isOpen, onClose, onComplete }) => {
  const navigate = useNavigate();

  const handleCompleteProfile = () => {
    // Close modal and navigate to profile page
    onClose();
    navigate('/Products/Profile');
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-gray-600">
                  Required to place orders
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Required Fields Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Required Information for Ordering
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Please complete your profile with the following information:
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

          <p className="text-gray-600 text-sm">
            You'll be redirected to your profile page where you can fill in the required information.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={handleCompleteProfile}
              className="px-6 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
  return createPortal(modalContent, document.body);
};

export default ProfileCompletionModal;
