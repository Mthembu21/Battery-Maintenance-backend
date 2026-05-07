# Render Deployment Guide

## Backend Environment Variables
Set these in your Render backend service:

```
PORT=4000
MONGODB_URI=mongodb+srv://tembesabelo7_db_user:Jtt3o0bfn1qV9Q38@battery.cvo4fnf.mongodb.net/battery?retryWrites=true&w=majority&appName=Battery&tls=true&tlsAllowInvalidCertificates=true
JWT_SECRET=change_me_now
CORS_ORIGIN=*
PUBLIC_BASE_URL=https://your-backend-url.onrender.com
```

## Frontend Environment Variables
Set these in your Render frontend service:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Important Notes

1. **Replace `your-backend-url.onrender.com`** with your actual backend URL from Render
2. **CORS_ORIGIN=*` allows all origins - you may want to restrict this to your frontend URL
3. **PUBLIC_BASE_URL** should point to your backend URL for file uploads
4. **VITE_API_URL** tells the frontend where to make API calls in production

## Troubleshooting 404 Errors

If you're getting 404 errors:

1. Check that backend is running and accessible
2. Verify environment variables are set correctly
3. Ensure frontend is pointing to correct backend URL
4. Check browser network tab for actual API endpoints being called

## Testing Endpoints

- **Signup**: POST `/api/auth/signup`
- **Login**: POST `/api/auth/login` 
- **Get Batteries**: GET `/api/batteries` (requires auth)
- **Submit Maintenance**: POST `/api/maintenance` (requires auth, multipart/form-data)

## Technician Account Creation

Technicians can create accounts through the signup page at `/signup`. The system automatically assigns them the "Technician" role.
