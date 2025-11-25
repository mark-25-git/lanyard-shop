# Admin Authentication Setup Guide

## Overview
The admin panel now uses Supabase Authentication for secure login. This replaces the simple password-based authentication with a proper JWT-based system.

## Setup Steps

### 1. Create Admin User in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Invite User"**
4. Fill in:
   - **Email**: Your admin email (e.g., `admin@teevent.my`)
   - **Password**: A strong password
   - **Auto Confirm User**: ✅ Check this (skip email verification for admin)
5. Click **"Create User"**

### 2. Configure Environment Variable

Add to your `.env.local`:

```env
NEXT_PUBLIC_ADMIN_EMAIL=admin@teevent.my
```

Replace `admin@teevent.my` with the email you used when creating the admin user in Supabase.

### 3. Test Login

1. Go to `/admin/login`
2. Enter your admin email and password
3. You should be redirected to `/admin/dashboard` upon successful login

## How It Works

### Authentication Flow

1. **Login Page** (`/admin/login`):
   - User enters email and password
   - Frontend calls `supabase.auth.signInWithPassword()`
   - Supabase verifies credentials and returns a session (JWT token)
   - Session is stored in browser (cookies/localStorage)
   - User is redirected to dashboard

2. **Middleware** (`middleware.ts`):
   - Checks if route is `/admin/*`
   - Verifies session cookie exists
   - Redirects to login if no session

3. **Admin Pages** (e.g., `/admin/dashboard`):
   - Client-side checks Supabase session
   - Verifies user email matches `NEXT_PUBLIC_ADMIN_EMAIL`
   - Redirects to login if not authenticated

4. **API Routes** (e.g., `/api/admin/orders`):
   - Server-side verifies authentication using `requireAdmin()`
   - Checks Authorization header or cookies for access token
   - Returns 401 if not authenticated

### Security Features

- ✅ **Password Hashing**: Supabase automatically hashes passwords (bcrypt)
- ✅ **JWT Tokens**: Secure session tokens with expiration
- ✅ **Email Verification**: Admin email must match configured email
- ✅ **Session Management**: Automatic token refresh
- ✅ **Server-Side Validation**: API routes verify authentication

## Adding More Admins

To add additional admin users:

1. Create new user in Supabase Authentication
2. Update `NEXT_PUBLIC_ADMIN_EMAIL` to allow multiple emails, OR
3. Use user metadata to mark users as admin (future enhancement)

## Logout

Users can logout by clicking the "Logout" button, which:
- Calls `supabase.auth.signOut()`
- Clears session
- Redirects to login page

## Troubleshooting

### "Access denied. Admin access only."
- Check that `NEXT_PUBLIC_ADMIN_EMAIL` matches the email in Supabase
- Verify the user exists in Supabase Authentication

### "Invalid email or password"
- Verify credentials in Supabase Dashboard
- Check that user is confirmed (Auto Confirm should be enabled)

### Session not persisting
- Check browser cookies are enabled
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

## Migration from Old System

The old password-based system has been replaced. If you had:
- `ADMIN_PASSWORD` in `.env.local` → **Remove it** (no longer needed)
- `sessionStorage.getItem('adminAuthenticated')` → **Replaced with Supabase Auth**




