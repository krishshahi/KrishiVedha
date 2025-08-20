# Fix Network Connection Issue

Your backend server is running perfectly on http://192.168.1.78:3000/api, but your mobile device can't connect due to Windows Firewall blocking port 3000.

## Quick Fix Options:

### Option 1: Add Firewall Rule (Recommended)
1. Press `Win + R`, type `wf.msc`, press Enter
2. Click "Inbound Rules" on the left panel
3. Click "New Rule..." on the right panel
4. Select "Port" → Next
5. Select "TCP" → "Specific local ports" → Enter "3000" → Next
6. Select "Allow the connection" → Next
7. Check all three profiles (Domain, Private, Public) → Next
8. Name: "Agriculture App Backend" → Finish

### Option 2: Temporary Fix (For Testing Only)
1. Press `Win + R`, type `firewall.cpl`, press Enter
2. Click "Turn Windows Defender Firewall on or off"
3. Temporarily turn off firewall for Private networks
4. Test your app
5. **IMPORTANT: Turn firewall back on after testing!**

### Option 3: Run as Administrator
1. Right-click on PowerShell → "Run as administrator"
2. Run: `netsh advfirewall firewall add rule name="Agriculture App Backend" dir=in action=allow protocol=TCP localport=3000`

## After Fixing Firewall:
1. Restart Expo Go app on your mobile device
2. Scan the QR code again
3. The app should now connect successfully
4. Test the language toggle in Profile screen

## Servers Status:
✅ Backend: Running on http://192.168.1.78:3000/api
✅ Frontend: Running on http://192.168.1.78:8081
✅ Both on same network (192.168.1.78)

The language toggle feature is ready to test once the connection works!
