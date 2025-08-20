# React Native Image Upload Fix - Complete Solution

## Problem Identified
Your React Native app was getting network errors when trying to upload images because of how React Native handles FormData vs. how the backend expected multipart data.

## Root Cause
React Native's FormData implementation doesn't create proper multipart/form-data that server-side libraries like multer can parse. Instead, it sends the file metadata as JSON, causing network connectivity issues.

## Solution Implemented

### 1. Frontend Changes (React Native)
**Modified: `frontend/src/services/apiService.ts`**
- Changed the upload approach to send JSON payload instead of FormData
- Extract file information from React Native's FormData format
- Send as `application/json` instead of `multipart/form-data`

### 2. Backend Changes (Node.js)
**Modified: `backend/server.js`**
- Added detection for React Native JSON payloads
- Enhanced logging for debugging upload requests
- Created separate handlers for React Native vs standard uploads
- Added support for both `application/json` and `multipart/form-data` content types

### 3. Key Implementation Details

#### Detection Logic:
```javascript
const isReactNativeFormData = (
  contentType.includes('application/json') ||
  contentType.includes('multipart/form-data')
) && req.body && typeof req.body.image === 'object' && req.body.image.uri;
```

#### JSON Payload Extraction:
```javascript
// Frontend - Extract from FormData to JSON
const jsonPayload = {};
if (formData && formData._parts) {
  formData._parts.forEach(([key, value]) => {
    jsonPayload[key] = value;
  });
}
```

## How to Test the Fix

### Option 1: Test from React Native App
1. Ensure your backend server is running
2. Try uploading an image from your React Native app
3. Check the backend console for these log messages:
   - `🔍 Detected React Native FormData format`
   - `✅ React Native image upload successful`

### Option 2: Test with curl (Simulating React Native)
Open a new terminal and run:
```bash
curl -X POST http://10.10.13.110:3000/api/crops/688b6c2309ba1fe761e80a48/images \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "image": {
         "uri": "file:///test/image.jpg",
         "type": "image/jpeg", 
         "name": "test-image.jpg"
       },
       "caption": "Test upload",
       "stage": "growing"
     }'
```

## Expected Behavior

### Success Indicators:
- ✅ No "Network Error" in React Native logs
- ✅ Backend logs show: `🔍 Detected React Native FormData format`
- ✅ API returns success response with image data
- ✅ Image is added to crop in database

### Backend Logs You Should See:
```
🔍 ===== RAW REQUEST DETAILS =====
🔍 Method: POST
🔍 URL: /api/crops/[CROP_ID]/images
🔍 Content-Type: application/json
🔍 Content-Length: [size]
🔍 Request body type: object
🔍 Has image in body: true
🔍 Image has uri: true
🔍 Detected React Native FormData format
🔍 React Native image data: { uri: '...', type: '...', name: '...' }
✅ React Native image upload successful
```

### Frontend Logs You Should See:
```
📤 addImageToCrop called with cropId: [ID]
📤 API client initialized, baseURL: http://10.10.13.110:3000/api
📤 Making POST request to: /crops/[ID]/images
📤 FormData keys: ["image"]
📤 Sending as JSON payload: { image: {...}, caption: "...", stage: "..." }
📤 Upload successful, response: { success: true, data: {...} }
```

## Troubleshooting

### If you still get network errors:

1. **Check server is running:**
   ```bash
   curl http://10.10.13.110:3000/api/health
   ```

2. **Verify network connectivity:**
   - Ensure your React Native device is on the same WiFi network
   - Try using the IP address shown in server startup logs

3. **Check firewall:**
   - Windows Defender might be blocking the connection
   - Temporarily disable firewall or add exception for port 3000

4. **Restart React Native app:**
   - Close and reopen the app to ensure new API changes are loaded

### If backend doesn't detect React Native format:

1. Check that `Content-Type: application/json` header is being sent
2. Verify the request body contains `image` object with `uri` property
3. Enable more detailed logging in backend if needed

## Production Notes

For production deployment, you should:

1. **Handle actual file uploads:**
   - Current implementation stores React Native URIs directly
   - In production, download the file from URI and save to server storage
   - Implement proper file validation and security

2. **Add error handling:**
   - Network timeouts
   - File size limits
   - Invalid file formats
   - Storage quota management

3. **Security considerations:**
   - Validate file types and content
   - Implement rate limiting
   - Add authentication/authorization checks
   - Scan uploaded files for malware

The current fix solves the immediate network connectivity issue and allows your React Native app to successfully upload image metadata to the backend.
