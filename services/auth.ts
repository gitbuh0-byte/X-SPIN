import { AuthMethod } from '../types.ts';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';

// Firebase Configuration
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Google OAuth (for fallback if Firebase not available)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  authMethod: AuthMethod;
  phoneNumber?: string;
}

// Firebase app and auth instances
let firebaseApp: any = null;
let firebaseAuth: Auth | null = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase using the npm package
 */
export const initializeFirebase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (firebaseInitialized && firebaseAuth) {
      console.log('✓ Firebase already initialized');
      resolve();
      return;
    }

    if (!FIREBASE_CONFIG.apiKey) {
      console.warn('⚠ Firebase API Key not configured in .env');
      reject(new Error('Firebase API Key not configured'));
      return;
    }

    try {
      console.log('Initializing Firebase with project:', FIREBASE_CONFIG.projectId);
      
      // Initialize Firebase app
      firebaseApp = initializeApp(FIREBASE_CONFIG);
      
      // Initialize Auth
      firebaseAuth = getAuth(firebaseApp);
      
      // Set persistence
      setPersistence(firebaseAuth, browserLocalPersistence)
        .then(() => {
          firebaseInitialized = true;
          console.log('✓ Firebase initialized successfully');
          resolve();
        })
        .catch((error) => {
          console.error('Firebase persistence error:', error);
          firebaseInitialized = true; // Still consider it initialized even if persistence fails
          resolve();
        });
    } catch (error: any) {
      console.error('Firebase initialization error:', error);
      if (error.code !== 'app/duplicate-app') {
        reject(error);
      } else {
        console.log('✓ Firebase app already initialized');
        firebaseInitialized = true;
        resolve();
      }
    }
  });
};

/**
 * Initialize Google OAuth
 * Loads the Google Sign-In library
 */
export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      console.log('✓ Google auth already loaded');
      resolve();
      return;
    }

    console.log('Loading Google Sign-In library...');
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✓ Google Sign-In script loaded');
      // Wait a bit for Google to be fully initialized
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          console.log('✓ window.google.accounts.id available');
          resolve();
        } else {
          reject(new Error('Google accounts API not available after script load'));
        }
      }, 100);
    };
    script.onerror = () => {
      console.error('✗ Failed to load Google Sign-In script');
      reject(new Error('Failed to load Google auth library'));
    };
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
 * Authenticate with Google using Firebase
 */
export const authenticateWithGoogleFirebase = (): Promise<AuthUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting Firebase Google authentication...');
      
      if (!firebaseInitialized || !firebaseAuth) {
        console.log('Firebase not initialized, initializing now...');
        await initializeFirebase();
      }

      if (!firebaseAuth) {
        console.error('Firebase auth not available after initialization');
        reject(new Error('Firebase not initialized. Please try again.'));
        return;
      }

      const provider = new GoogleAuthProvider();
      
      console.log('Showing Firebase Google Sign-In popup...');
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      
      console.log('✓ Firebase Google auth successful, user:', user.email);
      const authUser: AuthUser = {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Player',
        email: user.email || '',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email}`,
        authMethod: AuthMethod.GOOGLE,
      };
      resolve(authUser);
    } catch (error: any) {
      console.error('Firebase Google auth error:', error.code, error.message);
      if (error.code === 'auth/popup-closed-by-user') {
        reject(new Error('Sign-in cancelled. Please try again.'));
      } else if (error.code === 'auth/popup-blocked') {
        reject(new Error('Sign-in popup was blocked. Please enable popups and try again.'));
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        console.log('Firebase popup not supported in this environment');
        reject(new Error('Please try again or use a different sign-in method.'));
      } else {
        reject(new Error(error.message || 'Google sign-in failed. Please check your connection.'));
      }
    }
  });
};

/**
 * Get current Firebase authenticated user
 */
export const getCurrentFirebaseUser = (): Promise<AuthUser | null> => {
  return new Promise(async (resolve) => {
    try {
      if (!firebaseInitialized || !firebaseAuth) {
        await initializeFirebase();
      }

      if (!firebaseAuth) {
        resolve(null);
        return;
      }

      onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          const authUser: AuthUser = {
            id: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'Player',
            email: user.email || '',
            avatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email}`,
            authMethod: AuthMethod.GOOGLE,
          };
          resolve(authUser);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error getting current Firebase user:', error);
      resolve(null);
    }
  });
};

/**
 * Logout from Firebase
 */
export const logoutFirebase = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!firebaseInitialized || !firebaseAuth) {
        resolve();
        return;
      }

      await signOut(firebaseAuth);
      console.log('✓ Logged out from Firebase');
      resolve();
    } catch (error: any) {
      console.error('Logout error:', error);
      reject(new Error(error.message || 'Logout failed'));
    }
  });
};

/**
 * Check if user is authenticated with Firebase
 */
export const isFirebaseAuthenticated = async (): Promise<boolean> => {
  try {
    if (!firebaseInitialized || !firebaseAuth) {
      await initializeFirebase();
    }

    if (!firebaseAuth) {
      return false;
    }

    return firebaseAuth.currentUser !== null;
  } catch (error) {
    console.error('Error checking Firebase auth status:', error);
    return false;
  }
};

/**
 * Get Firebase auth token (for API calls)
 */
export const getFirebaseToken = async (): Promise<string | null> => {
  try {
    if (!firebaseInitialized || !firebaseAuth) {
      await initializeFirebase();
    }

    if (!firebaseAuth || !firebaseAuth.currentUser) {
      return null;
    }

    return await firebaseAuth.currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
};

/**
 * Authenticate with Google (Fallback non-Firebase version)
 */
export const authenticateWithGoogle = (): Promise<AuthUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure Google is loaded
      if (!window.google?.accounts?.id) {
        console.log('Google not ready, initializing...');
        try {
          await initializeGoogleAuth();
        } catch (err) {
          console.error('Failed to initialize Google:', err);
          reject(new Error('Google authentication library failed to load. Please refresh and try again.'));
          return;
        }
      }

      if (!window.google?.accounts?.id) {
        reject(new Error('Google authentication unavailable. Please refresh the page and try again.'));
        return;
      }

      // Note: Firebase handles Google auth, so we don't need separate Google Client ID
      console.log('Using Firebase for Google authentication');

      let resolved = false;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: (response: any) => {
          if (resolved) return;
          resolved = true;

          if (response.credential) {
            try {
              console.log('✓ Google authentication successful');
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
              console.error('Failed to decode credential:', error);
              reject(new Error('Failed to process authentication. Please try again.'));
            }
          } else {
            reject(new Error('Authentication cancelled. Please try again.'));
          }
        },
        error_callback: () => {
          if (!resolved) {
            resolved = true;
            console.error('Google One Tap error');
            reject(new Error('Google sign-in failed. Please check your connection and try again.'));
          }
        },
      });

      console.log('Showing Google One Tap UI...');
      setTimeout(() => {
        if (!resolved && window.google?.accounts?.id) {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.log('One Tap not displayed');
            }
          });
        }
      }, 100);
    } catch (error: any) {
      console.error('Google auth error:', error);
      reject(new Error(error.message || 'Unable to initialize Google sign-in. Please try again.'));
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
          clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
          teamId: import.meta.env.VITE_APPLE_TEAM_ID || '',
          keyId: import.meta.env.VITE_APPLE_KEY_ID || '',
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

// Extend Window interface to include Google, Facebook, Apple, and Firebase
declare global {
  interface Window {
    google?: any;
    FB?: any;
    AppleID?: any;
    grecaptcha?: any;
    firebase?: any;
  }
}
