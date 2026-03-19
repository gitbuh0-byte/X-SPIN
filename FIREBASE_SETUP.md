# Firebase Setup Guide for X-PIN

This guide explains how to set up Google Firebase Authentication for the X-PIN application.

## Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Node.js and npm installed
- Access to your Google Cloud project

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project" or select an existing one
3. Name your project (e.g., "X-PIN")
4. Accept Firebase terms and create the project

## Step 2: Enable Google Sign-In

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** and enable it
3. Set up the project support email
4. Save the changes

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project settings** (click the gear icon)
2. Under "Your apps", click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "X-PIN Web")
4. You'll see a configuration object with these keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## Step 4: Get Google OAuth Credentials

### Alternative Method (Using Firebase's Google Provider):
When using Firebase with Google Sign-In, you don't need a separate Google OAuth Client ID for the popup method. Firebase handles this automatically.

### If You Need Google Client ID for Web:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - `http://localhost:3000` (if using different port)
   - `https://yourdomain.com` (for production)
7. Copy your **Client ID**

## Step 5: Update Environment Variables

Create or update your `.env` file in the project root:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Google OAuth (Optional - for standard Google auth fallback)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Facebook OAuth (Optional)
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## Step 6: Add Authorized Redirect URIs (Firebase)

1. In Firebase Console, go to **Authentication** → **Settings**
2. Under "Authorized domains", click "Add domain"
3. Add your production domain(s):
   - For development: `localhost`
   - For production: your domain (e.g., `xpin-game.com`)

## Step 7: Test the Setup

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click the "Google" button
4. You should see the Firebase Google Sign-In popup
5. Complete the sign-in process

## Troubleshooting

### Error: "Firebase SDK not loaded"
- Ensure Firebase environment variables are not empty
- Check that the Firebase SDK is loading correctly (check browser console)

### Error: "Popup closed by user"
- This is normal if the user closes the sign-in popup

### Error: "auth/popup-blocked"
- The browser is blocking popups
- Make sure popups are allowed for localhost in development

### Promise rejection errors
- Check development console for specific Firebase error codes
- Verify your Firebase project configuration

## Security Notes

1. **Never** commit your Firebase credentials to version control
2. Use Firebase Security Rules to protect your data
3. In production, use Firebase's built-in security features
4. Enable reCAPTCHA in Firebase Authentication settings for production

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

## Implementation Notes

The application uses Firebase with two fallback options:

1. **Primary**: Firebase Google Sign-In (recommended)
2. **Fallback**: Standard Google OAuth if Firebase fails
3. **Other methods**: Facebook and Apple OAuth (if configured)

Firebase provides automatic session management, persistent authentication, and enhanced security features compared to standard OAuth implementations.
