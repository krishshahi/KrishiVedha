# React Native FormData Upload Fix

## Problem Description

The React Native app was unable to upload images to the backend because of a mismatch between how React Native's FormData works and how the backend expected multipart/form-data.

### What was happening:
1. React Native was sending file metadata as JSON in the request body instead of proper multipart data
2. The backend's multer middleware couldn't parse the React Native FormData format
3. This resulted in `req.file` being `undefined` and the file data being in `req.body.image` as metadata

### Error logs showed:
- `req.file: undefined`
- `req.body: { image: { uri: '...', type: '...', name: '...' } }`
- "No image file provided" error

## Solution Implemented

### 1. Frontend Changes (React Native)

**File: `frontend/src/services/imageService.ts`**
- Updated FormData creation to properly format image objects
- Added explicit `Content-Type: multipart/form-data` header
- Enhanced logging for debugging

**File: `frontend/src/services/apiService.ts`**  
- Added proper headers for multipart requests
- Added `transformRequest` to preserve FormData format
- Improved error handling and logging

### 2. Backend Changes (Node.js/Express)

**File: `backend/server.js`**
- Added detection logic for React Native FormData format
- Created separate handlers for React Native vs standard uploads
- Implemented `handleReactNativeImageUpload()` function
- Maintained backward compatibility with standard uploads

### Key Implementation Details

#### React Native Detection Logic:
```javascript
const isReactNativeFormData = req.headers['content-type']?.includes('multipart/form-data') && 
                              req.body && 
                              typeof req.body.image === 'object' && 
                              req.body.image.uri;
```

#### React Native Handler:
- Extracts image metadata from `req.body.image`
- Creates mock file object for compatibility
- Stores the React Native URI directly (in production, you'd download and save the file)
- Maintains same API response format

## How to Test

### 1. Start the backend server:
```bash
cd backend
npm start
```

### 2. Create test data:
```bash
node create-test-crop.js
```

### 3. Test the upload fix:
```bash
node test-rn-upload.js
```

### 4. Test from React Native app:
- Use the image upload functionality in your crop management screen
- Check the backend logs to see which handler is being used
- Verify images are properly stored

## Expected Behavior After Fix

### Backend logs should show:
- `🔍 Detected React Native FormData format` (for RN uploads)
- `🔍 Using standard multer processing` (for other uploads)
- `✅ React Native image upload successful` or `✅ Standard image upload successful`

### API responses:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "url": "file:///path/to/image.jpg",
    "caption": "...",
    "stage": "...",
    "uploadDate": "...",
    "filename": "..."
  },
  "message": "Image added to crop successfully"
}
```

## Production Considerations

The current implementation stores React Native URIs directly. For production, you should:

1. **Download and save files properly:**
   ```javascript
   // Instead of: const imageUrl = imageData.uri;
   // Download the file and save it to your uploads directory
   const savedPath = await downloadAndSaveImage(imageData.uri);
   const imageUrl = `/uploads/${savedPath}`;
   ```

2. **Add proper file validation:**
   - Check file size limits
   - Validate image formats
   - Scan for malicious content

3. **Implement proper error handling:**
   - Network timeouts
   - Disk space issues
   - Permission errors

4. **Add authentication/authorization:**
   - Verify user can upload to this crop
   - Rate limiting
   - File upload quotas

## Files Modified

### Frontend:
- `frontend/src/services/imageService.ts` - Updated FormData creation
- `frontend/src/services/apiService.ts` - Fixed request configuration

### Backend:
- `backend/server.js` - Added dual-mode upload handling

### Test Files:
- `create-test-crop.js` - Creates test data
- `test-rn-upload.js` - Tests the upload functionality

## Troubleshooting

### If uploads still fail:

1. **Check network connectivity:**
   - Ensure React Native app can reach the backend
   - Verify the API URL is correct

2. **Check backend logs:**
   - Look for the detection logic output
   - Check for any error messages

3. **Verify test crop exists:**
   - Run `node create-test-crop.js` to ensure test data is available

4. **Test with curl:**
   ```bash
   curl -X POST http://localhost:3000/api/crops/64f8b9c0a8b4c5d6e7f8g9h0/images \
        -H "Content-Type: multipart/form-data" \
        -d '{"image":{"uri":"test","type":"image/jpeg","name":"test.jpg"}}'
   ```

This fix ensures compatibility with React Native's FormData implementation while maintaining support for standard multipart uploads from other clients.
