import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager.ts';
import { AuthMethod } from '../types.ts';
import { 
  authenticateWithGoogle, 
  authenticateWithFacebook, 
  authenticateWithApple,
  initializeGoogleAuth, 
  initializeFacebookAuth,
  AuthUser 
} from '../services/auth.ts';

interface AuthProps {
  onLogin: (username: string, email: string, phoneNumber?: string, authMethod?: AuthMethod) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });

  const [authMethod, setAuthMethod] = useState<AuthMethod>(AuthMethod.EMAIL);

  // Initialize OAuth providers on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initializeGoogleAuth();
        await initializeFacebookAuth();
      } catch (err) {
        console.error('Failed to initialize auth providers:', err);
      }
    };
    initializeAuth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    
    if (isRegister) {
      if (!formData.username || !formData.confirmPassword || formData.password !== formData.confirmPassword || !formData.phoneNumber) {
        setError('Please fill all fields and ensure passwords match');
        return;
      }
    }

    soundManager.play('start');
    setError(null);
    onLogin(
      formData.username || 'Player',
      formData.email,
      formData.phoneNumber || undefined,
      AuthMethod.EMAIL
    );
  };

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
      } else if (method === AuthMethod.APPLE) {
        authUser = await authenticateWithApple();
      } else {
        setError('Unsupported authentication method');
        setIsLoading(false);
        return;
      }

      soundManager.play('win');
      onLogin(authUser.username, authUser.email, authUser.phoneNumber, authUser.authMethod);
    } catch (err) {
      soundManager.play('error');
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vegas-bg relative overflow-hidden p-3 sm:p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      <div className="absolute top-4 sm:top-10 left-4 sm:left-10 w-32 sm:w-48 h-1 bg-neon-cyan/20 rotate-45 pointer-events-none"></div>
      <div className="absolute bottom-4 sm:bottom-10 right-4 sm:right-10 w-32 sm:w-48 h-1 bg-neon-pink/20 rotate-45 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 sm:mb-12 text-center group">
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-arcade font-black text-white tracking-tighter transition-all animate-glitch">
            X <span className="text-neon-pink text-glow-pink">PIN</span>
          </h1>
          <div className="h-0.5 w-40 sm:w-64 bg-neon-cyan mx-auto mt-2 sm:mt-4 animate-pulse"></div>
          <p className="mt-2 sm:mt-4 text-neon-cyan font-arcade text-[8px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.6em] uppercase opacity-70">NEURAL ACCESS PROTOCOL</p>
        </div>

        <div className="bg-vegas-panel/90 backdrop-blur-xl border-2 sm:border-4 border-neon-cyan/40 retro-card p-4 sm:p-8 md:p-10 lg:p-14 shadow-[0_0_80px_rgba(255,255,255,0.15)] relative">
          <div className="absolute top-0 right-4 sm:right-10 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-neon-cyan/20 border-x border-b border-neon-cyan/40 text-[7px] sm:text-[8px] font-arcade text-neon-cyan pointer-events-none">ENCRYPTED_LINK_04</div>
          
          <h2 className="text-lg sm:text-2xl font-arcade text-white mb-4 sm:mb-6 text-center tracking-widest uppercase border-b border-neon-cyan/10 pb-4 sm:pb-6">
            {isRegister ? 'IDENTITY_REG' : 'ID_CHECK'}
          </h2>

          {error && (
            <div className="bg-neon-pink/10 border-2 border-neon-pink rounded p-2 sm:p-3 mb-4 text-neon-pink text-[7px] sm:text-[9px] font-arcade uppercase tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {isRegister && (
              <>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[7px] sm:text-[9px] text-neon-pink uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Neural_Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={(e) => setFormData(p => ({...p, username: e.target.value}))}
                    className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest uppercase" 
                    placeholder="PLAYER_01" 
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[7px] sm:text-[9px] text-neon-green uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Phone_Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(p => ({...p, phoneNumber: e.target.value}))}
                    className="w-full bg-black border-2 border-neon-green/20 p-2 sm:p-3 text-white font-mono focus:border-neon-green focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest" 
                    placeholder="+1 (555) 000-0000" 
                  />

                </div>
              </>
            )}
            
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[7px] sm:text-[9px] text-neon-pink uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Email_Address</label>
              <input 
                type="email" 
                required
                autoFocus={!isRegister}
                value={formData.email}
                onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest lowercase" 
                placeholder="player@example.com" 
              />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[7px] sm:text-[9px] text-neon-pink uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Enter_Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData(p => ({...p, password: e.target.value}))}
                className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest" 
                placeholder="••••••••" 
              />
            </div>

            {isRegister && (
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[7px] sm:text-[9px] text-neon-pink uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Confirm_Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(p => ({...p, confirmPassword: e.target.value}))}
                  className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest" 
                  placeholder="••••••••" 
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-neon-cyan text-black font-arcade py-2 sm:py-3 md:py-4 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-base md:text-lg font-black transition-all hover:bg-white hover:shadow-[0_0_50px_rgba(0,255,255,1)] active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">{isLoading ? 'AUTHENTICATING...' : 'START GAME'}</span>
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 pointer-events-none"></div>
            </button>
          </form>

          {/* Social Auth Section */}
          <div className="mt-4 sm:mt-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex-1 h-px bg-neon-cyan/20"></div>
              <span className="text-[6px] sm:text-[8px] text-slate-500 font-arcade uppercase tracking-[0.2em]">Or Connect Via</span>
              <div className="flex-1 h-px bg-neon-cyan/20"></div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleSocialAuth(AuthMethod.GOOGLE)}
                disabled={isLoading}
                className="bg-white text-black py-1.5 sm:py-2 rounded transition-all hover:bg-neon-pink hover:text-white hover:shadow-[0_0_20px_rgba(255,0,128,0.5)] font-arcade font-bold text-[7px] sm:text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Google'}
              </button>
              <button
                type="button"
                onClick={() => handleSocialAuth(AuthMethod.FACEBOOK)}
                disabled={isLoading}
                className="bg-blue-600 text-white py-1.5 sm:py-2 rounded transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,89,152,0.5)] font-arcade font-bold text-[7px] sm:text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Facebook'}
              </button>
              <button
                type="button"
                onClick={() => handleSocialAuth(AuthMethod.APPLE)}
                disabled={isLoading}
                className="bg-black text-white border-2 border-white py-1.5 sm:py-2 rounded transition-all hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] font-arcade font-bold text-[7px] sm:text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apple
              </button>
            </div>
          </div>

          {/* Auth Method Toggle */}
          <div className="mt-6 sm:mt-8 text-center">
            <button 
              type="button"
              onClick={() => { setIsRegister(!isRegister); soundManager.play('click'); }}
              className="text-[7px] sm:text-[11px] text-slate-500 font-arcade hover:text-white transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] border-b border-transparent hover:border-white"
            >
              {isRegister ? '[ BACK_TO_AUTH ]' : 'new to x pin ?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
