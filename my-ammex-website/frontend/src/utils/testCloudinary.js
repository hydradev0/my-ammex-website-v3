// Test Cloudinary configuration
import { uploadImageToCloudinary } from '../services/cloudinaryService';

/**
 * Test Cloudinary configuration
 * This function can be called from the browser console to test your setup
 */
export const testCloudinaryConfig = () => {
  console.log('Testing Cloudinary configuration...');
  
  // Check environment variables
  const getEnvVar = (key) => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // Check for Vite environment variables
    if (typeof window !== 'undefined' && window.import && window.import.meta && window.import.meta.env) {
      return window.import.meta.env[key];
    }
    return undefined;
  };

  const config = {
    cloudName: getEnvVar('REACT_APP_CLOUDINARY_CLOUD_NAME'),
    uploadPreset: getEnvVar('REACT_APP_CLOUDINARY_UPLOAD_PRESET'),
    apiKey: getEnvVar('REACT_APP_CLOUDINARY_API_KEY')
  };
  
  console.log('Configuration:', {
    cloudName: config.cloudName ? '✅ Set' : '❌ Missing',
    uploadPreset: config.uploadPreset ? '✅ Set' : '❌ Missing',
    apiKey: config.apiKey ? '✅ Set' : '❌ Missing'
  });
  
  if (!config.cloudName || !config.uploadPreset) {
    console.error('❌ Cloudinary configuration incomplete. Please check your .env file.');
    return false;
  }
  
  console.log('✅ Cloudinary configuration looks good!');
  return true;
};

/**
 * Test image upload with a sample image
 * This creates a small test image and uploads it
 */
export const testImageUpload = async () => {
  console.log('Testing image upload...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    // Convert canvas to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    // Create a File object
    const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
    
    // Upload to Cloudinary
    const result = await uploadImageToCloudinary(testFile, {
      folder: 'ammex-test'
    });
    
    if (result.success) {
      console.log('✅ Test upload successful!');
      console.log('Image URL:', result.url);
      console.log('Public ID:', result.public_id);
      return result;
    } else {
      console.error('❌ Test upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Test upload error:', error);
    return null;
  }
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.testCloudinaryConfig = testCloudinaryConfig;
  window.testImageUpload = testImageUpload;
  
  console.log('Cloudinary test functions available:');
  console.log('- testCloudinaryConfig() - Check configuration');
  console.log('- testImageUpload() - Test image upload');
}

export default {
  testCloudinaryConfig,
  testImageUpload
};
