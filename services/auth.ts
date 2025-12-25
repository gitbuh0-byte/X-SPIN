import { AuthMethod } from '../types.ts';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '';

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_REDIRECT_URI = `${window.location.origin}/auth/facebook/callback`;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  authMethod: AuthMethod;
  phoneNumber?: string;
}

/**
 * Initialize Google OAuth
 * Loads the Google Sign-In library
 */
export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Auth library'));
    document.head.appendChild(script);
  });
};

/**
 * Initialize Facebook SDK
 * Loads the Facebook JavaScript SDK
 */
export const initializeFacebookAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.FB) {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          xfbml: true,
          version: 'v18.0',
        });
        resolve();
      }
    };
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.head.appendChild(script);
  });
};

/**
 * Authenticate with Google
 * Opens Google Sign-In dialog and returns user data
 */
export const authenticateWithGoogle = (): Promise<AuthUser> => {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google authentication unavailable. Please refresh the page and try again.'));
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google setup incomplete. Please contact support.'));
      return;
    }

    try {
      let resolved = false;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (resolved) return;
          resolved = true;

          if (response.credential) {
            try {
              // Decode JWT token to get user info
              const parts = response.credential.split('.');
              if (parts.length !== 3) {
                reject(new Error('Invalid authentication response. Please try again.'));
                return;
              }
              const payload = JSON.parse(atob(parts[1]));
              const authUser: AuthUser = {
                id: payload.sub,
                username: payload.name || payload.email.split('@')[0],
                email: payload.email,
                avatar: payload.picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${payload.email}`,
                authMethod: AuthMethod.GOOGLE,
              };
              resolve(authUser);
            } catch (error) {
              reject(new Error('Failed to process authentication. Please try again.'));
            }
          } else {
            reject(new Error('Authentication cancelled. Please try again.'));
          }
        },
        error_callback: () => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Google sign-in failed. Please check your connection and try again.'));
          }
        },
      });

      // Use One Tap UI
      setTimeout(() => {
        if (!resolved && window.google) {
          window.google.accounts.id.prompt((notification: any) => {
            // Silently fail - user can click button to retry
          });
        }
      }, 100);
    } catch (error) {
      reject(new Error('Unable to initialize Google sign-in. Please try again.'));
    }
  });
};

/**
 * Authenticate with Facebook
 * Opens Facebook Login dialog and returns user data
 */
export const authenticateWithFacebook = (): Promise<AuthUser> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized'));
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          // Get user info
          window.FB.api('/me', { fields: 'id,name,email,picture' }, (userInfo) => {
            if (userInfo.error) {
              reject(new Error(userInfo.error.message));
              return;
            }

            const authUser: AuthUser = {
              id: userInfo.id,
              username: userInfo.name || userInfo.email.split('@')[0],
              email: userInfo.email || '',
              avatar: userInfo.picture?.data?.url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userInfo.email}`,
              authMethod: AuthMethod.FACEBOOK,
            };
            resolve(authUser);
          });
        } else {
          reject(new Error('User cancelled Facebook login'));
        }
      },
      { scope: 'public_profile,email' }
    );
  });
};

/**
 * Authenticate with Apple
 * Opens Apple Sign-In dialog and returns user data
 */
export const authenticateWithApple = (): Promise<AuthUser> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: process.env.REACT_APP_APPLE_CLIENT_ID || '',
          teamId: process.env.REACT_APP_APPLE_TEAM_ID || '',
          keyId: process.env.REACT_APP_APPLE_KEY_ID || '',
          redirectURI: `${window.location.origin}/auth/apple/callback`,
          usePopup: true,
        });

        window.AppleID.auth.signIn().then((authorization: any) => {
          if (authorization && authorization.user) {
            const userInfo = authorization.user;
            const authUser: AuthUser = {
              id: userInfo.email || userInfo.sub,
              username: userInfo.name?.firstName || userInfo.email.split('@')[0],
              email: userInfo.email || '',
              avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userInfo.email}`,
              authMethod: AuthMethod.APPLE,
            };
            resolve(authUser);
          } else {
            reject(new Error('Apple authentication failed'));
          }
        }).catch((error: any) => {
          reject(new Error(error?.message || 'Apple sign-in error'));
        });
      } else {
        reject(new Error('Apple Sign-In not available'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Apple Sign-In library'));
    document.head.appendChild(script);
  });
};

/**
 * Logout from authentication provider
 */
export const logout = (authMethod?: AuthMethod): Promise<void> => {
  return new Promise((resolve) => {
    if (authMethod === AuthMethod.GOOGLE && window.google) {
      window.google.accounts.id.disableAutoSelect();
    } else if (authMethod === AuthMethod.FACEBOOK && window.FB) {
      window.FB.logout(() => {
        resolve();
      });
      return;
    }
    resolve();
  });
};

/**
 * Check if user is already authenticated
 */
export const checkAuthStatus = (authMethod: AuthMethod): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    if (authMethod === AuthMethod.GOOGLE && window.google) {
      // Check for existing Google session
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
      });
      resolve(null);
    } else if (authMethod === AuthMethod.FACEBOOK && window.FB) {
      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          window.FB.api('/me', { fields: 'id,name,email,picture' }, (userInfo) => {
            if (!userInfo.error) {
              const authUser: AuthUser = {
                id: userInfo.id,
                username: userInfo.name || userInfo.email.split('@')[0],
                email: userInfo.email || '',
                avatar: userInfo.picture?.data?.url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userInfo.email}`,
                authMethod: AuthMethod.FACEBOOK,
              };
              resolve(authUser);
              return;
            }
          });
        }
        resolve(null);
      });
    } else {
      resolve(null);
    }
  });
};

// Extend Window interface to include Google, Facebook, and Apple
declare global {
  interface Window {
    google?: any;
    FB?: any;
    AppleID?: any;
    grecaptcha?: any;
  }
}
