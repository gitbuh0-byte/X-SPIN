import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SpinWheel from '../components/SpinWheel.tsx';
import AiChat from '../components/AiChat.tsx';
import { GameState, Player, PlayerStatus, ChatMessage, User, UserRank } from '../types.ts';
import { INITIAL_BOT_NAMES, RANK_CONFIG, WHEEL_SEGMENTS, COLORS, COLOR_HEX } from '../constants.ts';
import { chatWithAiOracle, generateGameCommentary } from '../services/geminiService.ts';
import { soundManager } from '../services/soundManager.ts';

interface GameRoomProps {
  user: User;
  updateBalance: (amount: number) => void;
  onWin: (mode: string) => void;
  roomId?: string; 
  onLeaveGame?: (id: string) => void;
  onStatusChange?: (status: string) => void;
}

const PlayerAvatar: React.FC<{ player: Player; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ player, size = 'md' }) => {
  const sizeClasses = { 
    xs: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7',
    sm: 'w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10', 
    md: 'w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14', 
    lg: 'w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20' 
  };
  
  const rank = player.rank || UserRank.ROOKIE;
  const rankConfig = RANK_CONFIG[rank];
  const avatarUrl = player.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.username}`;

  // Visual intensity scaling with rank
  const borderThickness = rank === UserRank.LEGEND ? 'border-[3px]' : rank === UserRank.MASTER ? 'border-[2px]' : 'border-[1.5px]';
  const glowIntensity = rank === UserRank.LEGEND ? '25px' : rank === UserRank.MASTER ? '15px' : rank === UserRank.PRO ? '8px' : '0px';
  
  return (
    <div className={`relative rounded-full ${borderThickness} flex-shrink-0 transition-all duration-300 hover:scale-110 z-10 group ${sizeClasses[size]}`} 
         style={{ 
           boxShadow: `0 0 ${glowIntensity} ${rankConfig.color}88`,
           borderColor: rankConfig.color,
           backgroundColor: '#000'
         }}>
      <img src={avatarUrl} alt={player.username} className="w-full h-full object-cover rounded-full p-[1px]" />
      
      {/* Mini Rank Label */}
      <div 
        className="absolute -top-1 -left-1 px-1 rounded-[1px] text-[4px] sm:text-[5px] md:text-[7px] font-arcade border border-black shadow-lg z-30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
        style={{ backgroundColor: rankConfig.color, color: '#000' }}
      >
        {rankConfig.label}
      </div>

      {player.status === PlayerStatus.CONFIRMED && (
        <div className="absolute -bottom-1 -right-1 bg-neon-green rounded-full w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 flex items-center justify-center border border-black shadow-[0_0_8px_lime] z-20 animate-pulse">
           <span className="text-black text-[6px] sm:text-[8px] md:text-[11px] font-black">✓</span>
        </div>
      )}
    </div>
  );
};

const GameRoom: React.FC<GameRoomProps> = ({ user, updateBalance, onWin, roomId: propRoomId, onLeaveGame, onStatusChange }) => {
  const { roomId: paramRoomId } = useParams();
  const navigate = useNavigate();
  const roomId = propRoomId || paramRoomId || 'lobby';
  const isMounted = useRef(true);

  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [players, setPlayers] = useState<Player[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [timer, setTimer] = useState(5);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [betColor, setBetColor] = useState<'red' | 'black' | 'green' | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [userBetPlaced, setUserBetPlaced] = useState(false); // Bet placed but not confirmed
  const [userBetConfirmed, setUserBetConfirmed] = useState(false); // Bet confirmed and locked
  const [timerPhase, setTimerPhase] = useState<'ready' | 'betting'>('ready'); // Two-phase countdown
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(0);
  const [kickoutModal, setKickoutModal] = useState(false);
  const bettingStartTimeRef = useRef<number | null>(null);
  const hasBeenKickedRef = useRef(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const kickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinResultAnnouncedRef = useRef(false);
  const spinInProgressRef = useRef(false);

  // Helper to add chat messages
  const addChatMessage = useCallback((sender: string, text: string, isAi = false) => {
    setChatHistory(prev => [...prev, {
      id: Math.random().toString(36),
      sender,
      text,
      isAi,
      timestamp: new Date()
    }]);
    if (!isAi) soundManager.play('message');
  }, []);

  const colorWagers = useMemo(() => {
    const wagers: Record<string, Player[]> = {};
    COLORS.forEach(color => {
      wagers[color] = [];
    });
    
    players.forEach(p => {
      if (p.status === PlayerStatus.CONFIRMED && p.selectedColor && wagers[p.selectedColor]) {
        wagers[p.selectedColor].push(p);
      }
    });
    
    return wagers;
  }, [players]);

  // Generate wheel segments based on players' assigned colors
  const wheelSegments = useMemo(() => {
    const segments = players.map(p => ({
      label: p.assignedColor.substring(0, 3).toUpperCase(),
      color: p.assignedColor,
      value: players.indexOf(p)
    }));
    return segments.length > 0 ? segments : WHEEL_SEGMENTS;
  }, [players]);

  useEffect(() => {
    isMounted.current = true;
    
    // Bots with varied ranks to show off the visual system
    const bots: Player[] = INITIAL_BOT_NAMES.map((name, i) => {
      const ranks = [UserRank.ROOKIE, UserRank.PRO, UserRank.MASTER, UserRank.LEGEND];
      const botRank = ranks[i % ranks.length]; // Ensure a mix of ranks is visible
      const assignedColor = COLORS[i % COLORS.length];
      return {
        id: `bot-${i}`,
        username: name,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
        betAmount: 0,
        selectedColor: assignedColor,
        assignedColor: assignedColor,
        status: PlayerStatus.IDLE,
        isBot: true,
        rank: botRank
      };
    });
    
    // Add the current player with assigned color (next color after bots)
    const userColorIndex = INITIAL_BOT_NAMES.length % COLORS.length;
    const userColor = COLORS[userColorIndex];
    const userPlayer: Player = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      betAmount: 0,
      selectedColor: userColor,
      assignedColor: userColor,
      status: PlayerStatus.IDLE,
      isBot: false,
      rank: user.rank
    };
    
    setPlayers([...bots, userPlayer]);
    
    setChatHistory([{
      id: 'welcome',
      sender: 'SYSTEM',
      text: 'CORE LINK ESTABLISHED. ALL RANKS SYNCED.',
      isAi: true,
      timestamp: new Date()
    }]);

    return () => { isMounted.current = false; };
  }, []);

  // Inactivity tracking - kick user if they don't place a bet during betting phase
  useEffect(() => {
    if (gameState === GameState.BETTING) {
      // Reset kick flag when betting starts
      hasBeenKickedRef.current = false;
      bettingStartTimeRef.current = Date.now();
      setInactivityWarning(false);
      setInactivityCountdown(0);

      // Give user warning at 10 seconds into betting (5 seconds left)
      warningTimeoutRef.current = setTimeout(() => {
        const userHasBet = userBetPlaced || players.some(p => p.id === user.id && p.status === PlayerStatus.CONFIRMED);
        if (!userHasBet && isMounted.current) {
          setInactivityWarning(true);
          soundManager.play('warning');
          let countdown = 5;
          setInactivityCountdown(countdown);
          
          const countdownInterval = setInterval(() => {
            countdown--;
            setInactivityCountdown(countdown);
            if (countdown <= 0) {
              clearInterval(countdownInterval);
            }
          }, 1000);
        }
      }, 10000);

      // Kick at end of betting if no bet placed
      kickTimeoutRef.current = setTimeout(() => {
        const userHasBet = userBetPlaced || players.some(p => p.id === user.id && p.status === PlayerStatus.CONFIRMED);
        if (!userHasBet && !hasBeenKickedRef.current && isMounted.current) {
          hasBeenKickedRef.current = true;
          console.log('User did not place a bet - kicking out');
          setKickoutModal(true);
        }
      }, 15000);
    } else {
      setInactivityWarning(false);
      setInactivityCountdown(0);
    }

    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current);
    };
  }, [gameState, onLeaveGame, roomId, navigate, userBetPlaced]);

  // Clear warning and cancel kickout once user confirms bet
  useEffect(() => {
    if (userBetConfirmed && gameState === GameState.BETTING) {
      // Clear the warning display
      setInactivityWarning(false);
      setInactivityCountdown(0);
      
      // Cancel the timeouts since user is now safe
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      if (kickTimeoutRef.current) {
        clearTimeout(kickTimeoutRef.current);
        kickTimeoutRef.current = null;
      }
    }
  }, [userBetConfirmed, gameState]);

  useEffect(() => {
    if (onStatusChange && gameState) {
      console.log('Calling onStatusChange with gameState:', gameState);
      onStatusChange(gameState);
    }
  }, [gameState, onStatusChange]);

  useEffect(() => {
    let interval: any;

    if (gameState === GameState.WAITING) {
      setTimer(3);
      setTimerPhase('ready');
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setGameState(GameState.BETTING);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (gameState === GameState.BETTING) {
      setTimer(15);
      setTimerPhase('betting');
      const betInterval = setInterval(() => {
        setPlayers(prev => prev.map(p => {
          if (p.isBot && p.status === PlayerStatus.IDLE && Math.random() > 0.6) {
            return { ...p, status: PlayerStatus.CONFIRMED, betAmount: Math.floor(Math.random() * 500) + 50 };
          }
          return p;
        }));
      }, 2500);

      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(betInterval);
            setGameState(GameState.LOCKED);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (gameState === GameState.LOCKED) {
      setTimer(3);
      setTimerPhase('ready');
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            // Trigger spinning - winner will be selected when spin ends
            spinResultAnnouncedRef.current = false; // Reset for new spin
            // Pick a random target that will be the final resting position
            const newIndex = Math.floor(Math.random() * wheelSegments.length);
            setTargetIndex(newIndex);
            setGameState(GameState.SPINNING);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState]);

  const handlePlaceBet = () => {
    if (user.balance < betAmount || gameState !== GameState.BETTING) return;
    
    soundManager.play('bet');
    // Just place the bet - show it's placed but not yet confirmed
    setUserBetPlaced(true);
  };

  const handleConfirmBet = () => {
    if (user.balance < betAmount || gameState !== GameState.BETTING) return;
    const userPlayer = players.find(p => p.id === user.id);
    if (!userPlayer) return;
    
    soundManager.play('bet');
    updateBalance(-betAmount);
    setUserBetConfirmed(true);
    setPlayers(prev => {
      const others = prev.filter(p => p.id !== user.id);
      return [...others, {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        betAmount: betAmount,
        selectedColor: userPlayer.assignedColor,
        assignedColor: userPlayer.assignedColor,
        status: PlayerStatus.CONFIRMED,
        isBot: false,
        rank: user.rank
      }];
    });
  };

  const handleCancelBet = () => {
    soundManager.play('beep');
    setUserBetPlaced(false);
    setUserBetConfirmed(false);
    setBetAmount(50);
  };

  const onSpinEnd = useCallback(async () => {
    if (!isMounted.current || spinResultAnnouncedRef.current) return;
    spinResultAnnouncedRef.current = true;
    
    console.log('=== SPIN END ===');
    console.log('targetIndex:', targetIndex);
    console.log('wheelSegments length:', wheelSegments.length);
    
    // Get the result from wheelSegments (which contains player colors)
    const result = wheelSegments[targetIndex];
    console.log('Result color:', result.color);
    setGameState(GameState.RESULT);
    
    // Announce the result
    soundManager.play('spin-end');
    addChatMessage('ORACLE', `🎰 POINTER LOCKED ON: ${result.color.toUpperCase()}!`, true);
    
    // Find the winner - the player whose assigned color matches the result
    const winner = players.find(p => p.assignedColor === result.color && p.status === PlayerStatus.CONFIRMED);
    
    if (winner) {
      console.log('WINNER:', winner.username);
      // Calculate total pot from all confirmed bets
      const totalPot = players
        .filter(p => p.status === PlayerStatus.CONFIRMED)
        .reduce((sum, p) => sum + p.betAmount, 0);
      
      const payout = totalPot * 2; // Double their money (pot includes their own bet)
      
      if (winner.id === user.id) {
        // User won
        updateBalance(payout);
        onWin(roomId);
        soundManager.play('win');
        const hype = await generateGameCommentary(user.username, payout, players.length);
        addChatMessage('ORACLE', `🏆 WINNER: ${user.username} TAKES THE POT! 💰 +$${payout}! ${hype}`, true);
      } else {
        // Another player won
        soundManager.play('lose');
        addChatMessage('ORACLE', `🏆 WINNER: ${winner.username} TAKES THE POT! 💰 +$${payout}!`, true);
      }
    } else {
      console.log('No winner - no one had the winning color');
      soundManager.play('lose');
      addChatMessage('ORACLE', `❌ NO BETS ON ${result.color.toUpperCase()}! POT RETURNED!`, true);
    }

    setTimeout(() => {
      if (!isMounted.current) return;
      setGameState(GameState.WAITING);
      setBetColor(null);
      setBetAmount(50);
      setUserBetPlaced(false);
      setUserBetConfirmed(false);
      setPlayers(prev => prev.map((p, i) => {
        const newColor = COLORS[i % COLORS.length];
        return {
          ...p,
          status: PlayerStatus.IDLE,
          betAmount: 0,
          selectedColor: newColor,
          assignedColor: newColor
        };
      }));
      spinResultAnnouncedRef.current = false; // Reset for next spin
      spinInProgressRef.current = false; // Reset spin lock
    }, 6000);
  }, [targetIndex, gameState, players, user.id, user.username, roomId, updateBalance, onWin, addChatMessage, wheelSegments]);

  const handleSendMessage = async (msg: string) => {
    addChatMessage('YOU', msg);
    const reply = await chatWithAiOracle(msg, chatHistory.slice(-5).map(m => m.text));
    if (isMounted.current) addChatMessage('ORACLE', reply, true);
  };

  const handleExitToLobby = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.play('beep');
    
    // Clear any game state first
    setGameState(GameState.WAITING);
    
    // Try using the callback first
    if (onLeaveGame && roomId) {
      console.log('Exiting game room:', roomId);
      try {
        onLeaveGame(roomId);
      } catch (err) {
        console.error('Error in onLeaveGame:', err);
        navigate('/');
      }
    } else {
      console.log('No onLeaveGame or roomId, navigating directly');
      navigate('/');
    }
  };

  const handleKickoutOkay = () => {
    setKickoutModal(false);
    if (onLeaveGame && roomId) {
      onLeaveGame(roomId);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {/* Exit Lobby Button - Fixed Position - HIGHLY VISIBLE */}
      <button 
        onClick={handleExitToLobby}
        className="fixed top-4 left-4 z-[9999] px-4 py-2.5 font-arcade text-sm font-bold tracking-widest uppercase rounded-sm shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer bg-red-600 hover:bg-red-700 border-2 border-red-400 text-white hover:text-yellow-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transform hover:scale-110"
        style={{ pointerEvents: 'auto' }}
      >
        ← EXIT
      </button>

      {/* Ranked Player Sidebar - Responsive */}
      <div className="hidden md:flex w-full md:w-72 bg-vegas-panel border-b md:border-b-0 md:border-r border-white/5 flex-col z-20 pt-2 px-3 py-3 md:pt-0 md:px-0 md:py-0 max-h-32 md:max-h-none md:overflow-y-auto custom-scrollbar">
        <div className="p-3 md:p-4 border-b border-white/5 bg-black/40">
          <h2 className="font-arcade text-[8px] md:text-[9px] text-neon-cyan tracking-widest uppercase opacity-70">SYST_ACTIVE_NODES</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]"></span>
            <span className="text-[9px] md:text-[10px] font-mono text-slate-400">{players.length} CONNECTED</span>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-1 md:space-y-1.5 flex md:flex-col gap-1.5">
          {players.map(p => {
            const rConfig = RANK_CONFIG[p.rank || UserRank.ROOKIE];
            return (
              <div key={p.id} 
                   className={`flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded border border-transparent transition-all duration-300 flex-shrink-0 md:flex-shrink whitespace-nowrap md:whitespace-normal ${
                     p.id === user.id ? 'bg-white/10 border-white/20' : 'bg-black/20 hover:bg-white/5'
                   }`}
              >
                <PlayerAvatar player={p} size="xs" />
                <div className="min-w-0 flex-1 hidden md:block">
                  <div className="text-[10px] md:text-[11px] font-bold text-white truncate uppercase tracking-tighter flex items-center justify-between">
                    <span>{p.username}</span>
                    {p.id === user.id && <span className="text-[7px] text-neon-cyan border border-neon-cyan/50 px-1 rounded ml-1 animate-pulse">YOU</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[7px] md:text-[8px] font-arcade px-1 border-b uppercase opacity-80" style={{ color: rConfig.color, borderColor: rConfig.color + '44' }}>
                      {rConfig.label}
                    </span>
                    {p.betAmount > 0 && (
                      <span className="text-neon-green text-[8px] md:text-[9px] font-mono font-black">
                        ${p.betAmount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative pt-20 sm:pt-16 md:pt-0">
        {/* Game State Timer */}
        <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-30 text-center w-full px-4 sm:px-0">
          <div className={`bg-black/90 border px-6 sm:px-12 py-3 sm:py-5 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] inline-block min-w-max transition-all ${
            inactivityWarning ? 'border-neon-pink/80 animate-pulse' : 'border-white/10'
          }`}>
             <div className={`text-[8px] sm:text-[9px] font-arcade tracking-[0.4em] uppercase mb-1 ${inactivityWarning ? 'text-neon-pink' : 'text-slate-500'}`}>
               {inactivityWarning ? `⚠️ INACTIVITY: EJECTING IN ${inactivityCountdown}s` : 
                gameState === GameState.RESULT ? 'FINAL_STATE' : 
                gameState === GameState.WAITING ? 'GETTING_READY' : 
                gameState === GameState.BETTING ? 'PLACE_YOUR_BETS' : 
                gameState}
             </div>
             <div className={`text-3xl sm:text-4xl md:text-5xl font-arcade tracking-tighter transition-colors ${
               inactivityWarning ? 'text-neon-pink animate-flicker' :
               timer < 5 && gameState === GameState.BETTING ? 'text-neon-pink animate-flicker' : 'text-white'
             }`}>
               {gameState === GameState.SPINNING ? 'SPINNING' : inactivityWarning ? `${inactivityCountdown}` : timer}
             </div>
          </div>
        </div>

        {/* Spin Wheel - Responsive */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 min-h-[280px] sm:min-h-[400px] relative">
          <SpinWheel 
            spinning={gameState === GameState.SPINNING} 
            targetIndex={targetIndex} 
            onSpinEnd={onSpinEnd} 
            segments={wheelSegments}
          />
          
          {/* Total Pot Display */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/80 border border-neon-gold rounded px-3 sm:px-4 py-2 sm:py-3">
            <div className="text-[8px] sm:text-[10px] font-arcade text-neon-gold/70 uppercase tracking-widest">TOTAL POT</div>
            <div className="text-lg sm:text-2xl font-arcade font-black text-neon-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              ${players.filter(p => p.status === PlayerStatus.CONFIRMED).reduce((sum, p) => sum + p.betAmount, 0)}
            </div>
          </div>
        </div>

        {/* Action Console - Simple Betting */}
        <div className="p-2 sm:p-4 md:p-6 bg-vegas-panel/90 border-t border-white/5 z-20 backdrop-blur-md max-h-[35vh] overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-2 sm:space-y-3 md:space-y-5">
            {/* Your Assigned Color & Bet Status */}
            {(() => {
              const userPlayer = players.find(p => p.id === user.id);
              if (!userPlayer) return null;
              
              const hexColor = COLOR_HEX[userPlayer.assignedColor as keyof typeof COLOR_HEX] || '#ffffff';
              
              return (
                <div className="text-center">
                  <div className="text-[8px] sm:text-[9px] md:text-[11px] font-arcade text-white/60 uppercase tracking-widest mb-2 sm:mb-3">YOUR COLOR</div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded border-2" style={{ borderColor: hexColor, backgroundColor: hexColor + '33' }}></div>
                    <div className="text-lg sm:text-2xl md:text-3xl font-arcade font-black tracking-wider uppercase" style={{ color: hexColor }}>
                      {userPlayer.assignedColor}
                    </div>
                  </div>
                  <div className="text-[7px] sm:text-[8px] md:text-[10px] text-white/50 font-mono tracking-widest">
                    {gameState === GameState.BETTING ? 'SELECT BET AMOUNT & CONFIRM' : 'BET LOCKED - WAITING FOR SPIN'}
                  </div>
                </div>
              );
            })()}

            {/* Bet Amount Controls */}
            {gameState === GameState.BETTING && !userBetPlaced && (
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 flex bg-black/60 border border-white/10 rounded-sm overflow-hidden shadow-inner">
                    <button 
                      onClick={() => { soundManager.play('click'); setBetAmount(a => Math.max(10, a - 50)); }} 
                      disabled={gameState !== GameState.BETTING}
                      className="px-2 sm:px-4 hover:bg-white/5 disabled:opacity-50 text-slate-500 font-bold transition-colors text-xs sm:text-sm"
                    >
                      -
                    </button>
                    <div className="flex-1 flex items-center justify-center font-arcade text-neon-green text-base sm:text-xl md:text-2xl tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
                      ${betAmount}
                    </div>
                    <button 
                      onClick={() => { soundManager.play('click'); setBetAmount(a => a + 50); }} 
                      disabled={gameState !== GameState.BETTING}
                      className="px-2 sm:px-4 hover:bg-white/5 disabled:opacity-50 text-slate-500 font-bold transition-colors text-xs sm:text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Place Bet Button */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={gameState !== GameState.BETTING || user.balance < betAmount}
                    className={`flex-1 sm:flex-auto py-2 sm:py-3 md:py-4 px-3 sm:px-5 font-arcade text-[8px] sm:text-[9px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] transition-all relative overflow-hidden group rounded-sm shadow-lg whitespace-nowrap ${
                      gameState !== GameState.BETTING || user.balance < betAmount
                      ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5'
                      : 'bg-neon-gold text-black hover:bg-white font-black'
                    }`}
                  >
                    <span className="relative z-10">PLACE BET</span>
                  </button>
                </div>
              </div>
            )}

            {/* Confirm/Cancel Buttons - Show after bet placed */}
            {gameState === GameState.BETTING && userBetPlaced && !userBetConfirmed && (
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="bg-neon-gold/20 border-2 border-neon-gold rounded-sm p-2 sm:p-3 md:p-4 text-center">
                  <div className="text-[8px] sm:text-[9px] md:text-[11px] font-arcade text-neon-gold uppercase tracking-widest mb-1 sm:mb-2">BET PLACED</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-arcade font-black text-neon-gold">${betAmount}</div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleCancelBet}
                    className="flex-1 py-2 sm:py-3 md:py-4 font-arcade text-[8px] sm:text-[9px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] transition-all border border-neon-pink text-neon-pink hover:bg-neon-pink/10 rounded-sm shadow-lg"
                  >
                    <span className="relative z-10">CANCEL</span>
                  </button>
                  <button
                    onClick={handleConfirmBet}
                    className={`flex-1 py-2 sm:py-3 md:py-4 font-arcade text-[8px] sm:text-[9px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] transition-all relative overflow-hidden group rounded-sm shadow-lg bg-neon-cyan text-black hover:bg-white font-black`}
                  >
                    <span className="relative z-10">CONFIRM BET</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bet Locked State */}
            {gameState === GameState.BETTING && userBetConfirmed && (
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="bg-gradient-to-r from-neon-purple to-neon-cyan border-2 border-neon-cyan rounded-sm p-3 sm:p-4 md:p-6 text-center animate-pulse">
                  <div className="text-[8px] sm:text-[9px] md:text-[11px] font-arcade text-white uppercase tracking-widest mb-2 sm:mb-3">🔒 BET LOCKED</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-arcade font-black text-white drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">${betAmount}</div>
                  <div className="mt-2 sm:mt-3 text-[7px] sm:text-[8px] md:text-[10px] font-arcade text-cyan-300 uppercase tracking-widest">
                    Ready to spin
                  </div>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-sm p-1.5 sm:p-2 md:p-3 text-center">
                  <div className="text-[7px] sm:text-[8px] md:text-[9px] font-arcade text-slate-400 uppercase tracking-widest">WAITING FOR GAME TO START</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel - Responsive */}
      <div className="hidden sm:flex w-full sm:w-72 md:w-80 border-t sm:border-t-0 sm:border-l border-white/5 z-20 bg-black/95 flex-col max-h-64 sm:max-h-none">
        <AiChat chatHistory={chatHistory} onSendMessage={handleSendMessage} />
      </div>

      {/* Kickout Modal */}
      {kickoutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] backdrop-blur-sm">
          <div className="bg-vegas-panel border-4 border-neon-pink shadow-[0_0_60px_rgba(255,0,255,0.6)] rounded-sm p-8 sm:p-12 max-w-md mx-4 text-center animate-pulse">
            <div className="mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl sm:text-3xl font-arcade text-neon-pink tracking-widest uppercase mb-4">
                KICKED OUT
              </h2>
              <p className="text-slate-300 font-ui text-sm sm:text-base leading-relaxed mb-6">
                You have been kicked out of the room for inactivity. Join again to play.
              </p>
            </div>
            <button
              onClick={handleKickoutOkay}
              className="w-full bg-neon-cyan text-black font-arcade py-4 px-8 uppercase tracking-[0.3em] text-lg font-black transition-all hover:bg-white hover:shadow-[0_0_50px_rgba(0,255,255,1)] active:scale-95 rounded-sm"
            >
              OKAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;