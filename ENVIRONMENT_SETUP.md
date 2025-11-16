# Environment Configuration Guide

This document explains how to properly configure the POS_ARABIC application for different environments.

## Overview

The application uses environment variables to configure different settings for development and production environments. This ensures that you can safely develop locally while keeping production configurations separate.

## Backend Configuration

### 1. Create `.env` file

Navigate to the `backend` directory and create a `.env` file based on `.env.example`:

```bash
cd backend
cp .env.example .env
```

### 2. Configure Backend Environment Variables

Edit the `.env` file with your actual values:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE

# JWT Configuration
# Generate a strong random secret key:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret_key_here
JWT_EXPIRE=7d

# Environment
NODE_ENV=development
```

#### MongoDB Setup

1. **Create a MongoDB Atlas Account** (if you don't have one):
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your database user credentials
   - Replace `<database>` with your database name (e.g., `pos_arabic`)

3. **Security Best Practices**:
   - Never commit your `.env` file to version control
   - Use strong, unique passwords for database users
   - Whitelist specific IP addresses in MongoDB Atlas (don't use 0.0.0.0/0 in production)

#### JWT Secret

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` value.

## Frontend Configuration

### Development Environment

The development environment is pre-configured in `frontend/.env.development`:

```env
VITE_API_URL=http://localhost:5000
```

This points to your local backend server running on port 5000.

### Production Environment

For production deployment (e.g., Netlify):

1. **Create `.env.production` file**:

```bash
cd frontend
cp .env.production.example .env.production
```

2. **Update with your production API URL**:

```env
VITE_API_URL=https://your-backend-api.com
```

**Note**: Replace `https://your-backend-api.com` with your actual backend API URL.

### Netlify Configuration

If deploying to Netlify, you also need to update `frontend/netlify.toml`:

1. Open `frontend/netlify.toml`
2. Update the API redirect URL (line 23):

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/api"  # Update this!
  status = 200
  force = true
```

Alternatively, you can set environment variables in the Netlify dashboard:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add `VITE_API_URL` with your production backend URL

## Running the Application

### Development

1. **Start Backend**:
```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

2. **Start Frontend** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API requests to the backend.

### Production

#### Backend Deployment

1. Set environment variables on your hosting platform (e.g., EasyPanel, Heroku, Railway):
   - `PORT=5000`
   - `MONGODB_URI=your_production_mongodb_uri`
   - `JWT_SECRET=your_production_jwt_secret`
   - `NODE_ENV=production`

2. Deploy your backend code

#### Frontend Deployment (Netlify)

1. Update `frontend/netlify.toml` with your production backend URL
2. Push your code to GitHub
3. Connect your repository to Netlify
4. Netlify will automatically build and deploy

## Environment Variables Reference

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Server port | `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens | `random_64_byte_hex_string` |
| `JWT_EXPIRE` | Yes | JWT token expiration time | `7d` |
| `NODE_ENV` | Yes | Environment mode | `development` or `production` |

### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `http://localhost:5000` (dev) or `https://api.example.com` (prod) |

## Troubleshooting

### API Connection Issues

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Check that backend is running
2. Verify `VITE_API_URL` matches your backend URL
3. Check browser console for CORS errors
4. Ensure backend CORS settings allow your frontend domain

### Database Connection Issues

**Problem**: Backend can't connect to MongoDB

**Solutions**:
1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas IP whitelist
3. Ensure database user has correct permissions
4. Test connection string with MongoDB Compass

### Authentication Issues

**Problem**: Login fails or tokens expire immediately

**Solutions**:
1. Verify `JWT_SECRET` is set and not empty
2. Check `JWT_EXPIRE` format (e.g., `7d`, `24h`, `60m`)
3. Clear browser localStorage and try again

## Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] Production `JWT_SECRET` is different from development
- [ ] MongoDB password is strong and unique
- [ ] MongoDB Atlas IP whitelist is configured (not 0.0.0.0/0 in production)
- [ ] HTTPS is enabled in production
- [ ] Environment variables are set in hosting platform (not in code)

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [MongoDB Atlas Setup Guide](https://docs.atlas.mongodb.com/getting-started/)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
