import { useState, useEffect } from 'react';
import { getMyCustomer } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';

const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  // Check if profile is completed based on required fields
  const checkProfileCompletion = (customer) => {
    if (!customer || !user) return false;

    const requiredFields = [
      customer.customerName,
      customer.telephone1,
      customer.email1 || user.email,
      customer.addressLine1,
      customer.barangay,
      customer.city,
      customer.postalCode,
      customer.country
    ];

    // Check if all required fields are filled
    const allFieldsFilled = requiredFields.every(field => 
      field && field.toString().trim() !== ''
    );

    // Primary check: use database profileCompleted flag
    const dbProfileComplete = customer.profileCompleted === true;

    // If database says completed, trust it. Otherwise, check fields.
    return dbProfileComplete || allFieldsFilled;
  };

  // Fetch customer data and check completion status
  const checkProfileStatus = async () => {
    if (!user || user.role !== 'Client') {
      setIsLoading(false);
      setIsProfileComplete(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await getMyCustomer();
      
      if (response.success && response.data) {
        const customer = response.data;
        setCustomerData(customer);
        
        const isComplete = checkProfileCompletion(customer);
        setIsProfileComplete(isComplete);
        
        // Show modal if profile is incomplete AND modal hasn't been shown this session
        if (!isComplete) {
          const modalShownKey = `profileModalShown_${user.id}`;
          const hasModalBeenShown = sessionStorage.getItem(modalShownKey);
          
          if (!hasModalBeenShown) {
            setShowModal(true);
            // Mark that modal has been shown for this user this session
            sessionStorage.setItem(modalShownKey, 'true');
          }
        }
      } else {
        // If no customer data found, assume incomplete
        setIsProfileComplete(false);
        const modalShownKey = `profileModalShown_${user.id}`;
        const hasModalBeenShown = sessionStorage.getItem(modalShownKey);
        
        if (!hasModalBeenShown) {
          setShowModal(true);
          sessionStorage.setItem(modalShownKey, 'true');
        }
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      // On error, assume incomplete to be safe
      setIsProfileComplete(false);
      const modalShownKey = `profileModalShown_${user.id}`;
      const hasModalBeenShown = sessionStorage.getItem(modalShownKey);
      
      if (!hasModalBeenShown) {
        setShowModal(true);
        sessionStorage.setItem(modalShownKey, 'true');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial check when component mounts or user changes
  useEffect(() => {
    checkProfileStatus();
  }, [user]);

  // Function to refresh profile status (called after profile update)
  const refreshProfileStatus = async () => {
    await checkProfileStatus();
  };

  // Function to close modal (user can skip)
  const closeModal = () => {
    setShowModal(false);
  };

  // Function to handle profile completion (called after successful update)
  const onProfileComplete = () => {
    setIsProfileComplete(true);
    setShowModal(false);
    // Clear the modal shown flag since profile is now complete
    if (user?.id) {
      const modalShownKey = `profileModalShown_${user.id}`;
      sessionStorage.removeItem(modalShownKey);
    }
    // Refresh the status to get updated data from database
    checkProfileStatus();
  };

  return {
    isProfileComplete,
    isLoading,
    showModal,
    customerData,
    closeModal,
    onProfileComplete,
    refreshProfileStatus
  };
};

export default useProfileCompletion;
