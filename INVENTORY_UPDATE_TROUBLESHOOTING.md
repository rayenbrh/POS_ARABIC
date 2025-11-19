# Inventory Stock Update Troubleshooting Guide

## Problem: Stock updates in Inventory page "won't go through"

Follow these steps to identify and fix the issue:

---

## Step 1: Check Browser Console for Errors

1. **Open your browser** and go to the Inventory page
2. **Open Developer Tools**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Firefox: Press `F12`
3. **Click on the "Console" tab**
4. Try to update stock for a product
5. **Look for red error messages**

### Common Errors to Look For:

#### Error 1: Network Error / Failed to Fetch
```
POST http://localhost:3000/api/stock/move 404 (Not Found)
```
**Solution:** Backend is not running. Start it with:
```bash
cd backend
npm run dev
```

#### Error 2: 401 Unauthorized
```
POST http://localhost:3000/api/stock/move 401 (Unauthorized)
```
**Solution:** You're not logged in or token expired. Log out and log back in.

#### Error 3: 403 Forbidden
```
POST http://localhost:3000/api/stock/move 403 (Forbidden)
```
**Solution:** You're not logged in as admin. Log in with an admin account.

#### Error 4: CORS Error
```
Access to XMLHttpRequest at 'http://localhost:5000/api/stock/move' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution:** CORS issue. Check backend CORS configuration.

#### Error 5: 500 Internal Server Error
```
POST http://localhost:3000/api/stock/move 500 (Internal Server Error)
```
**Solution:** Check backend console logs for detailed error.

---

## Step 2: Check Network Tab

1. In Developer Tools, click on the **"Network" tab**
2. Try to update stock again
3. Look for the request to `/api/stock/move`
4. **Click on the request** to see details

### What to Check:

#### Request Headers
Look for `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**If missing:** Token not in localStorage. Log out and log back in.

#### Request Payload
Should look like:
```json
{
  "productId": "6578abc123...",
  "type": "in",
  "qtyChangeBaseUnit": 5000,
  "reason": "إضافة مخزون جديد"
}
```

#### Response
- **Status 200/201**: Success! But modal might not be closing (UI issue)
- **Status 401**: Not authenticated
- **Status 403**: Not authorized (not admin)
- **Status 404**: Route not found (backend not running or wrong URL)
- **Status 500**: Server error (check backend logs)

---

## Step 3: Check Backend Logs

1. **Open terminal** where backend is running
2. Look for error messages when you try to update stock
3. Common errors:

### MongoDB Transaction Error
```
MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
```
**Solution:** Your MongoDB is standalone (not replica set). Need to modify code to not use transactions in development.

### Database Connection Error
```
MongooseError: Cannot read properties of undefined
```
**Solution:** Check `.env` file has correct `MONGODB_URI`

### Validation Error
```
ValidationError: Product validation failed
```
**Solution:** Check the data being sent matches the Product schema

---

## Step 4: Test Directly with cURL

Run this command to test the API directly:

```bash
# Replace YOUR_TOKEN with your actual JWT token from localStorage
curl -X POST http://localhost:5000/api/stock/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "type": "in",
    "qtyChangeBaseUnit": 1000,
    "reason": "test"
  }'
```

### How to get your token:
1. Open browser console
2. Type: `localStorage.getItem('token')`
3. Copy the token (without quotes)

### How to get a product ID:
1. Open browser console
2. Type: `localStorage.getItem('user')`
3. Or check Network tab in a previous request

---

## Step 5: Common Solutions

### Solution A: Backend Not Running
```bash
cd backend
npm run dev
```

### Solution B: Clear Cache and Reload
```bash
# In browser:
# 1. Press Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac)
# 2. Clear cache
# 3. Or just hard reload: Ctrl+Shift+R or Cmd+Shift+R
```

### Solution C: Check You're Admin
```bash
# In browser console:
const user = JSON.parse(localStorage.getItem('user'));
console.log(user.role);
# Should output: "admin"
```

### Solution D: Re-login
```bash
# Sometimes token gets corrupted
# 1. Log out
# 2. Log back in with admin credentials
# 3. Try again
```

---

## What to Tell Me

After checking the above, tell me:

1. **What error appears in the browser console?**
2. **What is the HTTP status code in Network tab?**
3. **What error appears in backend terminal?**
4. **Are you logged in as admin?** (check with: `JSON.parse(localStorage.getItem('user')).role`)
5. **Is backend running?** (you should see "🚀 الخادم يعمل على المنفذ 5000")

With this information, I can give you the exact fix!
