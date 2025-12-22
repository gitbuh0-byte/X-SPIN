import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { User, Transaction, UserRank, GameSession } from './types.ts';
import Dashboard from './pages/Dashboard.tsx';
import GameRoom from './pages/GameRoom.tsx';
import Home from './pages/Home.tsx';
import PaymentModal from './components/PaymentModal.tsx';
import GameDock from './components/GameDock.tsx';
import { soundManager } from './services/soundManager.ts';
import { RANK_CONFIG } from './constants.ts';

const INITIAL_USER: User = {
  id: 'user-1',
  username: 'SpinMaster',
  balance: 1000,
  avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=SpinMaster',
  rank: UserRank.ROOKIE,
  rankXp: 0,
  email: 'player@xspin.com',
  bio: 'Ready to roll!'
};

const LoginScreen: React.FC<{ onLogin: (username?: string, email?: string) => void }> = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [isRegister, setIsRegister] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (isRegister && !formData.username)) {
      return;
    }
    soundManager.play('start');
    onLogin(formData.username || 'SpinMaster', formData.email);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vegas-bg relative overflow-hidden p-3 sm:p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      <div className="absolute top-4 sm:top-10 left-4 sm:left-10 w-32 sm:w-48 h-1 bg-neon-cyan/20 rotate-45 pointer-events-none"></div>
      <div className="absolute bottom-4 sm:bottom-10 right-4 sm:right-10 w-32 sm:w-48 h-1 bg-neon-pink/20 rotate-45 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 sm:mb-12 text-center group">
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-arcade font-black text-white tracking-tighter transition-all animate-glitch">
            X <span className="text-neon-pink text-glow-pink">SPIN</span>
          </h1>
          <div className="h-0.5 w-40 sm:w-64 bg-neon-cyan mx-auto mt-2 sm:mt-4 animate-pulse"></div>
          <p className="mt-2 sm:mt-4 text-neon-cyan font-arcade text-[8px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.6em] uppercase opacity-70">NEURAL ACCESS PROTOCOL</p>
        </div>

        <div className="bg-vegas-panel/90 backdrop-blur-xl border-2 sm:border-4 border-neon-cyan/40 retro-card p-4 sm:p-8 md:p-10 lg:p-14 shadow-[0_0_80px_rgba(255,255,255,0.15)] relative">
          <div className="absolute top-0 right-4 sm:right-10 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-neon-cyan/20 border-x border-b border-neon-cyan/40 text-[7px] sm:text-[8px] font-arcade text-neon-cyan pointer-events-none">ENCRYPTED_LINK_04</div>
          
          <h2 className="text-lg sm:text-2xl font-arcade text-white mb-6 sm:mb-10 text-center tracking-widest uppercase border-b border-neon-cyan/10 pb-4 sm:pb-6">
            {isRegister ? 'IDENTITY_REG' : 'ID_CHECK'}
          </h2>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {isRegister && (
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
            )}
            
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[7px] sm:text-[9px] text-neon-pink uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Gmail_Address</label>
              <input 
                type="email" 
                required
                autoFocus={!isRegister}
                value={formData.email}
                onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest lowercase" 
                placeholder="player@gmail.com" 
              />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[7px] sm:text-[9px] text-neon-pink uppercase font-arcade tracking-[0.3em] sm:tracking-[0.4em] block opacity-80">Sync_Code</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData(p => ({...p, password: e.target.value}))}
                className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm tracking-widest" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-neon-cyan text-black font-arcade py-3 sm:py-4 md:py-6 uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-sm sm:text-lg md:text-2xl font-black transition-all hover:bg-white hover:shadow-[0_0_50px_rgba(0,255,255,1)] active:scale-95 relative overflow-hidden group"
            >
              <span className="relative z-10">{isRegister ? 'SYNC' : 'START GAME'}</span>
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 pointer-events-none"></div>
            </button>
          </form>

          <div className="mt-6 sm:mt-12 text-center">
            <button 
              type="button"
              onClick={() => { setIsRegister(!isRegister); soundManager.play('click'); }}
              className="text-[7px] sm:text-[11px] text-slate-500 font-arcade hover:text-white transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] border-b border-transparent hover:border-white"
            >
              {isRegister ? '[ BACK_TO_AUTH ]' : '[ NEW_NEURAL_LINK ]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode; user: User }> = ({ children, user }) => {
  const location = useLocation();
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const rankStyle = RANK_CONFIG[user.rank];

  const isRoom = location.pathname.startsWith('/room');

  const toggleSound = () => {
    soundManager.play('click');
    setIsMuted(soundManager.toggleMute());
  };

  return (
    <div className="h-screen bg-vegas-bg text-white flex flex-col font-ui relative overflow-hidden">
      {!isRoom && (
        <header className="h-14 sm:h-16 md:h-20 border-b border-neon-purple/50 bg-vegas-panel/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-2 sm:px-4 md:px-8 shadow-[0_0_20px_rgba(191,0,255,0.2)]">
          <div className="flex items-center gap-2 sm:gap-6 md:gap-10 flex-1 min-w-0">
            <Link to="/" onClick={() => soundManager.play('click')} className="text-lg sm:text-2xl md:text-3xl font-arcade font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-cyan hover:scale-105 transition-transform animate-glitch whitespace-nowrap">
              X <span className="text-neon-gold">SPIN</span>
            </Link>
            <nav className="hidden sm:flex gap-4 md:gap-8">
              <Link to="/" className={`text-xs md:text-sm font-arcade uppercase tracking-widest ${location.pathname === '/' ? 'text-neon-cyan text-glow-cyan' : 'text-slate-400 hover:text-white'}`}>Lobby</Link>
              <Link to="/dashboard" className={`text-xs md:text-sm font-arcade uppercase tracking-widest ${location.pathname === '/dashboard' ? 'text-neon-pink text-glow-pink' : 'text-slate-400 hover:text-white'}`}>Vault</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
            <button onClick={toggleSound} className={`p-1.5 sm:p-2 rounded-full border transition-all text-base sm:text-lg ${isMuted ? 'border-red-500 text-red-500' : 'border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]'}`}>
              {isMuted ? '🔇' : '🔊'}
            </button>
            <div className="bg-black/60 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-sm border border-neon-green/30 whitespace-nowrap">
              <div className="font-arcade text-xs sm:text-sm md:text-lg text-neon-green text-glow-green">${user.balance.toLocaleString()}</div>
            </div>
            <Link to="/dashboard" className="transition-all hover:scale-110 active:scale-95 flex-shrink-0">
              <img src={user.avatar} className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 ${rankStyle.borderColor} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} alt="Profile" />
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('xspin_auth') === 'true';
  });
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [payment, setPayment] = useState<{ open: boolean, type: 'DEPOSIT' | 'WITHDRAWAL' }>({ open: false, type: 'DEPOSIT' });
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleUpdateBalance = useCallback((amount: number) => {
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  }, []);

  const handleJoinGame = useCallback((roomId: string) => {
    setActiveSessions(prev => {
      if (prev.find(s => s.id === roomId)) return prev;
      let type = 'BLITZ';
      let themeColor = 'neon-cyan';
      if (roomId.includes('pve')) { type = '1v1 DUEL'; themeColor = 'neon-green'; }
      else if (roomId.includes('tournament')) { type = 'GRAND PRIX'; themeColor = 'neon-pink'; }
      return [...prev, { id: roomId, type, status: 'CONNECTING...', themeColor, lastUpdate: Date.now() }];
    });
    navigate(`/room/${roomId}`);
  }, [navigate]);

  const handleExitGame = useCallback((roomId: string) => {
    console.log('handleExitGame called with roomId:', roomId);
    setActiveSessions(prev => {
      const filtered = prev.filter(s => s.id !== roomId);
      console.log('Removed session, remaining sessions:', filtered.length);
      return filtered;
    });
    navigate('/');
  }, [navigate]);

  const updateSessionStatus = useCallback((roomId: string, status: string) => {
    setActiveSessions(prev => prev.map(s => s.id === roomId ? { ...s, status, lastUpdate: Date.now() } : s));
  }, []);

  const handleLogin = (u?: string, e?: string) => {
    if (u) setUser(p => ({ ...p, username: u }));
    if (e) setUser(p => ({ ...p, email: e }));
    localStorage.setItem('xspin_auth', 'true');
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('xspin_auth');
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Home user={user} onJoinGame={handleJoinGame} />} />
        <Route path="/dashboard" element={<Dashboard user={user} transactions={transactions} onOpenPayment={(type) => setPayment({open: true, type})} onUpdateProfile={(updates) => setUser(p => ({...p, ...updates}))} onLogout={handleLogout} />} />
        <Route path="/room/:roomId" element={
          <RoomWrapper 
            user={user} 
            handleUpdateBalance={handleUpdateBalance} 
            handleExitGame={handleExitGame}
            updateSessionStatus={updateSessionStatus}
          />
        } />
      </Routes>

      {location.pathname === '/' && activeSessions.length > 0 && (
        <GameDock sessions={activeSessions} activeSessionId={null} onSelect={(id) => navigate(`/room/${id}`)} onClose={handleExitGame} />
      )}

      <PaymentModal 
        isOpen={payment.open} 
        onClose={() => setPayment(p => ({...p, open: false}))} 
        type={payment.type} 
        onProcess={(method, amt) => {
          const final = payment.type === 'DEPOSIT' ? amt : -amt;
          handleUpdateBalance(final);
          setTransactions(p => [{ id: `tx-${Date.now()}`, type: payment.type, amount: amt, method, status: 'COMPLETED', date: new Date().toLocaleDateString() }, ...p]);
        }} 
      />
    </Layout>
  );
};

const RoomWrapper: React.FC<{
  user: User;
  handleUpdateBalance: (amt: number) => void;
  handleExitGame: (id: string) => void;
  updateSessionStatus: (id: string, s: string) => void;
}> = ({ user, handleUpdateBalance, handleExitGame, updateSessionStatus }) => {
  const { roomId } = useParams<{ roomId: string }>();
  
  // Memoize the onStatusChange callback to prevent infinite loops
  const handleStatusChange = useCallback((status: string) => {
    if (roomId) {
      console.log('Status change:', status, 'for roomId:', roomId);
      updateSessionStatus(roomId, status);
    }
  }, [roomId, updateSessionStatus]);
  
  return (
    <GameRoom 
      user={user} 
      updateBalance={handleUpdateBalance} 
      onWin={(mode) => console.log('Win in', mode)} 
      roomId={roomId}
      onLeaveGame={handleExitGame}
      onStatusChange={handleStatusChange}
    />
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;