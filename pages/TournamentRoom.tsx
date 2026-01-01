import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpinWheel from '../components/SpinWheel.tsx';
import TournamentWinnerAnimation from '../components/TournamentWinnerAnimation.tsx';
import TournamentBracket from '../components/TournamentBracket.tsx';
import RankUpModal from '../components/RankUpModal.tsx';
import { User, Player, UserRank } from '../types.ts';
import { COLORS, COLOR_HEX } from '../constants.ts';
import { soundManager } from '../services/soundManager.ts';

interface TournamentRoomProps {
  user: User;
  updateBalance: (amount: number) => void;
  onLeaveGame?: (roomId: string) => void;
}

const ENTRY_FEE = 10;
const TOTAL_PLAYERS = 100;
const GROUPS_COUNT = 10;
const PLAYERS_PER_GROUP = 10;

// 10 segments - one for each group
const TOURNAMENT_SEGMENTS = COLORS.slice(0, 10).map((color, idx) => ({
  label: `G${idx + 1}`,
  color,
  value: idx
}));

const TournamentRoom: React.FC<TournamentRoomProps> = ({ user, updateBalance, onLeaveGame }) => {
  const navigate = useNavigate();
  const mounted = useRef(true);

  // Phase: BROWSE -> BET_PROMPT -> COLOR_ASSIGN -> ROOM_ASSIGN -> BRACKET_VIEW -> GROUPS -> [WINNER_COUNTDOWN -> FINAL_COLOR -> FINAL_SPIN_COUNTDOWN] -> FINAL -> FINAL_RESULT -> PLAY_AGAIN
  const [phase, setPhase] = useState<'BROWSE' | 'BET_PROMPT' | 'COLOR_ASSIGN' | 'ROOM_ASSIGN' | 'BRACKET_VIEW' | 'GROUPS' | 'WINNER_COUNTDOWN' | 'FINAL_COLOR' | 'FINAL_SPIN_COUNTDOWN' | 'FINAL' | 'FINAL_RESULT' | 'PLAY_AGAIN' | 'ELIM_LOSE'>('BROWSE');
  
  // Tournament data
  const [groups, setGroups] = useState<Array<{ groupNumber: number; players: Player[]; totalPot: number }>>([]);
  const [userGroup, setUserGroup] = useState<number>(0);
  const [userRoom, setUserRoom] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('');
  
  // Spinning state
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groupWinners, setGroupWinners] = useState<Player[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [announceIndex, setAnnounceIndex] = useState(0);
  const [displayedWinners, setDisplayedWinners] = useState<Player[]>([]);
  const [loserCountdown, setLoserCountdown] = useState<number | null>(null);
  const [winnerCountdown, setWinnerCountdown] = useState<number | null>(null);
  const [showWinnerProceed, setShowWinnerProceed] = useState(false);
  const [finalColorCountdown, setFinalColorCountdown] = useState<number | null>(null);
  
  // Final round
  const [finalTarget, setFinalTarget] = useState(0);
  const [finalSpinning, setFinalSpinning] = useState(false);
  const [grandWinner, setGrandWinner] = useState<Player | null>(null);
  
  // Bracket view countdown
  const [bracketCountdown, setBracketCountdown] = useState(10);
  
  // UI state
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; msg: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  // Rank-up state
  const [showRankUp, setShowRankUp] = useState(false);
  const [previousRank, setPreviousRank] = useState<UserRank>(user.rank);
  
  // Calculate total pot (100 players * entry fee)
  const totalPot = TOTAL_PLAYERS * ENTRY_FEE;

  // Initialize groups and assign user on mount
  useEffect(() => {
    if (groups.length === 0 && mounted.current) {
      const assignedGroup = Math.floor(Math.random() * GROUPS_COUNT) + 1;
      const assignedPositionInGroup = Math.floor(Math.random() * PLAYERS_PER_GROUP);
      const assignedColor = COLORS[assignedPositionInGroup % COLORS.length];
      const assignedRoom = `ROOM-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
      
      setUserGroup(assignedGroup);
      setUserColor(assignedColor);
      setUserRoom(assignedRoom);

      const newGroups = Array.from({ length: GROUPS_COUNT }).map((_, gi) => {
        const groupNumber = gi + 1;
        const players: Player[] = Array.from({ length: PLAYERS_PER_GROUP }).map((__, pi) => {
          if (groupNumber === assignedGroup && pi === assignedPositionInGroup) {
            return {
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              betAmount: ENTRY_FEE,
              selectedColor: assignedColor,
              assignedColor: assignedColor,
              status: 'CONFIRMED' as any,
              isBot: false
            } as Player;
          }

          const randomNames = ['NeonGhost', 'CyberVortex', 'PixelKing', 'ShadowEcho', 'VortexRider', 'ThunderStrike', 'NovaBlast', 'SilentRunner', 'IceReaper', 'PhantomEye', 'CrimsonFury', 'VoidWalker', 'TitanForce', 'SolarFlare', 'DarkNinja', 'ElectroMage', 'MysticShade', 'FrostByte', 'LunarEclipse', 'InfernoKnight'];
          const botName = randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 999);
          // Assign one color per player (pi=0 gets COLORS[0], pi=1 gets COLORS[1], etc.)
          // This ensures each group has exactly one player of each color
          const playerColor = COLORS[pi % COLORS.length];
          return {
            id: `bot-${groupNumber}-${pi}`,
            username: botName,
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${botName}`,
            betAmount: ENTRY_FEE,
            selectedColor: playerColor,
            assignedColor: playerColor,
            status: 'CONFIRMED' as any,
            isBot: true
          } as Player;
        });

        return { groupNumber, players, totalPot: ENTRY_FEE * PLAYERS_PER_GROUP };
      });

      setGroups(newGroups);
    }

    return () => { mounted.current = false; };
  }, [user]);

  // Countdown timer for spin
  useEffect(() => {
    if (!countdownActive || countdown === 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

  // Start spinning when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && countdownActive) {
      setCountdownActive(false);
      if (phase === 'GROUPS') startGroupSpin();
      if (phase === 'FINAL_PREP') {
        // start the final spin
        setPhase('FINAL');
        const finalT = Math.floor(Math.random() * Math.max(1, groupWinners.length));
        setFinalTarget(finalT);
        setFinalSpinning(true);
      }
      if (phase === 'FINAL') {
        // auto-start the final spin
        setFinalSpinning(true);
      }
    }
  }, [countdown, countdownActive, phase]);

  const startBetFlow = () => {
    setPhase('BET_PROMPT');
  };

  const confirmBet = () => {
    if (user.balance < ENTRY_FEE) {
      alert('Insufficient balance. Need $' + ENTRY_FEE);
      return;
    }
    setPhase('COLOR_ASSIGN');
  };

  const proceedFromColor = () => {
    setPhase('ROOM_ASSIGN');
  };

  const joinGameroom = () => {
    updateBalance(-ENTRY_FEE);
    setBracketCountdown(10);
    setPhase('BRACKET_VIEW');
    setTimeout(() => {
      setPhase('GROUPS');
      setCountdown(3);
      setCountdownActive(true);
    }, 10500);
  };

  const startGroupSpin = () => {
    // Single simultaneous spin for all groups once every player has placed their bet
    if (groups.length === 0) return;
    const t = Math.floor(Math.random() * TOURNAMENT_SEGMENTS.length);
    setTargetIndex(t);
    setSpinning(true);
  };

  const onGroupSpinEnd = () => {
    // Only players whose assigned color matches the winning wheel color advance
    setSpinning(false);
    
    const winningColor = TOURNAMENT_SEGMENTS[targetIndex].color;
    
    // For each group, select a player only if their color matches the winning color
    const winners = groups.map((g) => {
      const playersWithWinningColor = g.players.filter(p => p.assignedColor === winningColor);
      if (playersWithWinningColor.length > 0) {
        // Pick one random player from this group with the winning color
        return playersWithWinningColor[Math.floor(Math.random() * playersWithWinningColor.length)];
      }
      // No one in this group has the winning color - no winner from this group
      return null as any;
    }).filter(w => w !== null);

    setGroupWinners(winners);
    setDisplayedWinners(winners);
    setAnnouncing(true);
    soundManager.play('win');

    const userIsWinner = winners.some(w => w.id === user.id);
    if (userIsWinner) {
      // show winners animation and start a 5s countdown before final
      setWinnerCountdown(5);
    } else {
      // show winners overlay but start a 5s countdown for losers then route to ELIM_LOSE
      // rely on a React effect to drive the countdown reliably
      setLoserCountdown(5);
    }
  };

  // Drive the loser countdown using a React effect (ensures proper cleanup and updates)
  useEffect(() => {
    if (loserCountdown === null) return;
    if (loserCountdown <= 0) {
      setAnnouncing(false);
      setLoserCountdown(null);
      setPhase('GROUP_RESULT');
      return;
    }
    const t = setTimeout(() => setLoserCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [loserCountdown]);

  // Drive the winner countdown - when it hits 0, show proceed button
  useEffect(() => {
    if (winnerCountdown === null) return;
    if (winnerCountdown <= 0) {
      setWinnerCountdown(null);
      setShowWinnerProceed(true);
      return;
    }
    const t = setTimeout(() => setWinnerCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [winnerCountdown]);

  // Drive the final color countdown - when it hits 0, move to FINAL with 3s countdown before auto-spin
  useEffect(() => {
    if (finalColorCountdown === null) return;
    if (finalColorCountdown <= 0) {
      setFinalColorCountdown(null);
      setPhase('FINAL');
      setCountdown(3);
      setCountdownActive(true);
      const finalT = Math.floor(Math.random() * groupWinners.length);
      setFinalTarget(finalT);
      return;
    }
    const t = setTimeout(() => setFinalColorCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [finalColorCountdown]);

  // Bracket view countdown
  useEffect(() => {
    if (phase !== 'BRACKET_VIEW') return;
    if (bracketCountdown <= 0) return;
    const timer = setTimeout(() => setBracketCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [bracketCountdown, phase]);

  // Auto-advance winners from GROUP_RESULT
  useEffect(() => {
    if (phase !== 'GROUP_RESULT') return;
    const userIsWinner = groupWinners.some(w => w.id === user.id);
    
    // Winners auto-advance after 3 seconds
    if (userIsWinner) {
      const timer = setTimeout(() => {
        setAnnouncing(false);
        const reassigned = groupWinners.map((w, idx) => ({ ...w, assignedColor: COLORS[idx % COLORS.length] }));
        setGroupWinners(reassigned);
        setPhase('FINAL_COLOR');
        setFinalColorCountdown(5);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Losers auto-advance after 4 seconds to ELIM_LOSE
      const timer = setTimeout(() => {
        setPhase('ELIM_LOSE');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, groupWinners]);

  const startFinalSpin = () => {
    if (groupWinners.length === 0) return;
    
    // Check if user is in group winners
    const userIsWinner = groupWinners.some(w => w.id === user.id);
    if (!userIsWinner) {
      setPhase('GROUP_RESULT');
      return;
    }

    const finalT = Math.floor(Math.random() * groupWinners.length);
    setFinalTarget(finalT);
    setCountdown(3);
    setCountdownActive(true);
    setPhase('FINAL');
  };

  const onFinalSpinEnd = () => {
    setFinalSpinning(false);
    // Select random winner from finalists based on final target
    const winner = groupWinners[finalTarget] || groupWinners[0];
    setGrandWinner(winner);
    if (winner.id === user.id) {
      updateBalance(totalPot);
      soundManager.play('win'); // Winner announcement sound (same as group winners)
      
      // Check for rank up (5 wins = 1 rank)
      const newXp = user.rankXp + 1;
      if (newXp % 5 === 0) {
        // Rank up!
        const rankProgression = [UserRank.ROOKIE, UserRank.PRO, UserRank.MASTER, UserRank.LEGEND];
        const currentRankIndex = rankProgression.indexOf(user.rank);
        if (currentRankIndex < rankProgression.length - 1) {
          const newRank = rankProgression[currentRankIndex + 1];
          setPreviousRank(user.rank);
          setShowRankUp(true);
          // Update user rank (this would normally be saved to backend)
          Object.assign(user, { rank: newRank, rankXp: newXp });
        }
      } else {
        // Update XP without rank up
        Object.assign(user, { rankXp: newXp });
      }
    }
    setPhase('FINAL_RESULT');
  };

  const exitToLobby = () => {
    soundManager.play('click');
    if (onLeaveGame) onLeaveGame('tournament');
    else navigate('/');
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 to-black text-white flex flex-col overflow-hidden">
      {/* Main Header - Always visible except on BROWSE */}
      {phase !== 'BROWSE' && (
        <div className="bg-gradient-to-r from-neon-gold/20 via-black to-neon-pink/20 border-b-2 border-neon-gold/60 shadow-[0_0_30px_rgba(255,215,0,0.4)] px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0">
            <div className="text-2xl sm:text-3xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-gold via-neon-pink to-neon-cyan whitespace-nowrap animate-pulse drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] font-black tracking-wider">🏆 GRAND PRIX 🏆</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] sm:text-xs text-slate-400">Your Balance</div>
            <div className="text-neon-green font-arcade text-base sm:text-lg">${user.balance.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {/* GROUPS Phase: 10 wheels spinning (invisible), only player's room wheel visible */}
      {phase === 'GROUPS' && (
        <div className={`fixed inset-0 z-30 flex items-center justify-center pointer-events-none px-2 sm:px-0 pt-16 sm:pt-24`}>
          <div className="pointer-events-none scale-75 sm:scale-90 md:scale-100 origin-center">
            {/* Render all 10 group wheels, but only show the player's room wheel */}
            {TOURNAMENT_SEGMENTS.map((segment, groupIdx) => (
              <div
                key={`wheel-${groupIdx}`}
                className={groupIdx === (userGroup - 1) ? 'block' : 'hidden'}
              >
                <SpinWheel
                  segments={TOURNAMENT_SEGMENTS}
                  spinning={spinning}
                  targetIndex={targetIndex}
                  onSpinEnd={onGroupSpinEnd}
                  themeColor="neon-cyan"
                  playerColor={userColor}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINAL Phase: Shared wheel showing all 10 finalists */}
      {phase === 'FINAL' && (
        <div className={`fixed inset-0 z-30 flex items-center justify-center pointer-events-none px-2 sm:px-0 pt-0`}>
          <div className="pointer-events-none scale-75 sm:scale-90 md:scale-100 origin-center">
            <SpinWheel
              segments={groupWinners.map((w, i) => ({ label: w.username.slice(0,2).toUpperCase(), color: w.assignedColor, value: i }))}
              spinning={finalSpinning}
              targetIndex={finalTarget}
              onSpinEnd={onFinalSpinEnd}
              themeColor="neon-gold"
              playerColor={userColor}
            />
          </div>
        </div>
      )}

      {/* FINAL Phase - Buttons at bottom on mobile - Vegas Casino style */}
      {phase === 'FINAL' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-3 py-3 bg-gradient-to-t from-black via-black/90 to-transparent border-t-2 border-neon-cyan/50 shadow-[0_-10px_30px_rgba(0,255,255,0.2)] pointer-events-auto">
          <div className="grid grid-cols-3 gap-2 w-full">
            <button 
              onClick={() => { soundManager.play('click'); setShowGroupsPanel(true); }}
              className="px-4 py-3 text-neon-cyan font-arcade text-sm border-2 border-neon-cyan hover:bg-neon-cyan hover:text-black transition font-black tracking-wider shadow-[0_0_15px_rgba(0,255,255,0.5)] active:scale-95">
              FINALISTS
            </button>
            <button 
              onClick={() => { soundManager.play('click'); setShowStatusPanel(true); }}
              className="px-4 py-3 text-neon-pink font-arcade text-sm border border-neon-pink hover:bg-neon-pink hover:text-black transition font-black tracking-wider shadow-[0_0_15px_rgba(255,0,128,0.5)] active:scale-95">
              STATUS
            </button>
            <button 
              onClick={() => { soundManager.play('click'); setShowChatPanel(true); }}
              className="px-4 py-3 text-neon-green font-arcade text-sm border border-neon-green hover:bg-neon-green hover:text-black transition font-black tracking-wider shadow-[0_0_15px_rgba(0,255,0,0.5)] active:scale-95">
              CHATS
            </button>
          </div>
        </div>
      )}

      {/* Floating cards removed */}

      {/* Trophy announcement removed */}

      {/* Show custom tournament winner animation when winners are announced (during GROUP_RESULT for winners) */}
      {announcing && displayedWinners.length > 0 && phase === 'GROUP_RESULT' && displayedWinners.some(dw => dw.id === user.id) && (
        <TournamentWinnerAnimation
          isUserWinner={true}
          winnerCount={displayedWinners.length}
        />
      )}

      {/* Show winner countdown during announcement phase - Vegas style with clear visibility */}
      {announcing && displayedWinners.some(dw => dw.id === user.id) && winnerCountdown !== null && phase === 'GROUPS' && (
        <div className="fixed inset-0 z-[350] pointer-events-none flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center px-4">
            {/* Large Countdown Timer */}
            <div className="mb-8">
              <div className="text-6xl sm:text-8xl font-arcade font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-gold via-neon-pink to-neon-cyan animate-pulse drop-shadow-[0_0_50px_rgba(255,215,0,0.8)]">
                {winnerCountdown}
              </div>
            </div>
            
            {/* Main Announcement Text */}
            <div className="text-2xl sm:text-4xl font-arcade font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-green mb-4 tracking-wider drop-shadow-[0_0_30px_rgba(0,255,255,0.6)]">
              🎊 ADVANCING TO FINALS 🎊
            </div>
            
            {/* Finalists Grid - Clear and Visible */}
            <div className="max-w-2xl bg-black/60 border border-neon-pink/50 p-4 sm:p-6 shadow-[0_0_40px_rgba(255,0,128,0.3)]">
              <div className="text-sm sm:text-base font-arcade text-neon-pink mb-3">TOP 10 WINNERS</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {displayedWinners.map((w, idx) => (
                  <div 
                    key={w.id}
                    className={`p-2 border transition ${
                      w.id === user.id 
                        ? 'bg-neon-pink/20 border-neon-pink shadow-[0_0_20px_rgba(255,0,128,0.4)]' 
                        : 'bg-black/40 border-neon-pink/30 hover:border-neon-pink'
                    }`}
                  >
                    <img src={w.avatar} alt={w.username} className="w-8 h-8 rounded-full mx-auto mb-1 border border-neon-pink/50" />
                    <div className="text-[10px] font-arcade text-neon-pink truncate">{w.username.substring(0, 8)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show winner proceed button when countdown ends */}
      {showWinnerProceed && phase === 'GROUPS' && (
        <div className="fixed inset-0 z-[350] pointer-events-auto flex items-center justify-center p-4">
          <div className="bg-black/90 border border-neon-pink p-6 sm:p-8 text-center max-w-sm w-full">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎊</div>
            <div className="text-xl sm:text-2xl font-arcade text-neon-pink mb-2">YOU'RE IN!</div>
            <div className="text-xs sm:text-sm text-slate-300 mb-4 sm:mb-6">You've advanced to the final round with 9 other winners.</div>
            <button
              onClick={() => {
                setShowWinnerProceed(false);
                setAnnouncing(false);
                const reassigned = groupWinners.map((w, idx) => ({ ...w, assignedColor: COLORS[idx % COLORS.length] }));
                setGroupWinners(reassigned);
                setPhase('FINAL_COLOR');
                setFinalColorCountdown(5);
              }}
              className="px-6 sm:px-8 py-2 sm:py-3 text-neon-pink font-arcade text-base sm:text-lg hover:bg-neon-pink hover:text-black transition w-full border border-neon-pink"
            >
              Proceed to Final
            </button>
          </div>
        </div>
      )}

      {/* For final-stage celebrations, show custom tournament animation for finals */}
      {announcing && displayedWinners.length > 0 && (phase === 'FINAL_PREP' || phase === 'FINAL' || phase === 'FINAL_RESULT') && (
        <TournamentWinnerAnimation
          isUserWinner={displayedWinners.some(dw => dw.id === user.id)}
          winnerCount={displayedWinners.length}
        />
      )}
      <div className="flex-1 flex overflow-hidden">
        {/* BROWSE - Initial Tournament Selection */}
        {phase === 'BROWSE' && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="text-center w-full max-w-md">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">🎰</div>
              <div className="text-4xl sm:text-5xl font-arcade text-neon-pink mb-2 drop-shadow-[0_0_10px_rgba(255,0,128,0.8)] animate-pulse">GRAND PRIX</div>
              <div className="text-neon-cyan text-base sm:text-lg mb-4 sm:mb-6 font-arcade tracking-wider drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">100 Players • 10 Groups • Winner Takes All</div>
              <div className="bg-gradient-to-b from-neon-pink/10 to-neon-pink/5 border border-neon-pink p-4 sm:p-6 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(255,0,128,0.3)]">
                <div className="text-xs sm:text-sm text-neon-cyan space-y-2 font-arcade tracking-wider">
                  <div className="text-neon-pink">✓ 10 groups of 10 players</div>
                  <div className="text-neon-green">✓ Win your group → Join Final Round</div>
                  <div className="text-neon-pink">✓ Grand Champion wins ${totalPot.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => { soundManager.play('click'); window.location.hash = '/#/dashboard'; }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-neon-pink text-neon-pink font-arcade text-sm sm:text-base hover:bg-neon-pink hover:text-black transition-all shadow-lg"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { soundManager.play('click'); startBetFlow(); }}
                  className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 text-neon-green font-arcade text-sm sm:text-base hover:bg-neon-green hover:text-black transition-all font-black shadow-[0_0_20px_rgba(0,255,0,0.5)] hover:shadow-[0_0_30px_rgba(0,255,0,0.8)] border border-neon-green"
                >
                  JOIN TOURNAMENT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BET_PROMPT - Place Bet */}
        {phase === 'BET_PROMPT' && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="text-center max-w-sm w-full">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">💰</div>
              <div className="text-2xl sm:text-3xl font-arcade text-neon-pink mb-4 drop-shadow-[0_0_10px_rgba(255,0,128,0.8)]">Place Your Bet</div>
              <div className="bg-gradient-to-b from-neon-pink/10 to-neon-pink/5 border border-neon-pink p-4 sm:p-6 mb-4 sm:mb-6 shadow-[0_0_20px_rgba(255,0,128,0.3)]">
                <div className="text-neon-pink mb-2 text-sm font-arcade tracking-wider uppercase">Entry Fee</div>
                <div className="text-4xl sm:text-5xl font-arcade text-neon-cyan mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"><span className="text-neon-pink">$</span>{ENTRY_FEE}</div>
                <div className="text-xs text-neon-pink mb-2 font-arcade">
                  Current Balance: <span className="text-neon-green drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">${user.balance}</span>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 justify-center">
                <button
                  onClick={() => { soundManager.play('click'); setPhase('BROWSE'); }}
                  className="px-6 sm:px-8 py-2.5 sm:py-3.5 font-arcade text-xs sm:text-sm tracking-wider transition-all border border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black shadow-lg whitespace-nowrap font-black"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { soundManager.play('click'); confirmBet(); }}
                  disabled={user.balance < ENTRY_FEE}
                  className={`px-6 sm:px-8 py-2.5 sm:py-3.5 font-arcade text-xs sm:text-sm tracking-wider transition-all border-2 shadow-lg font-black whitespace-nowrap ${
                    user.balance < ENTRY_FEE
                      ? 'border-slate-600 text-slate-600 cursor-not-allowed'
                      : 'border-neon-green text-neon-green hover:bg-neon-green hover:text-black shadow-[0_0_15px_rgba(0,255,0,0.6)]'
                  }`}
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COLOR_ASSIGN - Color Assignment */}
        {phase === 'COLOR_ASSIGN' && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="text-center max-w-sm w-full">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎨</div>
              <div className="text-xl sm:text-2xl font-arcade text-neon-pink mb-4 sm:mb-6">Color Assigned</div>
              <div className="bg-slate-800/50 border border-neon-pink/30 p-4 sm:p-8 mb-4 sm:mb-6">
                <div className="text-slate-400 mb-4 text-sm">Your Tournament Color</div>
                <div className="flex justify-center gap-4 items-center mb-4 sm:mb-6">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-white shadow-lg"
                    style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}
                  />
                  <div className="text-2xl sm:text-3xl font-arcade capitalize">{userColor}</div>
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 bg-neon-green/20 border border-neon-green/30 p-3">
                  <div className="text-neon-green font-arcade mb-1">✓ Bet Locked: ${ENTRY_FEE}</div>
                  Your color is fixed for this tournament
                </div>
              </div>
              <button
                onClick={() => { soundManager.play('click'); proceedFromColor(); }}
                className="w-full px-6 sm:px-8 py-3 sm:py-4 text-neon-pink font-arcade text-lg sm:text-xl font-bold hover:bg-neon-pink hover:text-black transition shadow-lg border border-neon-pink"
              >
                Proceed
              </button>
            </div>
          </div>
        )}

        {/* ROOM_ASSIGN - Room Assignment */}
        {phase === 'ROOM_ASSIGN' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-4">🚪</div>
              <div className="text-2xl font-arcade text-neon-pink mb-6">Room Assigned</div>
              <div className="bg-slate-800/50 border border-neon-pink/30 p-8 mb-6">
                <div className="mb-6">
                  <div className="text-slate-400 mb-2">Your Group</div>
                  <div className="text-4xl font-arcade text-neon-cyan mb-4">GROUP {userGroup}</div>
                </div>
                <div className="mb-6">
                  <div className="text-slate-400 mb-2">Room Number</div>
                  <div className="text-3xl font-arcade text-neon-pink font-bold tracking-widest">{userRoom}</div>
                </div>
                <div className="text-xs text-slate-400 p-3">
                  Waiting for other players...
                </div>
              </div>
              <button
                onClick={() => { soundManager.play('click'); joinGameroom(); }}
                className="w-full px-6 py-3 text-neon-pink font-arcade text-lg hover:bg-neon-pink hover:text-black transition font-bold border border-neon-pink"
              >
                Join Gameroom
              </button>
            </div>
          </div>
        )}

        {/* BRACKET_VIEW - Tournament Bracket with Countdown */}
        {phase === 'BRACKET_VIEW' && (
          <div className="flex-1 flex items-center justify-center bg-black/40">
            <TournamentBracket 
              countdown={bracketCountdown} 
              groupNumber={userGroup}
              playersInGroup={PLAYERS_PER_GROUP}
            />
          </div>
        )}

        {/* LOBBY - Waiting Room */}
        {phase === 'LOBBY' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-bounce">⏳</div>
              <div className="text-2xl font-arcade text-neon-cyan mb-2">Tournament Starting</div>
              <div className="text-neon-green font-arcade">Room {userRoom}</div>
            </div>
          </div>
        )}

        {/* GROUPS - Tournament Spinning */}
        {phase === 'GROUPS' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-2 lg:gap-4 p-2 lg:p-4">
            {/* Left: Groups Panel - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex w-80 bg-black/40 border border-neon-cyan/30 rounded overflow-y-auto flex-col flex-shrink-0">
              <div className="sticky top-0 bg-black/80 border-b border-neon-cyan/30 p-3">
                <div className="text-neon-cyan font-arcade text-sm">📊 GROUPS</div>
                <div className="text-neon-green text-xs mt-1">Spinning: Group {currentGroupIndex + 1}/10</div>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                {groups.map((group) => (
                  <div
                    key={group.groupNumber}
                    onClick={() => setExpandedGroup(expandedGroup === group.groupNumber ? null : group.groupNumber)}
                    className={`mb-2 rounded border cursor-pointer transition ${
                      group.groupNumber === userGroup
                        ? 'bg-neon-gold/20 border-neon-gold shadow-lg shadow-neon-gold/50'
                        : 'bg-slate-800/30 border-slate-600/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="p-2 flex items-center justify-between">
                      <div className="font-arcade text-sm">
                        {group.groupNumber === userGroup && '👤 '}GROUP {group.groupNumber}
                      </div>
                      <span className="text-xs text-slate-400">{expandedGroup === group.groupNumber ? '▼' : '▶'}</span>
                    </div>
                    {expandedGroup === group.groupNumber && (
                      <div className="border-t border-slate-600/30 p-2 bg-black/40">
                        {group.players.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center gap-2 p-1.5 mb-1 rounded text-[11px] ${
                              p.id === user.id ? 'bg-neon-gold/20 border border-neon-gold' : 'bg-slate-700/20'
                            }`}
                          >
                            <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" />
                            <span className="flex-1 truncate font-arcade">{p.username}</span>
                            {p.id === user.id && <span className="text-neon-cyan">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Wheel + Mobile Controls */}
            <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-2 py-2 gap-3">
              {/* Status counters area */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0 min-h-[20px]">
                {countdownActive && countdown > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-arcade text-neon-pink animate-pulse">{countdown}</div>
                  </div>
                )}
                
                {spinning && (
                  <div className="text-[9px] sm:text-xs text-neon-cyan font-arcade font-bold animate-pulse">Spinning... Group {currentGroupIndex + 1}/10</div>
                )}
              </div>

              {/* Responsive Wheel Container - Compact for mobile */}
              <div className="flex items-center justify-center w-full max-w-sm h-56 flex-shrink-0">
                <div className="w-full h-full" />
              </div>

              {/* Mobile Control Buttons - Below wheel */}
              <div className="w-full flex gap-2 sm:gap-3 justify-center flex-shrink-0">
                <button
                  onClick={() => { soundManager.play('click'); setShowGroupsPanel(true); }}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 font-arcade text-xs sm:text-sm tracking-wider transition-all border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black whitespace-nowrap font-black"
                >
                  GROUPS
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setShowStatusPanel(true); }}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 font-arcade text-xs sm:text-sm tracking-wider transition-all border border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black whitespace-nowrap font-black"
                >
                  STATUS
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setShowChatPanel(true); }}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 font-arcade text-xs sm:text-sm tracking-wider transition-all border border-neon-green text-neon-green hover:bg-neon-green hover:text-black whitespace-nowrap font-black"
                >
                  CHATS
                </button>
              </div>
            </div>

            {/* Desktop Layout - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 px-2 sm:px-6">
              {countdownActive && countdown > 0 && (
                <div className="text-center mb-2 sm:mb-4">
                  <div className="text-4xl sm:text-6xl font-arcade text-neon-pink animate-pulse">{countdown}</div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-2">Preparing to spin...</div>
                </div>
              )}
              
              {spinning && (
                <div className="text-sm sm:text-lg font-arcade text-neon-cyan mb-4 animate-pulse">Spinning... Group {currentGroupIndex + 1}/10</div>
              )}

              {/* Responsive Wheel Container */}
              <div className="flex items-center justify-center w-full max-w-2xl aspect-square">
                <div className="w-full h-full max-w-xl max-h-xl" />
              </div>
            </div>

            {/* Right: Chat + Status - Hidden on mobile, collapsible */}
            <div className="hidden lg:flex w-80 bg-black/40 border border-neon-pink/30 rounded flex-col flex-shrink-0">
              {/* Total Pot */}
              <div className="p-3 border-b border-neon-pink/30">
                <div className="text-neon-gold font-arcade text-[10px] mb-1">TOTAL POT</div>
                <div className="text-neon-green font-arcade">${totalPot.toLocaleString()}</div>
              </div>
              {/* User Status */}
              <div className="bg-black/80 border-b border-neon-pink/30 p-3">
                <div className="text-neon-pink font-arcade text-sm mb-2">🎮 YOUR STATUS</div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">Your Color:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-4 h-4 rounded-full border border-white"
                        style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}
                      />
                      <span className="font-arcade capitalize">{userColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Bet:</span>
                    <div className="font-arcade text-neon-green">${ENTRY_FEE} 🔒</div>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 border-b border-neon-pink/30 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-4">No messages</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i}>
                        <div className="text-neon-cyan font-arcade text-[10px]">{msg.user}</div>
                        <div className="text-slate-300 ml-2 text-[11px]">{msg.msg}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-neon-pink/30 p-2 flex gap-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    placeholder="Say..."
                    className="flex-1 bg-black/60 border border-neon-pink/30 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    className="border border-neon-pink text-neon-pink text-xs px-2 py-1 hover:bg-neon-pink hover:text-black"
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Winners */}
              <div className="bg-black/80 p-3 max-h-32 overflow-y-auto">
                <div className="text-neon-green font-arcade text-[10px] mb-2">WINNERS: {groupWinners.length}/10</div>
                <div className="space-y-1 text-[10px]">
                  {groupWinners.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-1">
                      <span className="text-neon-gold font-arcade">G{i + 1}:</span>
                      <span className={w.id === user.id ? 'text-neon-cyan' : 'text-slate-300'}>{w.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GROUPS MODAL - Mobile Only */}
            {showGroupsPanel && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-cyan/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-cyan/30 p-4 flex justify-between items-center">
                    <div className="text-neon-cyan font-arcade">📊 ALL GROUPS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowGroupsPanel(false); }}
                      className="text-neon-cyan hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.groupNumber}
                        onClick={() => setExpandedGroup(expandedGroup === group.groupNumber ? null : group.groupNumber)}
                        className={`rounded border cursor-pointer transition ${
                          group.groupNumber === userGroup
                            ? 'bg-neon-gold/20 border-neon-gold shadow-lg shadow-neon-gold/50'
                            : 'bg-slate-800/30 border-slate-600/30 hover:border-slate-500/50'
                        }`}
                      >
                        <div className="p-2.5 flex items-center justify-between">
                          <div className="font-arcade text-sm">
                            {group.groupNumber === userGroup && '👤 '}GROUP {group.groupNumber}
                          </div>
                          <span className="text-xs text-slate-400">{expandedGroup === group.groupNumber ? '▼' : '▶'}</span>
                        </div>
                        {expandedGroup === group.groupNumber && (
                          <div className="border-t border-slate-600/30 p-2 bg-black/40">
                            {group.players.map((p) => (
                              <div
                                key={p.id}
                                className={`flex items-center gap-2 p-1.5 mb-1 rounded text-[11px] ${
                                  p.id === user.id ? 'bg-neon-gold/20 border border-neon-gold' : 'bg-slate-700/20'
                                }`}
                              >
                                <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" />
                                <span className="flex-1 truncate font-arcade">{p.username}</span>
                                {p.id === user.id && <span className="text-neon-cyan">✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATUS MODAL - Mobile Only */}
            {showStatusPanel && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-pink/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-pink/30 p-4 flex justify-between items-center">
                    <div className="text-neon-pink font-arcade">🎮 YOUR STATUS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowStatusPanel(false); }}
                      className="text-neon-pink hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Total Pot */}
                    <div className="bg-black/60 border border-neon-gold/30 rounded p-3">
                      <div className="text-neon-gold font-arcade text-xs mb-2">TOTAL POT</div>
                      <div className="text-lg sm:text-xl font-arcade font-black text-neon-green">${totalPot.toLocaleString()}</div>
                    </div>
                    {/* Your Details */}
                    <div className="bg-black/60 border border-neon-pink/30 rounded p-3 space-y-2">
                      <div>
                        <span className="text-slate-400 text-xs">Your Color</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className="w-6 h-6 rounded border-2 border-white"
                            style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}
                          />
                          <span className="font-arcade text-sm capitalize">{userColor}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neon-pink/20">
                        <span className="text-slate-400 text-xs">Bet Amount</span>
                        <div className="font-arcade text-neon-green mt-1">${ENTRY_FEE} 🔒</div>
                      </div>
                      <div className="pt-2 border-t border-neon-pink/20">
                        <span className="text-slate-400 text-xs">Your Group</span>
                        <div className="font-arcade text-neon-cyan mt-1">GROUP {userGroup}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAT MODAL - Mobile Only */}
            {showChatPanel && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-green/30 rounded-t-lg max-h-[70vh] overflow-y-auto flex flex-col">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-green/30 p-4 flex justify-between items-center">
                    <div className="text-neon-green font-arcade">💬 CHAT</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowChatPanel(false); }}
                      className="text-neon-green hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">No messages yet</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className="text-xs">
                          <div className="text-neon-cyan font-arcade text-[10px]">{msg.user}</div>
                          <div className="text-slate-300 ml-2">{msg.msg}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-neon-green/30 p-3 bg-black/60 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      placeholder="Say..."
                      className="flex-1 bg-black/60 border border-neon-green/30 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          soundManager.play('click');
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      className="border border-neon-green text-neon-green px-2.5 py-1.5 hover:bg-neon-green hover:text-black text-xs font-bold transition"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GROUP_RESULT - Tournament Flow Visualization */}
        {phase === 'GROUP_RESULT' && (
          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl">
              {/* Tournament Flow Diagram */}
              <div className="space-y-6">
                {/* Stage 2: Group Winners */}
                <div className="bg-gradient-to-b from-slate-800/40 to-black/40 border border-neon-gold/50 rounded-lg p-6">
                  <div className="text-sm font-arcade text-slate-400 mb-4 uppercase tracking-wider">Stage 2: 10 Winners Selected</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                    {groupWinners.map((winner, idx) => (
                      <div 
                        key={winner.id} 
                        className={`rounded-lg p-3 transition ${
                          winner.id === user.id 
                            ? 'bg-gradient-to-b from-neon-gold/30 to-neon-cyan/30 border-2 border-neon-gold' 
                            : 'bg-black/60 border border-slate-600'
                        }`}
                      >
                        <img src={winner.avatar} alt={winner.username} className="w-10 h-10 rounded-full mx-auto mb-2" />
                        <div className={`text-[10px] font-arcade truncate ${winner.id === user.id ? 'text-neon-gold' : 'text-slate-400'}`}>
                          {winner.username.substring(0, 10)}
                        </div>
                        {winner.id === user.id && <div className="text-[9px] text-neon-green mt-1">✓ YOU</div>}
                      </div>
                    ))}
                  </div>
                  {groupWinners.some(w => w.id === user.id) ? (
                    <div className="bg-neon-gold/10 border border-neon-gold/30 rounded px-4 py-3 text-center">
                      <div className="text-neon-gold font-arcade text-sm mb-1">🎉 YOU ADVANCED!</div>
                      <div className="text-xs text-slate-400">Proceed to Final Spin</div>
                    </div>
                  ) : (
                    <div className="bg-red-950/20 border border-red-700/30 rounded px-4 py-3 text-center">
                      <div className="text-red-400 font-arcade text-sm mb-1">❌ ELIMINATED</div>
                      <div className="text-xs text-slate-400">You didn't win your group</div>
                    </div>
                  )}
                </div>

                {/* Arrow Down - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="flex justify-center">
                    <div className="text-2xl text-neon-green">↓</div>
                  </div>
                )}

                {/* Stage 3: Final Spin (Upcoming) - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="text-center">
                    <div className="text-sm font-arcade text-slate-400 mb-2 uppercase tracking-wider">Stage 3: Final Spin</div>
                    <div className="text-xs text-slate-500">1 Winner from 10 finalists</div>
                  </div>
                )}

                {/* Arrow Down - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="flex justify-center">
                    <div className="text-2xl text-slate-600">↓</div>
                  </div>
                )}

                {/* Stage 4: Champion (Upcoming) - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="text-center">
                    <div className="text-sm font-arcade text-slate-500 uppercase tracking-wider">Stage 4: 🏆 CHAMPION 🏆</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ELIM_LOSE - Prompt losers to return to lobby */}
        {phase === 'ELIM_LOSE' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md bg-slate-900/60 border border-neon-pink/30 rounded p-6">
              <div className="text-6xl mb-4">😔</div>
              <div className="text-2xl font-arcade text-neon-pink mb-3">Better luck next time!</div>
              <div className="text-sm text-slate-400 mb-6">You weren't among the 10 winners. Your bet is locked for this tournament.</div>
              <button onClick={exitToLobby} className="px-8 py-4 border-2 border-red-500 text-red-500 font-arcade text-lg font-bold hover:bg-red-500 hover:text-black transition">Back to Lobby</button>
            </div>
          </div>
        )}

        {/* FINAL_COLOR - Show user's assigned color with 5s countdown */}
        {phase === 'FINAL_COLOR' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md bg-slate-900/60 border border-neon-cyan/30 rounded-lg p-8">
              <div className="text-5xl mb-4">🎮</div>
              <div className="text-2xl font-arcade text-neon-gold mb-4">Your Final Color</div>
              <div className="flex justify-center mb-6">
                <div
                  className="w-32 h-32 rounded-lg border-4 border-white shadow-lg transform transition-all hover:scale-105"
                  style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX], boxShadow: `0 0 30px ${COLOR_HEX[userColor as keyof typeof COLOR_HEX]}99` }}
                />
              </div>
              <div className="text-xl font-arcade capitalize text-neon-cyan mb-6 tracking-widest">{userColor}</div>
              <div className="text-5xl font-arcade text-neon-pink mb-4 animate-bounce">{finalColorCountdown}</div>
              <div className="text-sm text-slate-400">Joining final room...</div>
            </div>
          </div>
        )}

        {/* FINAL_PREP - Winners get ready prompt */}
        {phase === 'FINAL_PREP' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md bg-slate-900/60 border border-neon-gold/30 rounded p-6">
              <div className="text-5xl mb-3">🚀</div>
              <div className="text-2xl font-arcade text-neon-gold mb-2">Get Ready for Round 2</div>
              <div className="text-sm text-slate-400 mb-4">The 10 group winners have been assigned new colors and will spin for the grand prize.</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                {groupWinners.slice(0,10).map((w, i) => (
                  <div key={w.id} className="flex flex-col items-center text-xs">
                    <div className="w-10 h-10 rounded-full mb-1" style={{ backgroundColor: COLOR_HEX[w.assignedColor as keyof typeof COLOR_HEX] }} />
                    <div className="font-arcade truncate max-w-[64px]">{w.username}</div>
                  </div>
                ))}
              </div>
              <div className="text-3xl font-arcade text-neon-cyan mb-4">{countdownActive ? countdown : 3}</div>
              <div className="text-xs text-slate-400 mb-3">Final spin starts shortly</div>
            </div>
          </div>
        )}

        {/* FINAL - Grand Final Spin */}
        {phase === 'FINAL' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden w-full h-auto relative">
            {/* Left: Finalists - Hidden on mobile */}
            <div className="hidden lg:flex w-72 bg-black/40 border border-neon-gold/30 rounded overflow-hidden flex-col flex-shrink-0">
              <div className="sticky top-0 bg-black/80 border-b border-neon-gold/30 p-3">
                <div className="text-neon-gold font-arcade text-sm">🏆 FINALISTS</div>
                <div className="text-neon-cyan text-xs mt-1">{groupWinners.length} Players</div>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                {groupWinners.map((w, i) => (
                  <div
                    key={w.id}
                    className={`flex items-center gap-2 p-2 mb-1 rounded text-xs border transition ${
                      w.id === user.id
                        ? 'bg-neon-cyan/20 border-neon-cyan shadow-lg shadow-neon-cyan/50'
                        : 'bg-slate-800/30 border-slate-600/30'
                    }`}
                  >
                    <div className={`font-arcade font-bold ${
                      w.id === user.id ? 'text-neon-cyan' : 'text-neon-gold'
                    }`}>{i + 1}</div>
                    <img src={w.avatar} alt={w.username} className="w-5 h-5 rounded-full flex-shrink-0" />
                    <div className={`flex-1 truncate font-arcade ${
                      w.id === user.id ? 'text-neon-cyan drop-shadow-lg drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white'
                    } transition`}>{w.username}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOBILE: FINALISTS MODAL */}
            {showGroupsPanel && phase === 'FINAL' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-gold/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-gold/30 p-4 flex justify-between items-center">
                    <div className="text-neon-gold font-arcade">🏆 FINALISTS ({groupWinners.length})</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowGroupsPanel(false); }}
                      className="text-neon-gold hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {groupWinners.map((w, i) => (
                      <div
                        key={w.id}
                        className={`flex items-center gap-3 p-2.5 rounded border ${
                          w.id === user.id
                            ? 'bg-neon-cyan/20 border-neon-cyan shadow-lg shadow-neon-cyan/50'
                            : 'bg-slate-800/30 border-slate-600/30'
                        }`}
                      >
                        <div className={`font-arcade font-bold ${
                          w.id === user.id ? 'text-neon-cyan' : 'text-neon-gold'
                        }`}>{i + 1}</div>
                        <img src={w.avatar} alt={w.username} className="w-6 h-6 rounded-full flex-shrink-0" />
                        <div className={`flex-1 truncate font-arcade text-sm ${
                          w.id === user.id ? 'text-neon-cyan drop-shadow-lg drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white'
                        } transition`}>{w.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Hide everything on mobile - just show the wheel */}
            <div className="hidden lg:flex flex-1" />

            {/* Center: Spacer for wheel - takes up middle space */}
            <div className="hidden lg:flex flex-1" />

            {/* Right: Your Status - Hidden on mobile */}
            <div className="hidden lg:flex w-72 bg-black/40 border border-neon-pink/30 rounded overflow-y-auto flex-col flex-shrink-0">
              {/* Total Pot */}
              <div className="p-2 sm:p-3 border-b border-neon-pink/30">
                <div className="text-neon-gold font-arcade text-[8px] sm:text-[10px] mb-1">TOTAL POT</div>
                <div className="text-neon-green font-arcade text-sm sm:text-base">${totalPot.toLocaleString()}</div>
              </div>
              {/* User Status */}
              <div className="bg-black/80 border-b border-neon-pink/30 p-2 sm:p-3">
                <div className="text-neon-pink font-arcade text-[9px] sm:text-sm mb-1.5 sm:mb-2">🎮 YOUR STATUS</div>
                <div className="space-y-1 sm:space-y-1.5 text-[8px] sm:text-xs">
                  <div>
                    <span className="text-slate-400">Your Color:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white"
                        style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}
                      />
                      <span className="font-arcade capitalize text-[7px] sm:text-xs">{userColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Bet:</span>
                    <div className="font-arcade text-neon-green text-[7px] sm:text-xs">${ENTRY_FEE} 🔒</div>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 border-b border-neon-pink/30 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-1 sm:p-2 space-y-1 text-[7px] sm:text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-2 sm:py-4">No messages</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i}>
                        <div className="text-neon-pink font-arcade text-[7px] sm:text-[9px]">{msg.user}</div>
                        <div className="text-slate-300 ml-1 sm:ml-2 text-[6px] sm:text-[10px]">{msg.msg}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-neon-pink/30 p-1.5 sm:p-2 flex gap-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    placeholder="Say..."
                    className="flex-1 bg-black/60 border border-neon-pink/40 rounded px-1.5 sm:px-2 py-1 text-[7px] sm:text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    className="border border-neon-pink text-neon-pink px-1.5 sm:px-2 py-1 sm:py-1.5 hover:bg-neon-pink hover:text-white text-xs font-bold min-h-[32px] sm:min-h-[36px] transition"
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Winners count */}
              <div className="p-2 sm:p-3">
                <div className="text-neon-green font-arcade text-[8px] sm:text-[10px]">WINNERS: {groupWinners.length}/10</div>
              </div>
            </div>

            {/* MOBILE: STATUS MODAL */}
            {showStatusPanel && phase === 'FINAL' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-pink/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-pink/30 p-4 flex justify-between items-center">
                    <div className="text-neon-pink font-arcade">🎮 YOUR STATUS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowStatusPanel(false); }}
                      className="text-neon-pink hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Total Pot */}
                    <div className="bg-black/60 border border-neon-gold/30 rounded p-3">
                      <div className="text-neon-gold font-arcade text-xs mb-2">TOTAL POT</div>
                      <div className="text-2xl font-arcade text-neon-green font-black">${totalPot.toLocaleString()}</div>
                    </div>
                    {/* Your Details */}
                    <div className="bg-black/60 border border-neon-pink/30 rounded p-3 space-y-2">
                      <div>
                        <span className="text-slate-400 text-xs">Your Color</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className="w-6 h-6 rounded border-2 border-white"
                            style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}
                          />
                          <span className="font-arcade text-sm capitalize">{userColor}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neon-pink/20">
                        <span className="text-slate-400 text-xs">Bet Amount</span>
                        <div className="font-arcade text-neon-green mt-1">${ENTRY_FEE} 🔒</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE: CHATS MODAL */}
            {showChatPanel && phase === 'FINAL' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-green/30 rounded-t-lg max-h-[70vh] overflow-y-auto flex flex-col">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-green/30 p-4 flex justify-between items-center">
                    <div className="text-neon-green font-arcade">💬 CHAT</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowChatPanel(false); }}
                      className="text-neon-green hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">No messages yet</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className="text-xs">
                          <div className="text-neon-cyan font-arcade text-[10px]">{msg.user}</div>
                          <div className="text-slate-300 ml-2">{msg.msg}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-neon-green/30 p-3 bg-black/60 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      placeholder="Say..."
                      className="flex-1 bg-black/60 border border-neon-green/30 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          soundManager.play('click');
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      className="border border-neon-green text-neon-green px-2.5 py-1.5 hover:bg-neon-green hover:text-black text-xs font-bold transition"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINAL_RESULT - Grand Winner or Elimination */}
        {phase === 'FINAL_RESULT' && (
          <div className="flex-1 flex items-center justify-center relative overflow-hidden p-2 sm:p-4">
            {/* Celebratory confetti background for grand champion */}
            {grandWinner?.id === user.id && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {Array.from({ length: 60 }).map((_, i) => {
                  const emoji = ['🎉', '✨', '🎊', '🥳', '👑', '💎', '🏆', '🎈', '💥', '⭐'][i % 10];
                  const left = Math.random() * 100;
                  const delay = Math.random() * 0.5;
                  const duration = 3 + Math.random() * 2;
                  return (
                    <div
                      key={i}
                      className="absolute text-lg sm:text-2xl md:text-3xl"
                      style={{
                        left: `${left}%`,
                        top: '-30px',
                        animation: `fall ${duration}s linear forwards`,
                        animationDelay: `${delay}s`
                      }}
                    >
                      {emoji}
                    </div>
                  );
                })}
                <style>{`
                  @keyframes fall {
                    to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                  }
                `}</style>
              </div>
            )}
            <div className="text-center relative z-10 w-full px-2 max-w-md mx-auto">
              {grandWinner?.id === user.id ? (
                // Grand Champion - Mobile Responsive
                <div className="w-full">
                  <div className="text-3xl sm:text-4xl md:text-6xl mb-1 sm:mb-2 md:mb-3 animate-bounce drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">
                    👑
                  </div>
                  <div className="text-xl sm:text-2xl md:text-4xl font-arcade text-neon-gold mb-1 sm:mb-2 md:mb-3 animate-pulse drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] tracking-wider">
                    GRAND CHAMPION!
                  </div>
                  <div className="bg-gradient-to-b from-neon-gold/20 to-neon-cyan/10 border border-neon-gold rounded-lg p-2 sm:p-3 md:p-6 mb-2 sm:mb-3 md:mb-4 shadow-[0_0_40px_rgba(255,215,0,0.3)]">
                    <img src={user.avatar} alt="you" className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 rounded-full mx-auto mb-1 sm:mb-2 md:mb-3 border-2 border-neon-gold shadow-lg" />
                    <div className="font-arcade text-xs sm:text-base md:text-xl text-neon-cyan mb-1 sm:mb-2 md:mb-3 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                      {user.username}
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-xs text-slate-300 mb-0.5 sm:mb-1">Total Prize</div>
                    <div className="text-xl sm:text-2xl md:text-4xl font-arcade text-neon-gold mb-2 sm:mb-3 md:mb-4 font-black tracking-wider drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                      ${totalPot.toLocaleString()}
                    </div>
                    <div className="text-[7px] sm:text-[8px] md:text-xs text-neon-green bg-neon-green/20 rounded p-1.5 sm:p-2 md:p-2.5 border border-neon-green/50 animate-pulse">
                      🎊 Prize Added to Balance 🎊
                    </div>
                  </div>
                  <button
                    onClick={exitToLobby}
                    className="w-full px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border-2 border-neon-gold text-neon-gold font-arcade text-sm sm:text-base md:text-lg hover:bg-neon-gold hover:text-black transition drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] font-bold"
                  >
                    Back to Lobby
                  </button>
                </div>
              ) : (
                // Eliminated - Mobile Responsive
                <div className="w-full">
                  <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 md:mb-3">😔</div>
                  <div className="text-base sm:text-lg md:text-2xl font-arcade text-neon-pink mb-2 sm:mb-3 md:mb-4">Better luck next time!</div>
                  <div className="bg-slate-800/50 border border-neon-pink/30 rounded p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4">
                    <div className="text-[8px] sm:text-[9px] md:text-xs text-slate-400 mb-1">Grand Champion</div>
                    <img src={grandWinner?.avatar} alt="champion" className="w-10 sm:w-11 md:w-14 h-10 sm:h-11 md:h-14 rounded-full mx-auto mb-1 sm:mb-2" />
                    <div className="font-arcade text-[9px] sm:text-xs md:text-base text-neon-pink">{grandWinner?.username}</div>
                  </div>
                  <button
                    onClick={exitToLobby}
                    className="w-full px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border-2 border-red-500 text-red-500 font-arcade text-sm sm:text-base md:text-lg hover:bg-red-500 hover:text-black transition font-bold"
                  >
                    Back to Lobby
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rank Up Modal */}
        {showRankUp && <RankUpModal newRank={user.rank} previousRank={previousRank} onClose={() => setShowRankUp(false)} />}
      </div>
    </div>
  );
};

export default TournamentRoom;
