import React, { useState, useRef, useCallback } from 'react';
import { X, Image as ImageIcon, AlertCircle, Image} from 'lucide-react';
import PropTypes from 'prop-types';

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 4, 
  required = false,
  className = '' 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Validate file type and size
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload only JPEG, PNG, or WebP images';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    setUploadError('');

    // Check if adding these files would exceed the limit
    if (images.length + fileArray.length > maxImages) {
      setUploadError(`You can only upload up to ${maxImages} images. You currently have ${images.length} images.`);
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      // Convert files to preview URLs
      const newImages = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));

      onImagesChange([...images, ...newImages]);
    }
  }, [images, maxImages, onImagesChange]);

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Remove image
  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
    setUploadError('');
  };

  // Check if upload is required but no images
  const isRequiredError = required && images.length === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : isRequiredError
            ? 'border-blue-200 bg-gray-50'
            : 'border-blue-500 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${
            isDragOver ? 'bg-blue-100' : isRequiredError ? 'bg-gray-100' : 'bg-gray-100'
          }`}>
            <Image className={`w-8 h-8 ${
              isDragOver ? 'text-blue-600' : isRequiredError ? 'text-blue-600' : 'text-blue-600'
            }`} />
          </div>

          <div className="space-y-2">
            <p className={`text-lg font-medium ${
              isDragOver ? 'text-blue-700' : isRequiredError ? 'text-gray-700' : 'text-gray-700'
            }`}>
              {isDragOver 
                ? 'Drop images here' 
                : isRequiredError 
                ? 'Images are required'
                : 'Upload Product Images'
              }
            </p>
            <p className="text-sm  text-gray-500">
              Drag and drop images here, or{' '}
              <button
                type="button"
                onClick={handleBrowseClick}
                className="text-blue-600 cursor-pointer hover:text-blue-700 text-[15px] font-semibold"
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Max {maxImages} images • JPEG, PNG, WebP • Max 5MB each
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {uploadError && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {isRequiredError && !uploadError && (
        <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-700">At least one image is required</p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              disabled={images.length >= maxImages}
            >
              {images.length >= maxImages ? 'Maximum reached' : 'Add More'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 cursor-pointer -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image Info */}
                <div className="mt-1 text-xs text-gray-500 truncate" title={image.name}>
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no images */}
      {images.length === 0 && !isRequiredError && (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

ImageUpload.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      file: PropTypes.instanceOf(File).isRequired,
      preview: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onImagesChange: PropTypes.func.isRequired,
  maxImages: PropTypes.number,
  required: PropTypes.bool,
  className: PropTypes.string
};

export default ImageUpload;
