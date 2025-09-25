# Cloudinary Setup Guide

## Overview
This guide explains how to set up Cloudinary for image uploads in the Ammex website.

## Prerequisites
- Cloudinary account (free tier available)
- Access to your project's environment variables

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Cloudinary Credentials
1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Note down:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (keep this secure)

### 3. Create Upload Preset
1. In Cloudinary dashboard, go to "Settings" → "Upload"
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Configure:
   - **Preset name**: `ammex-upload-preset` (or any name you prefer)
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: `ammex-products` (optional, for organization)
   - **Access Mode**: `Public`
5. Save the preset

### 4. Configure Environment Variables
Add these variables to your `.env` file in the frontend directory:

```env
# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=ammex-upload-preset
REACT_APP_CLOUDINARY_API_KEY=129618191869762
```

### 5. Update Backend (Optional)
If you want to handle image uploads on the backend instead:

1. Install Cloudinary SDK:
   ```bash
   npm install cloudinary
   ```

2. Configure in your backend:
   ```javascript
   const cloudinary = require('cloudinary').v2;
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   });
   ```

## Features Implemented

### ✅ Image Upload Component
- **Drag & Drop**: Users can drag images directly onto the upload area
- **Browse Files**: Click to browse and select images
- **File Validation**: 
  - Supported formats: JPEG, PNG, WebP
  - Max file size: 5MB per image
  - Max images: 4 per product
- **Image Preview**: Shows thumbnails with remove functionality
- **Required Validation**: At least one image is required

### ✅ Cloudinary Integration
- **Automatic Upload**: Images are uploaded to Cloudinary on form submission
- **Optimized URLs**: Images are automatically optimized for web delivery
- **Folder Organization**: Images are stored in `ammex-products` folder
- **Error Handling**: Proper error handling for failed uploads

### ✅ Form Integration
- **Validation**: Images are validated before form submission
- **Loading States**: Shows loading state during image upload
- **Error Display**: Clear error messages for upload failures
- **Required Field**: Images are marked as required with red asterisk

## Usage

### For Users
1. Navigate to "Inventory" → "Items" → "New Item"
2. Fill in the product details
3. In the "Product Images" section:
   - Drag and drop images onto the upload area, OR
   - Click "browse files" to select images
4. Preview uploaded images and remove if needed
5. Submit the form

### For Developers
The image upload system is modular and can be reused:

```jsx
import ImageUpload from './Components-Inventory/ImageUpload';

<ImageUpload
  images={images}
  onImagesChange={setImages}
  maxImages={4}
  required={true}
/>
```

## Troubleshooting

### Common Issues
1. **Upload fails**: Check your Cloudinary credentials and upload preset
2. **Images not showing**: Verify the Cloudinary URLs are accessible
3. **File size errors**: Ensure images are under 5MB

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
REACT_APP_DEBUG_CLOUDINARY=true
```

## Security Notes
- Never expose your API Secret in frontend code
- Use unsigned upload presets for client-side uploads
- Consider implementing server-side uploads for production
- Set up proper CORS policies in Cloudinary

## Cost Considerations
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month
- Additional usage is charged per GB
- Monitor usage in your Cloudinary dashboard

## Next Steps
1. Set up Cloudinary account and get credentials
2. Add environment variables to your `.env` file
3. Test the image upload functionality
4. Consider implementing image optimization and transformations
5. Set up monitoring for storage and bandwidth usage
