import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SpinWheel from '../components/SpinWheel.tsx';
import AiChat from '../components/AiChat.tsx';
import BettingModal from '../components/BettingModal.tsx';
import ColorAssignmentModal from '../components/ColorAssignmentModal.tsx';
import PlayAgainModal from '../components/PlayAgainModal.tsx';
import { GameState, Player, PlayerStatus, ChatMessage, User, UserRank } from '../types.ts';
import { INITIAL_BOT_NAMES, RANK_CONFIG, WHEEL_SEGMENTS, COLORS, COLOR_HEX } from '../constants.ts';
import { chatWithAiOracle, generateGameCommentary } from '../services/geminiService.ts';
import { soundManager } from '../services/soundManager.ts';

// Winner Alert Component
const WinnerAlert: React.FC<{ name: string; amount: number; isUserWin: boolean }> = ({ name, amount, isUserWin }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none p-4">
      <div className={`animate-bounce text-center pointer-events-auto ${isUserWin ? 'drop-shadow-[0_0_50px_rgba(0,255,0,0.8)]' : 'drop-shadow-[0_0_50px_rgba(255,215,0,0.8)]'}`}>
        {/* Confetti effect background */}
        <div className="absolute inset-0 opacity-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#00ffff', '#ff00ff', '#ffd700', '#00ff00'][Math.floor(Math.random() * 4)],
                animation: `fall 3s linear infinite`,
                animationDelay: `${Math.random() * 1}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative bg-gradient-to-b from-neon-gold to-neon-cyan border-4 border-white rounded-lg p-4 sm:p-8 md:p-12 shadow-[0_0_100px_rgba(255,215,0,0.6)]">
          <div className="text-3xl sm:text-5xl md:text-7xl mb-2 sm:mb-4 md:mb-6">🏆</div>
          <div className={`text-2xl sm:text-4xl md:text-5xl font-arcade font-black mb-2 sm:mb-3 md:mb-4 ${isUserWin ? 'text-green-700' : 'text-black'}`}>
            {isUserWin ? 'YOU WON!' : 'WINNER!'}
          </div>
          <div className="border-b-2 border-white/30 py-2 sm:py-3 mb-2 sm:mb-4">
            <div className="text-lg sm:text-2xl md:text-3xl font-arcade font-bold text-black">
              {name}
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2 md:space-y-3">
            <div className="text-xs sm:text-base md:text-lg font-arcade text-black/80 uppercase tracking-wider">POT WON</div>
            <div className={`text-2xl sm:text-4xl md:text-5xl font-arcade font-black ${isUserWin ? 'text-green-700 text-glow-green' : 'text-yellow-700'}`}>
              +${amount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

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

  // Determine game mode from roomId
  const gameMode = roomId.includes('pve') ? '1v1' as const : roomId.includes('tournament') ? 'tournament' as const : 'blitz' as const;
  const maxPlayers = gameMode === 'tournament' ? 20 : gameMode === '1v1' ? 2 : 15;

  // Pre-game states for betting flow
  const [showBettingModal, setShowBettingModal] = useState(true);
  const [userBetAmount, setUserBetAmount] = useState(0);
  const [betsPlaced, setBetsPlaced] = useState(false);
  const [showColorAssignment, setShowColorAssignment] = useState(false);
  const [userAssignedColor, setUserAssignedColor] = useState('');
  
  // Play again flow
  const [showPlayAgainModal, setShowPlayAgainModal] = useState(false);
  const [lastWinner, setLastWinner] = useState<{ name: string; amount: number; isUserWin: boolean } | null>(null);
  const [roundNumber, setRoundNumber] = useState(0);

  const [gameState, setGameState] = useState<GameState>(GameState.PRE_GAME);
  const [players, setPlayers] = useState<Player[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [timer, setTimer] = useState(5);
  const [currentPot, setCurrentPot] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [betColor, setBetColor] = useState<'red' | 'black' | 'green' | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [userBetPlaced, setUserBetPlaced] = useState(false);
  const [userBetConfirmed, setUserBetConfirmed] = useState(false);
  const [timerPhase, setTimerPhase] = useState<'ready' | 'betting'>('ready');
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [kickoutModal, setKickoutModal] = useState(false);
  const [winnerAlert, setWinnerAlert] = useState<{ name: string; amount: number; isUserWin: boolean } | null>(null);
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

  // ===== BETTING MODAL HANDLERS =====
  const handleBettingConfirm = (betAmount: number) => {
    soundManager.play('lock');
    setUserBetAmount(betAmount);
    updateBalance(-betAmount);
    setShowBettingModal(false);
    
    // Show color assignment modal
    setTimeout(() => {
      setShowColorAssignment(true);
    }, 300);
  };

  const handleBettingCancel = () => {
    soundManager.play('click');
    // Go back to home
    navigate('/');
  };

  const handleColorAssignmentConfirm = () => {
    soundManager.play('lock');
    setShowColorAssignment(false);
    setBetsPlaced(true);
    
    // Start the pre-game setup
    setTimeout(() => {
      setGameState(GameState.WAITING);
    }, 500);
  };

  // ===== PLAY AGAIN HANDLERS =====
  const handlePlayAgain = () => {
    soundManager.play('start');
    setShowPlayAgainModal(false);
    setRoundNumber(prev => prev + 1);
    
    // Reset game state for next round
    setTimeout(() => {
      setWinnerAlert(null);
      setShowBettingModal(true);
      setUserBetAmount(0);
      setBetsPlaced(false);
      setShowColorAssignment(false);
      setGameState(GameState.PRE_GAME);
      setChatHistory(prev => [...prev, {
        id: Math.random().toString(36),
        sender: 'SYSTEM',
        text: '🔄 NEXT ROUND STARTING... PLACE YOUR BET!',
        isAi: true,
        timestamp: new Date()
      }]);
    }, 300);
  };

  const handleExitToLobbyFromGame = () => {
    soundManager.play('beep');
    setShowPlayAgainModal(false);
    setRoundNumber(0);
    
    if (onLeaveGame && roomId) {
      onLeaveGame(roomId);
    } else {
      navigate('/');
    }
  };

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

  // Generate wheel segments based on game mode
  // For 1v1: alternate segments between the two players (8 each, alternating pattern)
  // For multi-player: one segment per player
  const wheelSegments = useMemo(() => {
    const is1v1 = roomId.includes('pve');
    
    if (is1v1 && players.length === 2) {
      // 1v1 duel: alternate between player colors - color A, color B, color A, color B...
      const segments = [];
      for (let i = 0; i < 16; i++) {
        const playerIndex = i % 2; // Alternates between 0 and 1
        segments.push({
          label: players[playerIndex].username.substring(0, 3).toUpperCase(),
          color: players[playerIndex].assignedColor,
          value: playerIndex
        });
      }
      return segments;
    }
    
    // Regular multiplayer: one segment per player
    const segments = players.map(p => ({
      label: p.assignedColor.substring(0, 3).toUpperCase(),
      color: p.assignedColor,
      value: players.indexOf(p)
    }));
    return segments.length > 0 ? segments : WHEEL_SEGMENTS;
  }, [players, roomId]);

  useEffect(() => {
    isMounted.current = true;
    
    // Only initialize if bets have been placed
    if (!betsPlaced) return;

    // Bots with varied ranks to show off the visual system
    const bots: Player[] = Array.from({ length: maxPlayers - 1 }, (_, i) => {
      const ranks = [UserRank.ROOKIE, UserRank.PRO, UserRank.MASTER, UserRank.LEGEND];
      const botRank = ranks[i % ranks.length];
      // Rotate colors based on round number to avoid same colors
      // Using offset of 4 to ensure maximum visual separation with 12 distinct colors
      const colorIndex = (i + (roundNumber * 4)) % COLORS.length;
      const assignedColor = COLORS[colorIndex];
      return {
        id: `bot-${i}`,
        username: `${gameMode === '1v1' ? 'Opponent' : gameMode === 'tournament' ? 'GrandBot' : 'BlitzBot'}${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${gameMode}bot${i}`,
        betAmount: Math.floor(Math.random() * 500) + 50,
        selectedColor: assignedColor,
        assignedColor: assignedColor,
        status: PlayerStatus.CONFIRMED,
        isBot: true,
        rank: botRank
      };
    });

    // Add the current player with assigned color (also rotated by round)
    // Using same offset of 4 to ensure no duplicate colors in same round
    const userColorIndex = ((maxPlayers - 1) + (roundNumber * 4)) % COLORS.length;
    const userColor = COLORS[userColorIndex];
    setUserAssignedColor(userColor);
    
    const userPlayer: Player = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      betAmount: userBetAmount,
      selectedColor: userColor,
      assignedColor: userColor,
      status: PlayerStatus.CONFIRMED,
      isBot: false,
      rank: user.rank
    };
    
    setPlayers([...bots, userPlayer]);
    
    setChatHistory(prev => {
      const lastMsg = prev[prev.length - 1];
      // Don't add duplicate message
      if (lastMsg?.text.includes('PLAYERS READY')) {
        return prev;
      }
      return [...prev, {
        id: Math.random().toString(36),
        sender: 'SYSTEM',
        text: `⏳ ${maxPlayers} PLAYERS READY. AWAITING GAME START...`,
        isAi: true,
        timestamp: new Date()
      }];
    });

    return () => { isMounted.current = false; };
  }, [betsPlaced, userBetAmount, gameMode, maxPlayers, user, roundNumber]);

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

  // Capture the pot amount right when entering LOCKED state
  useEffect(() => {
    if (gameState === GameState.LOCKED) {
      const potAmount = players
        .filter(p => p.status === PlayerStatus.CONFIRMED)
        .reduce((sum, p) => sum + p.betAmount, 0);
      setCurrentPot(potAmount);
    }
  }, [gameState]);

  useEffect(() => {
    if (onStatusChange && gameState) {
      onStatusChange(gameState);
    }
  }, [gameState, onStatusChange]);

  useEffect(() => {
    let interval: any;
    let spinTimeoutId: NodeJS.Timeout | null = null;

    if (gameState === GameState.WAITING) {
      setTimer(3);
      setTimerPhase('ready');
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setGameState(GameState.LOCKED);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (gameState === GameState.LOCKED) {
      // Room is locked - all players ready, spinning starts
      setTimer(3);
      setTimerPhase('ready');
      addChatMessage('ORACLE', '🔒 ROOM LOCKED. ALL PLAYERS IN. SPINNING STARTS...', true);
      soundManager.play('lock');
      
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            // Trigger spinning
            if (!spinInProgressRef.current) {
              spinResultAnnouncedRef.current = false; // Reset for new spin
              // Pick a random target that will be the final resting position
              const newIndex = Math.floor(Math.random() * wheelSegments.length);
              setTargetIndex(newIndex);
              setGameState(GameState.SPINNING);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (gameState === GameState.SPINNING) {
      // SPINNING state: wheel is actively spinning
      // Safeguard: if spin hasn't completed after 10 seconds, force it to end
      spinTimeoutId = setTimeout(() => {
        if (spinInProgressRef.current) {
          spinInProgressRef.current = false;
        }
      }, 10000);
    }

    return () => {
      clearInterval(interval);
      if (spinTimeoutId) clearTimeout(spinTimeoutId);
    };
  }, [gameState, wheelSegments.length, addChatMessage]);

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
    
    // Get the result from wheelSegments
    const result = wheelSegments[targetIndex];
    if (!result) {
      console.error('No result found for targetIndex:', targetIndex);
      return;
    }
    setGameState(GameState.RESULT);
    
    // Announce the result
    soundManager.play('spin-end');
    addChatMessage('ORACLE', `🎰 POINTER LOCKED ON: ${result.color.toUpperCase()}!`, true);
    
    // For 1v1 duel: find winner by comparing segment value (0 or 1)
    const is1v1 = roomId.includes('pve');
    let winner: Player | undefined;
    
    if (is1v1) {
      // In 1v1, result.value indicates which player won (0 or 1)
      winner = players[result.value];
    } else {
      // In multiplayer, find winner by color match
      winner = players.find(p => p.assignedColor === result.color && p.status === PlayerStatus.CONFIRMED);
    }
    
    if (winner) {
      // Use the stored pot amount to ensure consistency with display
      const payout = currentPot * 2; // Double their money (pot includes their own bet)
      
      if (winner.id === user.id) {
        // User won
        updateBalance(payout);
        onWin(roomId);
        soundManager.play('win');
        setWinnerAlert({ name: user.username, amount: currentPot, isUserWin: true });
        setLastWinner({ name: user.username, amount: currentPot, isUserWin: true });
        const hype = await generateGameCommentary(user.username, payout, players.length);
        addChatMessage('ORACLE', `🏆 WINNER: ${user.username} TAKES THE POT! ${hype}`, true);
      } else {
        // Another player won
        soundManager.play('lose');
        setWinnerAlert({ name: winner.username, amount: currentPot, isUserWin: false });
        setLastWinner({ name: winner.username, amount: currentPot, isUserWin: false });
        addChatMessage('ORACLE', `🏆 WINNER: ${winner.username} TAKES THE POT!`, true);
      }
    } else {
      console.log('No winner - no one had the winning color');
      soundManager.play('lose');
      setWinnerAlert({ name: 'NO WINNER', amount: 0, isUserWin: false });
      setLastWinner({ name: 'NO WINNER', amount: 0, isUserWin: false });
      addChatMessage('ORACLE', `❌ NO BETS ON ${result.color.toUpperCase()}! POT RETURNED!`, true);
    }

    // Show play again modal instead of auto-resetting
    setTimeout(() => {
      if (!isMounted.current) return;
      spinInProgressRef.current = false;
      setShowPlayAgainModal(true);
    }, 2000);
  }, [targetIndex, players, user.id, user.username, roomId, updateBalance, onWin, addChatMessage, wheelSegments, currentPot]);

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
    <div className="flex flex-col lg:flex-row h-screen w-screen lg:w-full bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {/* Betting Modal - PRE_GAME Phase */}
      <BettingModal
        isOpen={showBettingModal}
        userBalance={user.balance}
        minBet={10}
        maxBet={user.balance}
        onConfirm={handleBettingConfirm}
        onCancel={handleBettingCancel}
        gameMode={gameMode}
      />

      {/* Color Assignment Modal - After bet is placed */}
      <ColorAssignmentModal
        isOpen={showColorAssignment}
        assignedColor={COLORS[(maxPlayers - 1 + roundNumber * 4) % COLORS.length]}
        playerName={user.username}
        gameMode={gameMode}
        onConfirm={handleColorAssignmentConfirm}
      />

      {/* Play Again Modal - After game ends */}
      {lastWinner && (
        <PlayAgainModal
          isOpen={showPlayAgainModal}
          winnerName={lastWinner.name}
          winAmount={lastWinner.amount}
          isUserWin={lastWinner.isUserWin}
          onPlayAgain={handlePlayAgain}
          onExit={handleExitToLobbyFromGame}
        />
      )}

      {/* Winner Alert */}
      {winnerAlert && (
        <WinnerAlert name={winnerAlert.name} amount={winnerAlert.amount} isUserWin={winnerAlert.isUserWin} />
      )}

      {/* Exit Lobby Button - Compact red neon-styled button */}
      <button 
        onClick={handleExitToLobby}
        className="fixed top-2 sm:top-4 left-2 sm:left-4 z-[100] px-3 sm:px-4 py-2 sm:py-2.5 font-arcade text-xs sm:text-sm font-bold tracking-widest uppercase transition-all duration-200 active:scale-95 cursor-pointer bg-red-600 border-2 border-red-400 text-white hover:bg-red-500 hover:border-red-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] rounded-sm"
        style={{ pointerEvents: 'auto' }}
      >
        ← EXIT
      </button>

      {/* Ranked Player Sidebar - Mobile: Collapsible Drawer, Desktop: Always Visible */}
      <div className={`fixed md:relative inset-0 md:inset-auto z-40 md:z-auto transition-all duration-300 ${sidebarOpen ? 'w-full md:w-72' : 'w-0 md:w-72'} md:h-full`}>
        <div className={`absolute inset-0 bg-black/70 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`absolute md:relative left-0 top-0 h-full w-64 md:w-full bg-vegas-panel border-r border-white/5 flex flex-col z-20 pt-12 sm:pt-12 md:pt-0 px-2 sm:px-3 py-3 md:p-0 max-h-full overflow-y-auto custom-scrollbar transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-2 right-2 text-slate-400 hover:text-white text-xl z-30"
          >
            ✕
          </button>
          
          <div className="p-2 sm:p-3 md:p-4 border-b border-white/5 bg-black/40">
            <h2 className="font-arcade text-[8px] sm:text-[9px] md:text-[9px] text-neon-cyan tracking-widest uppercase opacity-70">SYST_ACTIVE_NODES</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]"></span>
              <span className="text-[9px] sm:text-[10px] md:text-[10px] font-mono text-slate-400">{players.length} CONNECTED</span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-1 md:space-y-1.5 flex md:flex-col gap-1.5 mt-4 md:mt-0">
            {players.map(p => {
              const rConfig = RANK_CONFIG[p.rank || UserRank.ROOKIE];
              return (
                <div key={p.id} 
                     className={`flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded border border-transparent transition-all duration-300 flex-shrink-0 md:flex-shrink whitespace-nowrap md:whitespace-normal ${
                       p.id === user.id ? 'bg-white/10 border-white/20' : 'bg-black/20 hover:bg-white/5'
                     }`}
                >
                  <PlayerAvatar player={p} size="xs" />
                  <div className="min-w-0 flex-1 md:block">
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
      </div>

      {/* Mobile Players Toggle Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed bottom-24 right-2 z-30 w-11 h-11 bg-neon-cyan text-black rounded-full font-bold text-xl hover:bg-white transition-colors flex items-center justify-center shadow-lg active:scale-95"
      >
        👥
      </button>

      <div className="flex-1 flex flex-col relative pt-12 sm:pt-12 md:pt-0 w-full md:flex-1 min-h-0">
        {/* Inactivity Warning - Overlay when needed */}
        {inactivityWarning && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <div className="bg-black/95 border-2 border-neon-pink animate-pulse px-6 sm:px-12 py-8 sm:py-10 rounded-lg text-center backdrop-blur" style={{ boxShadow: '0 0 50px rgba(255, 0, 255, 0.6)' }}>
              <div className="text-neon-pink text-sm sm:text-base md:text-lg font-arcade tracking-widest uppercase mb-2 sm:mb-4">WARNING INACTIVITY</div>
              <div className="text-neon-pink text-4xl sm:text-6xl md:text-7xl font-arcade font-black" style={{ textShadow: '0 0 20px rgba(255, 0, 255, 0.8)' }}>
                {inactivityCountdown}s
              </div>
              <div className="text-neon-pink text-xs sm:text-sm font-arcade tracking-wider uppercase mt-3 sm:mt-4">
                Make a move or be ejected
              </div>
            </div>
          </div>
        )}

        {/* Betting Status Display - Betting Phase */}
        {gameState === GameState.BETTING && !inactivityWarning && (
          <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-30 text-center">
            <div className="bg-black/40 border border-white/20 px-4 sm:px-8 py-2 sm:py-3 rounded inline-block transition-all backdrop-blur">
               <div className="text-xs sm:text-sm font-arcade uppercase text-slate-400 mb-1">PLACE YOUR BETS</div>
               <div className="text-xl sm:text-2xl font-arcade tracking-tighter text-white">
                 {timer > 5 ? `${timer}s` : `Spin in ${timer}s`}
               </div>
            </div>
          </div>
        )}

        {/* Spin Wheel - Responsive */}
        <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 md:p-4 min-h-[220px] sm:min-h-[320px] relative overflow-visible gap-2 sm:gap-4">
          {/* Countdown Display - Before Spin */}
          {gameState === GameState.BETTING && timer > 0 && (
            <div className="text-center mb-2 sm:mb-4">
              <div className="text-[10px] sm:text-[12px] font-arcade text-neon-cyan uppercase tracking-wider mb-1 sm:mb-2">Spin starts in</div>
              <div className="text-2xl sm:text-4xl md:text-5xl font-arcade font-black text-neon-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
                {timer}s
              </div>
            </div>
          )}

          {/* Wheel Container with Pointer and Pot */}
          <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            <SpinWheel 
              spinning={gameState === GameState.SPINNING} 
              targetIndex={targetIndex} 
              onSpinEnd={onSpinEnd} 
              segments={wheelSegments}
            />
            
            {/* Total Pot Display - Mobile Optimized */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/90 border border-neon-gold rounded px-2 sm:px-4 py-1.5 sm:py-3 z-40">
              <div className="text-[7px] sm:text-[10px] font-arcade text-neon-gold/70 uppercase tracking-widest">TOTAL POT</div>
              <div className="text-sm sm:text-2xl font-arcade font-black text-neon-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                ${players.filter(p => p.status === PlayerStatus.CONFIRMED).reduce((sum, p) => sum + p.betAmount, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Console - Simple Betting */}
        <div className="p-2 sm:p-3 md:p-4 bg-vegas-panel/90 border-t border-white/5 z-20 backdrop-blur-md max-h-[45vh] sm:max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
          <div className="max-w-full sm:max-w-2xl mx-auto space-y-2 sm:space-y-3 md:space-y-5">
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
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-1 flex bg-black/60 border border-white/10 rounded-sm overflow-hidden shadow-inner">
                    <button 
                      onClick={() => { soundManager.play('click'); setBetAmount(a => Math.max(10, a - 50)); }} 
                      disabled={gameState !== GameState.BETTING}
                      className="px-2 sm:px-4 hover:bg-white/5 disabled:opacity-50 text-slate-500 font-bold transition-colors text-xs sm:text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(user.balance, parseInt(e.target.value) || 0));
                        setBetAmount(val);
                      }}
                      disabled={gameState !== GameState.BETTING}
                      className="flex-1 bg-transparent text-center font-arcade text-neon-green text-base sm:text-xl md:text-2xl tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,0,0.5)] border-0 outline-none disabled:opacity-50"
                    />
                    <button 
                      onClick={() => { soundManager.play('click'); setBetAmount(a => Math.min(user.balance, a + 50)); }} 
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
                <div className="flex gap-1 sm:gap-2 justify-center">
                  <button
                    onClick={handleCancelBet}
                    className="px-4 sm:px-6 py-1.5 sm:py-2 font-arcade text-[7px] sm:text-[8px] md:text-[9px] tracking-[0.15em] transition-all border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black rounded shadow-lg whitespace-nowrap"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleConfirmBet}
                    className="px-4 sm:px-6 py-1.5 sm:py-2 font-arcade text-[7px] sm:text-[8px] md:text-[9px] tracking-[0.15em] transition-all border-2 border-neon-cyan bg-neon-cyan text-black hover:bg-white rounded shadow-lg font-black whitespace-nowrap"
                  >
                    CONFIRM
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

      {/* Chat Panel - Mobile: Collapsible Drawer, Tablet+: Fixed Side Panel */}
      <div className={`fixed sm:relative inset-0 sm:inset-auto z-40 sm:z-auto transition-all duration-300 ${chatOpen ? 'w-full sm:w-72 md:w-80' : 'w-0 sm:w-72 md:w-80'} sm:h-full`}>
        <div className={`absolute inset-0 bg-black/70 sm:hidden transition-opacity duration-300 ${chatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setChatOpen(false)}></div>
        <div className={`absolute sm:relative left-0 top-0 h-full w-64 sm:w-full border-t sm:border-t-0 sm:border-l border-white/5 z-20 bg-black/95 flex flex-col overflow-y-auto custom-scrollbar transition-transform duration-300 sm:translate-x-0 ${chatOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <button 
            onClick={() => setChatOpen(false)}
            className="sm:hidden absolute top-2 right-2 text-slate-400 hover:text-white text-xl z-30"
          >
            ✕
          </button>
          <div className="mt-10 sm:mt-0">
            <AiChat chatHistory={chatHistory} onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>

      {/* Mobile Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="sm:hidden fixed bottom-16 right-2 z-30 w-11 h-11 bg-neon-pink text-black rounded-full font-bold text-xl hover:bg-white transition-colors flex items-center justify-center shadow-lg active:scale-95"
      >
        💬
      </button>

      {/* Kickout Modal */}
      {kickoutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] backdrop-blur-sm p-4">
          <div className="bg-vegas-panel border-4 border-neon-pink shadow-[0_0_60px_rgba(255,0,255,0.6)] rounded-sm p-6 sm:p-8 md:p-12 max-w-md w-full text-center animate-pulse">
            <div className="mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⚠️</div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-arcade text-neon-pink tracking-widest uppercase mb-3 sm:mb-4">
                KICKED OUT
              </h2>
              <p className="text-slate-300 font-ui text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-6">
                You have been kicked out of the room for inactivity. Join again to play.
              </p>
            </div>
            <button
              onClick={handleKickoutOkay}
              className="w-full bg-neon-cyan text-black font-arcade py-3 sm:py-4 md:py-4 px-6 sm:px-8 uppercase tracking-[0.3em] text-xs sm:text-base md:text-lg font-black transition-all hover:bg-white hover:shadow-[0_0_50px_rgba(0,255,255,1)] active:scale-95 rounded-sm"
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