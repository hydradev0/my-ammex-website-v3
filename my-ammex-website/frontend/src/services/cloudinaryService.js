// Cloudinary configuration and upload service
const getEnvVar = (key) => {
  // Try different ways to access environment variables
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // Check for Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

// Get configuration dynamically to ensure environment variables are loaded
const getCloudinaryConfig = () => {
  return {
    cloudName: getEnvVar('VITE_CLOUDINARY_CLOUD_NAME'),
    uploadPreset: getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET'),
    apiKey: getEnvVar('VITE_CLOUDINARY_API_KEY')
  };
};

// Configuration is loaded dynamically when needed

/**
 * Upload a single image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  // Get fresh configuration
  const config = getCloudinaryConfig();
  
  // Check if configuration is available
  if (!config.cloudName || !config.uploadPreset) {
    return {
      success: false,
      error: 'Cloudinary configuration missing. Please check your environment variables.'
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('cloud_name', config.cloudName);
  
  // Add any additional options
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  if (options.public_id) {
    formData.append('public_id', options.public_id);
  }
  if (options.transformation) {
    formData.append('transformation', options.transformation);
  }

  // Debug logging
  if (getEnvVar('VITE_DEBUG_CLOUDINARY') === 'true') {
    console.log('Uploading to Cloudinary:', {
      cloudName: config.cloudName,
      uploadPreset: config.uploadPreset,
      folder: options.folder,
      fileName: file.name,
      fileSize: file.size
    });
  }

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (getEnvVar('VITE_DEBUG_CLOUDINARY') === 'true') {
      console.log('Upload successful:', result);
    }

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of image files
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleImages = async (files, options = {}) => {
  const uploadPromises = files.map((file, index) => {
    const fileOptions = {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index}` : undefined
    };
    return uploadImageToCloudinary(file, fileOptions);
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    return files.map(() => ({
      success: false,
      error: error.message
    }));
  }
};

/**
 * Generate optimized image URLs for different sizes
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Image transformations
 * @returns {Object} - URLs for different sizes
 */
export const getOptimizedImageUrls = (publicId, transformations = {}) => {
  const config = getCloudinaryConfig();
  const baseUrl = `https://res.cloudinary.com/${config.cloudName}/image/upload`;
  
  return {
    thumbnail: `${baseUrl}/w_150,h_150,c_fill,f_auto,q_auto/${publicId}`,
    card: `${baseUrl}/w_400,h_300,c_fill,f_auto,q_auto/${publicId}`,
    detail: `${baseUrl}/w_800,h_600,c_fill,f_auto,q_auto/${publicId}`,
    original: `${baseUrl}/f_auto,q_auto/${publicId}`
  };
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImageFromCloudinary = async (publicId) => {
  // Get fresh configuration
  const config = getCloudinaryConfig();
  
  // Check if configuration is available
  if (!config.cloudName || !config.apiKey) {
    return {
      success: false,
      error: 'Cloudinary configuration missing. Cannot delete image.'
    };
  }

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id: publicId,
        api_key: config.apiKey
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary delete failed:', response.status, errorText);
      throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  uploadImageToCloudinary,
  uploadMultipleImages,
  getOptimizedImageUrls,
  deleteImageFromCloudinary
};
