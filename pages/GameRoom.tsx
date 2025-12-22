import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SpinWheel from '../components/SpinWheel.tsx';
import AiChat from '../components/AiChat.tsx';
import { GameState, Player, PlayerStatus, ChatMessage, User, UserRank } from '../types.ts';
import { INITIAL_BOT_NAMES, RANK_CONFIG, WHEEL_SEGMENTS } from '../constants.ts';
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
    xs: 'w-6 h-6 md:w-7 md:h-7',
    sm: 'w-8 h-8 md:w-10 md:h-10', 
    md: 'w-10 h-10 md:w-14 md:h-14', 
    lg: 'w-14 h-14 md:w-20 md:h-20' 
  };
  
  const rank = player.rank || UserRank.ROOKIE;
  const rankConfig = RANK_CONFIG[rank];
  const avatarUrl = player.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.username}`;

  // Visual intensity scaling with rank
  const borderThickness = rank === UserRank.LEGEND ? 'border-[3px]' : rank === UserRank.MASTER ? 'border-[2px]' : 'border-[1.5px]';
  const glowIntensity = rank === UserRank.LEGEND ? '25px' : rank === UserRank.MASTER ? '15px' : rank === UserRank.PRO ? '8px' : '0px';
  
  return (
    <div className={`relative rounded-full ${borderThickness} flex-shrink-0 transition-all duration-300 hover:scale-110 z-10 group`} 
         style={{ 
           boxShadow: `0 0 ${glowIntensity} ${rankConfig.color}88`,
           borderColor: rankConfig.color,
           backgroundColor: '#000'
         }}>
      <img src={avatarUrl} alt={player.username} className="w-full h-full object-cover rounded-full p-[1px]" />
      
      {/* Mini Rank Label */}
      <div 
        className="absolute -top-1 -left-1 px-1 rounded-[1px] text-[5px] md:text-[7px] font-arcade border border-black shadow-lg z-30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
        style={{ backgroundColor: rankConfig.color, color: '#000' }}
      >
        {rankConfig.label}
      </div>

      {player.status === PlayerStatus.CONFIRMED && (
        <div className="absolute -bottom-1 -right-1 bg-neon-green rounded-full w-3.5 h-3.5 md:w-5 md:h-5 flex items-center justify-center border border-black shadow-[0_0_8px_lime] z-20 animate-pulse">
           <span className="text-black text-[8px] md:text-[11px] font-black">✓</span>
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

  const colorWagers = useMemo(() => {
    return players.reduce((acc, p) => {
      if (p.status === PlayerStatus.CONFIRMED && p.selectedColor) {
        acc[p.selectedColor].push(p);
      }
      return acc;
    }, { red: [] as Player[], black: [] as Player[], green: [] as Player[] });
  }, [players]);

  useEffect(() => {
    isMounted.current = true;
    
    // Bots with varied ranks to show off the visual system
    const bots: Player[] = INITIAL_BOT_NAMES.map((name, i) => {
      const ranks = [UserRank.ROOKIE, UserRank.PRO, UserRank.MASTER, UserRank.LEGEND];
      const botRank = ranks[i % ranks.length]; // Ensure a mix of ranks is visible
      return {
        id: `bot-${i}`,
        username: name,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
        betAmount: 0,
        selectedColor: (['red', 'black', 'green'] as const)[Math.floor(Math.random() * 3)],
        status: PlayerStatus.IDLE,
        isBot: true,
        rank: botRank
      };
    });
    setPlayers(bots);
    
    setChatHistory([{
      id: 'welcome',
      sender: 'SYSTEM',
      text: 'CORE LINK ESTABLISHED. ALL RANKS SYNCED.',
      isAi: true,
      timestamp: new Date()
    }]);

    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    onStatusChange?.(gameState);
  }, [gameState, onStatusChange]);

  useEffect(() => {
    let interval: any;

    if (gameState === GameState.WAITING) {
      setTimer(5);
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
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            const newIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
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
    if (!betColor || user.balance < betAmount || gameState !== GameState.BETTING) return;
    soundManager.play('bet');
    updateBalance(-betAmount);
    setPlayers(prev => {
      const others = prev.filter(p => p.id !== user.id);
      return [...others, {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        betAmount: betAmount,
        selectedColor: betColor,
        status: PlayerStatus.CONFIRMED,
        isBot: false,
        rank: user.rank
      }];
    });
  };

  const onSpinEnd = async () => {
    if (!isMounted.current) return;
    const result = WHEEL_SEGMENTS[targetIndex];
    setGameState(GameState.RESULT);
    
    const userPlayer = players.find(p => p.id === user.id);
    if (userPlayer && userPlayer.selectedColor === result.color) {
      const mult = result.color === 'green' ? 14 : 2;
      const payout = userPlayer.betAmount * mult;
      updateBalance(payout);
      onWin(roomId);
      soundManager.play('win');
      const hype = await generateGameCommentary(user.username, payout, players.length);
      addChatMessage('ORACLE', hype, true);
    } else if (userPlayer) {
      soundManager.play('lose');
    }

    setTimeout(() => {
      if (!isMounted.current) return;
      setGameState(GameState.WAITING);
      setBetColor(null);
      setPlayers(prev => prev.map(p => ({ ...p, status: PlayerStatus.IDLE, betAmount: 0 })));
    }, 6000);
  };

  const addChatMessage = (sender: string, text: string, isAi = false) => {
    setChatHistory(prev => [...prev, {
      id: Math.random().toString(36),
      sender,
      text,
      isAi,
      timestamp: new Date()
    }]);
    if (!isAi) soundManager.play('message');
  };

  const handleSendMessage = async (msg: string) => {
    addChatMessage('YOU', msg);
    const reply = await chatWithAiOracle(msg, chatHistory.slice(-5).map(m => m.text));
    if (isMounted.current) addChatMessage('ORACLE', reply, true);
  };

  const handleExitToLobby = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.play('beep');
    if (onLeaveGame) onLeaveGame(roomId);
    navigate('/');
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      <div className="fixed top-4 left-4 z-[9999] pointer-events-auto">
        <button 
          onClick={handleExitToLobby}
          className="group flex items-center gap-2 bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white px-5 py-2 font-arcade text-[10px] tracking-[0.2em] transition-all rounded shadow-lg active:scale-95 cursor-pointer"
        >
          <span className="text-sm">←</span> EXIT_LOBBY
        </button>
      </div>

      {/* Ranked Player Sidebar */}
      <div className="w-full lg:w-72 bg-vegas-panel border-r border-white/5 flex flex-col z-20 pt-16 lg:pt-0">
        <div className="p-4 border-b border-white/5 bg-black/40">
          <h2 className="font-arcade text-[9px] text-neon-cyan tracking-widest uppercase opacity-70">SYST_ACTIVE_NODES</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]"></span>
            <span className="text-[10px] font-mono text-slate-400">{players.length} CONNECTED</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {players.map(p => {
            const rConfig = RANK_CONFIG[p.rank || UserRank.ROOKIE];
            return (
              <div key={p.id} 
                   className={`flex items-center gap-3 p-2 rounded border border-transparent transition-all duration-300 ${
                     p.id === user.id ? 'bg-white/10 border-white/20' : 'bg-black/20 hover:bg-white/5'
                   }`}
              >
                <PlayerAvatar player={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white truncate uppercase tracking-tighter flex items-center justify-between">
                    <span>{p.username}</span>
                    {p.id === user.id && <span className="text-[7px] text-neon-cyan border border-neon-cyan/50 px-1 rounded ml-1 animate-pulse">YOU</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-arcade px-1 border-b uppercase opacity-80" style={{ color: rConfig.color, borderColor: rConfig.color + '44' }}>
                      {rConfig.label}
                    </span>
                    {p.betAmount > 0 && (
                      <span className="text-neon-green text-[9px] font-mono font-black">
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

      <div className="flex-1 flex flex-col relative pt-20 lg:pt-0">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 text-center">
          <div className="bg-black/90 border border-white/10 px-12 py-5 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] min-w-[240px]">
             <div className="text-slate-500 text-[9px] font-arcade tracking-[0.4em] uppercase mb-1">
               {gameState === GameState.RESULT ? 'FINAL_STATE' : gameState}
             </div>
             <div className={`text-5xl font-arcade tracking-tighter ${timer < 5 && gameState === GameState.BETTING ? 'text-neon-pink animate-flicker' : 'text-white'}`}>
               {gameState === GameState.SPINNING ? 'SPINNING' : timer}
             </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <SpinWheel 
            spinning={gameState === GameState.SPINNING} 
            targetIndex={targetIndex} 
            onSpinEnd={onSpinEnd} 
            segments={WHEEL_SEGMENTS}
          />
        </div>

        {/* Action Console with Rank Wagering */}
        <div className="p-6 bg-vegas-panel/90 border-t border-white/5 z-20 backdrop-blur-md">
          <div className="max-w-xl mx-auto space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {(['red', 'black', 'green'] as const).map(color => (
                <div key={color} className="flex flex-col gap-2.5">
                  <button
                    onClick={() => { soundManager.play('click'); setBetColor(color); }}
                    disabled={gameState !== GameState.BETTING}
                    className={`relative overflow-hidden py-4 border transition-all ${
                      color === 'red' ? 'border-red-600/40 text-red-500 hover:bg-red-600/10' :
                      color === 'black' ? 'border-slate-700 text-slate-400 hover:bg-slate-700/10' :
                      'border-green-600/40 text-green-500 hover:bg-green-600/10'
                    } ${betColor === color ? 'bg-white/5 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105' : 'opacity-60'} disabled:opacity-20 h-14 flex items-center justify-center rounded-sm`}
                  >
                    <span className="font-arcade text-[11px] tracking-widest">{color.toUpperCase()}</span>
                    {color === 'green' && <span className="absolute top-0 right-1 text-[7px] text-white opacity-40">x14</span>}
                  </button>
                  
                  {/* Wager Demographics - Shows Ranks of current bettors */}
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] justify-center bg-black/40 rounded-sm p-1.5 border border-white/5 shadow-inner">
                    {colorWagers[color].length > 0 ? (
                      colorWagers[color].slice(0, 8).map(p => (
                        <PlayerAvatar key={p.id} player={p} size="xs" />
                      ))
                    ) : (
                      <span className="text-[7px] text-slate-800 font-arcade flex items-center tracking-tighter uppercase opacity-30">VOID</span>
                    )}
                    {colorWagers[color].length > 8 && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[8px] font-bold text-slate-400 shadow-lg">
                        +{colorWagers[color].length - 8}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex bg-black/60 border border-white/10 rounded-sm overflow-hidden shadow-inner">
                <button 
                  onClick={() => { soundManager.play('click'); setBetAmount(a => Math.max(10, a - 50)); }} 
                  className="px-6 hover:bg-white/5 text-slate-500 font-bold transition-colors"
                >
                  -
                </button>
                <div className="flex-1 flex items-center justify-center font-arcade text-neon-green text-2xl tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
                  ${betAmount}
                </div>
                <button 
                  onClick={() => { soundManager.play('click'); setBetAmount(a => a + 50); }} 
                  className="px-6 hover:bg-white/5 text-slate-500 font-bold transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={handlePlaceBet}
                disabled={!betColor || gameState !== GameState.BETTING}
                className={`flex-[1.4] py-4 font-arcade text-[11px] tracking-[0.3em] transition-all relative overflow-hidden group rounded-sm shadow-xl ${
                  !betColor || gameState !== GameState.BETTING
                  ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5'
                  : 'bg-white text-black hover:bg-neon-gold hover:text-black font-black'
                }`}
              >
                <span className="relative z-10">COMMIT_WAGER</span>
                <div className="absolute inset-0 bg-neon-gold translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 border-l border-white/5 z-20 bg-black/95">
        <AiChat chatHistory={chatHistory} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default GameRoom;