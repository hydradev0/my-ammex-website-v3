import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadMultipleImages } from '../services/cloudinaryService';

const SimpleImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 4,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      setUploadError('Please select valid image files (JPEG, PNG, WebP, max 5MB)');
      return;
    }

    if (validFiles.length > maxImages) {
      setUploadError(`Maximum ${maxImages} images allowed`);
      return;
    }

    if (images.length + validFiles.length > maxImages) {
      setUploadError(`Maximum ${maxImages} images total allowed`);
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const uploadResults = await uploadMultipleImages(validFiles, {
        folder: 'ammex-products'
      });

      const successfulUploads = uploadResults
        .filter(result => result.success)
        .map(result => result.url);

      if (successfulUploads.length > 0) {
        onImagesChange([...images, ...successfulUploads]);
      }

      if (uploadResults.some(result => !result.success)) {
        setUploadError('Some images failed to upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  }, [images, maxImages, onImagesChange]);

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute cursor-pointer -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={handleBrowseClick}
            disabled={isUploading}
            className="w-full flex cursor-pointer flex-col items-center space-y-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
            <span className="text-sm">
              {isUploading ? 'Uploading...' : `Click to add images (${images.length}/${maxImages})`}
            </span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
          {uploadError}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <div className="text-sm text-gray-500">
          {images.length} image{images.length !== 1 ? 's' : ''} uploaded
        </div>
      )}
    </div>
  );
};

export default SimpleImageUpload;
