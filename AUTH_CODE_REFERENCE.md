# Authentication Code Reference

## Quick Code Snippets

### Using Google Authentication

```typescript
import { authenticateWithGoogle, AuthUser } from '../services/auth.ts';

// In your component
const handleGoogleLogin = async () => {
  try {
    const user: AuthUser = await authenticateWithGoogle();
    console.log('Google user:', user);
    // User object contains:
    // {
    //   id: "google_user_id",
    //   username: "John Doe",
    //   email: "john@gmail.com",
    //   avatar: "https://...",
    //   authMethod: AuthMethod.GOOGLE
    // }
  } catch (error) {
    console.error('Google auth failed:', error.message);
  }
};
```

### Using Facebook Authentication

```typescript
import { authenticateWithFacebook, AuthUser } from '../services/auth.ts';

// In your component
const handleFacebookLogin = async () => {
  try {
    const user: AuthUser = await authenticateWithFacebook();
    console.log('Facebook user:', user);
    // User object contains:
    // {
    //   id: "facebook_user_id",
    //   username: "Jane Smith",
    //   email: "jane@facebook.com",
    //   avatar: "https://...",
    //   authMethod: AuthMethod.FACEBOOK
    // }
  } catch (error) {
    console.error('Facebook auth failed:', error.message);
  }
};
```

### OAuth Initialization

```typescript
import { initializeGoogleAuth, initializeFacebookAuth } from '../services/auth.ts';

// In useEffect or component mount
useEffect(() => {
  const initializeAuth = async () => {
    try {
      await initializeGoogleAuth();      // Loads Google Sign-In library
      await initializeFacebookAuth();    // Loads Facebook SDK
    } catch (error) {
      console.error('Failed to initialize OAuth:', error);
    }
  };
  initializeAuth();
}, []);
```

### Logout

```typescript
import { logout } from '../services/auth.ts';
import { AuthMethod } from '../types.ts';

// Logout from Google
await logout(AuthMethod.GOOGLE);

// Logout from Facebook
await logout(AuthMethod.FACEBOOK);

// Generic logout
await logout();
```

### Check Auth Status

```typescript
import { checkAuthStatus } from '../services/auth.ts';
import { AuthMethod } from '../types.ts';

// Check if user has existing Google session
const googleUser = await checkAuthStatus(AuthMethod.GOOGLE);

// Check if user has existing Facebook session
const facebookUser = await checkAuthStatus(AuthMethod.FACEBOOK);
```

## Environment Variables

### .env.local Template

```bash
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# Facebook OAuth
REACT_APP_FACEBOOK_APP_ID=your_app_id
```

### How to Get Credentials

**Google Client ID:**
1. Visit https://console.cloud.google.com
2. Create or select a project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Select "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Your production domain
7. Copy the Client ID

**Facebook App ID:**
1. Visit https://developers.facebook.com
2. Go to "My Apps" > Create app (or select existing)
3. Add product "Facebook Login"
4. Go to "Settings" > "Basic"
5. Copy the App ID
6. Configure OAuth redirect URIs in Facebook Login settings

## Auth Component Implementation

### Full Auth.tsx Example

```typescript
import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager.ts';
import { AuthMethod } from '../types.ts';
import { 
  authenticateWithGoogle, 
  authenticateWithFacebook, 
  initializeGoogleAuth, 
  initializeFacebookAuth,
  AuthUser 
} from '../services/auth.ts';

interface AuthProps {
  onLogin: (username: string, email: string, phoneNumber?: string, authMethod?: AuthMethod) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize OAuth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initializeGoogleAuth();
        await initializeFacebookAuth();
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      }
    };
    initializeAuth();
  }, []);

  // Handle social authentication
  const handleSocialAuth = async (method: AuthMethod) => {
    soundManager.play('click');
    setIsLoading(true);
    setError(null);

    try {
      let authUser: AuthUser;

      if (method === AuthMethod.GOOGLE) {
        authUser = await authenticateWithGoogle();
      } else if (method === AuthMethod.FACEBOOK) {
        authUser = await authenticateWithFacebook();
      } else {
        setError('Apple authentication coming soon');
        setIsLoading(false);
        return;
      }

      // Success
      soundManager.play('win');
      onLogin(authUser.username, authUser.email, authUser.phoneNumber, authUser.authMethod);
    } catch (err) {
      // Error
      soundManager.play('error');
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Social Auth Buttons */}
      <div className="social-buttons">
        <button
          onClick={() => handleSocialAuth(AuthMethod.GOOGLE)}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Google'}
        </button>
        <button
          onClick={() => handleSocialAuth(AuthMethod.FACEBOOK)}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Facebook'}
        </button>
        <button
          onClick={() => handleSocialAuth(AuthMethod.APPLE)}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Apple'}
        </button>
      </div>
    </div>
  );
};
```

## auth.ts Service Module

### Key Functions

```typescript
// Initialize Google Sign-In library
export const initializeGoogleAuth = (): Promise<void>

// Initialize Facebook SDK
export const initializeFacebookAuth = (): Promise<void>

// Authenticate with Google
export const authenticateWithGoogle = (): Promise<AuthUser>

// Authenticate with Facebook
export const authenticateWithFacebook = (): Promise<AuthUser>

// Logout from OAuth provider
export const logout = (authMethod?: AuthMethod): Promise<void>

// Check existing auth session
export const checkAuthStatus = (authMethod: AuthMethod): Promise<AuthUser | null>
```

## Common Errors & Solutions

### "Google Auth not initialized"
```
Issue: authenticateWithGoogle() called before initializeGoogleAuth()
Solution: Ensure initializeGoogleAuth() is called in useEffect on component mount
```

### "Failed to load Google Auth library"
```
Issue: CORS error or CDN not accessible
Solution: Check internet connection and Google's CDN status
```

### "No credential received from Google"
```
Issue: User cancelled login or popup blocked
Solution: Check browser's popup blocker, retry authentication
```

### "Facebook SDK not initialized"
```
Issue: initializeFacebookAuth() not called or failed
Solution: Verify Facebook App ID in .env.local is correct
```

### "User cancelled Facebook login"
```
Issue: User closed the Facebook login dialog
Solution: This is expected, catch and handle gracefully
```

## Testing Guide

### Test Email Authentication
```
1. Open Auth component
2. Fill in email field: test@example.com
3. Fill in password: test123456
4. Click START GAME
5. Sound should play (win sound)
6. onLogin callback should fire
```

### Test Google Authentication
```
1. Click Google button
2. Wait for Google Sign-In to load
3. Enter Google account credentials
4. Accept permissions
5. Sound should play (win sound)
6. AuthUser should be logged
7. onLogin callback should fire with Google user data
```

### Test Facebook Authentication
```
1. Click Facebook button
2. Facebook login dialog opens
3. Enter Facebook credentials
4. Accept permissions
5. Dialog closes
6. Sound should play (win sound)
7. AuthUser should be logged
8. onLogin callback should fire with Facebook user data
```

### Test Error Handling
```
1. Unplug internet / go offline
2. Click Google button
3. Error message should display
4. Error sound should play
5. Loading state should clear
6. Button should be re-enabled
```

## TypeScript Types

```typescript
// Authentication method
export enum AuthMethod {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE'
}

// Authenticated user
export interface AuthUser {
  id: string;                    // Provider's unique ID
  username: string;              // User's display name
  email: string;                 // User's email
  avatar: string;                // Profile picture URL
  authMethod: AuthMethod;        // How they authenticated
  phoneNumber?: string;          // Optional phone number
}

// Auth component props
interface AuthProps {
  onLogin: (
    username: string,
    email: string,
    phoneNumber?: string,
    authMethod?: AuthMethod
  ) => void;
}
```

## Styling Classes (Tailwind)

```jsx
// Google Button
className="bg-white text-black py-1.5 sm:py-2 rounded hover:bg-neon-pink hover:text-white"

// Facebook Button
className="bg-blue-600 text-white py-1.5 sm:py-2 rounded hover:bg-blue-500"

// Apple Button
className="bg-black text-white py-1.5 sm:py-2 rounded hover:bg-white hover:text-black"

// Loading State
disabled={isLoading}
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Error Message
className="bg-neon-pink/10 border-2 border-neon-pink rounded p-2 text-neon-pink"
```

## Debugging Tips

### Check OAuth Library Loading
```javascript
// In browser console
console.log('Google loaded:', typeof window.google !== 'undefined');
console.log('Facebook loaded:', typeof window.FB !== 'undefined');
```

### Check Environment Variables
```javascript
// In browser console
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
console.log('Facebook App ID:', process.env.REACT_APP_FACEBOOK_APP_ID);
```

### Check Auth State
```javascript
// In browser console during auth
console.log('Loading:', isLoading);
console.log('Error:', error);
console.log('Auth Method:', authMethod);
```

### Check Returned User Object
```javascript
// In handleSocialAuth catch/finally
console.log('AuthUser:', {
  id: authUser.id,
  username: authUser.username,
  email: authUser.email,
  avatar: authUser.avatar,
  authMethod: authUser.authMethod
});
```

## Production Checklist

- [ ] Google Client ID added to `.env.local`
- [ ] Facebook App ID added to `.env.local`
- [ ] OAuth redirect URIs configured in both providers
- [ ] Both OAuth buttons tested successfully
- [ ] Error handling tested with network errors
- [ ] Loading states verified
- [ ] Sound effects working
- [ ] Mobile layout verified
- [ ] No console errors
- [ ] Ready for production deployment

