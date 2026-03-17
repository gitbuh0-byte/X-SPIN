import React, { useState } from 'react';
import { soundManager } from '../services/soundManager.ts';

interface Player {
  id: string;
  name: string;
  avatar: string;
}

interface Room {
  id: string;
  roomNumber: number;
  players: Player[];
  status: 'active' | 'upcoming' | 'completed';
  winner?: string;
}

interface TournamentBracketNewProps {
  groupNumber: number;
  playersInGroup: number;
  onProceedClick?: () => void;
}

const TournamentBracketNew: React.FC<TournamentBracketNewProps> = ({ 
  groupNumber, 
  playersInGroup,
  onProceedClick 
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [paths, setPaths] = useState<Array<{d: string, id: string}>>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const round1RefsRef = React.useRef<{[key: string]: HTMLDivElement}>({});
  const round2RefsRef = React.useRef<{[key: string]: HTMLDivElement}>({});

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    const newPaths: Array<{d: string, id: string}> = [];
    
    // Generate paths for each group of 5 rooms to their QF room
    for (let groupIdx = 0; groupIdx < 4; groupIdx++) {
      const qfRoomKey = `qf-room-${groupIdx + 1}`;
      const qfRoom = round2RefsRef.current[qfRoomKey];
      
      if (!qfRoom) continue;
      
      const qfRect = qfRoom.getBoundingClientRect();
      const qfContainerRect = container.getBoundingClientRect();
      const qfCenterY = qfRect.top - qfContainerRect.top + qfRect.height / 2 + scrollTop;
      const qfX = qfRect.left - qfContainerRect.left + scrollLeft;
      
      for (let roomIdx = 0; roomIdx < 5; roomIdx++) {
        const r1RoomKey = `r1-room-${groupIdx * 5 + roomIdx + 1}`;
        const r1Room = round1RefsRef.current[r1RoomKey];
        
        if (!r1Room) continue;
        
        const r1Rect = r1Room.getBoundingClientRect();
        const r1CenterY = r1Rect.top - qfContainerRect.top + r1Rect.height / 2 + scrollTop;
        const r1X = r1Rect.left - qfContainerRect.left + scrollLeft + r1Rect.width;
        
        const midX = (r1X + qfX) / 2;
        const pathId = `path-${groupIdx}-${roomIdx}`;
        const pathData = `M ${r1X} ${r1CenterY} Q ${midX} ${(r1CenterY + qfCenterY) / 2}, ${qfX} ${qfCenterY}`;
        
        newPaths.push({d: pathData, id: pathId});
      }
    }
    
    setPaths(newPaths);
  }, []);

  // Generate mock players for demonstration
  const generatePlayers = (roomId: string, count: number): Player[] => {
    const names = ['NeonGhost', 'CyberVortex', 'PixelKing', 'ShadowEcho', 'VortexRider'];
    return Array.from({ length: count }).map((_, i) => ({
      id: `${roomId}-player-${i}`,
      name: names[i % names.length],
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${roomId}-${i}`
    }));
  };

  // Round 1: 20 rooms total (4 groups of 5)
  const round1Rooms: Room[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `r1-room-${i + 1}`,
    roomNumber: i + 1,
    players: generatePlayers(`r1-room-${i + 1}`, 2),
    status: 'completed' as const,
    winner: `r1-room-${i + 1}-player-0`
  }));

  // Round 2: 4 rooms (Quarter Finals) - each receives from 5 Round 1 rooms
  const round2Rooms: Room[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `r2-room-${i + 1}`,
    roomNumber: i + 1,
    players: generatePlayers(`r2-room-${i + 1}`, 2),
    status: 'upcoming' as const
  }));

  // Round 3: 1 room (Final) - receives from all 4 Quarter Final rooms
  const round3Rooms: Room[] = Array.from({ length: 1 }).map((_, i) => ({
    id: `final-room-${i + 1}`,
    roomNumber: i + 1,
    players: generatePlayers(`final-room-${i + 1}`, 2),
    status: 'upcoming' as const
  }));

  const RoomCard = ({ room }: { room: Room }) => {
    const displayPlayers = room.players.slice(0, 2);
    
    return (
      <div
        onClick={() => {
          soundManager.play('click');
          setSelectedRoom(selectedRoom === room.id ? null : room.id);
        }}
        className={`cursor-pointer transition-all duration-300 border-2 rounded-lg p-2 w-36 sm:w-40 backdrop-blur-sm ${
          selectedRoom === room.id
            ? 'border-neon-gold bg-neon-gold/20 shadow-[0_0_30px_rgba(255,215,0,0.6)]'
            : room.status === 'completed'
            ? 'border-neon-green/70 bg-black/70 hover:border-neon-green'
            : 'border-neon-cyan/50 bg-black/60 hover:border-neon-cyan'
        }`}
      >
        <div className="text-xs font-arcade font-bold tracking-wider mb-2 text-center">
          ROOM {room.roomNumber}
        </div>

        {room.status === 'upcoming' ? (
          <div className="text-center py-2">
            <div className="text-[8px] text-neon-cyan/60 font-arcade">TBC</div>
          </div>
        ) : (
          <div className="space-y-1 w-full">
            {displayPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-1 p-1 bg-black/40 rounded text-[7px]">
                <img 
                  src={player.avatar}
                  alt={player.name}
                  className="w-3 h-3 rounded-full"
                />
                <div className="flex-1 min-w-0 truncate text-neon-cyan">
                  {player.name.slice(0, 8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-black via-black to-black overflow-hidden">
      {/* Header - Fixed */}
      <div className="sticky top-0 bg-gradient-to-r from-black via-black to-black border-b-2 border-neon-cyan/60 px-3 sm:px-4 py-3 z-20 backdrop-blur-sm flex-shrink-0">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-arcade text-neon-gold tracking-widest mb-1 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
            GRAND PRIX TOURNAMENT
          </h1>
          <p className="text-[9px] sm:text-xs text-neon-cyan font-mono">
            20 Rooms → 4 Rooms → 1 Final Room
          </p>
        </div>
      </div>

      {/* Bracket Container - Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-auto relative">
        {/* SVG Connection Lines */}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{width: '100%', height: '100%', minWidth: '100%'}}>
          {/* Group 1: Rooms 1-5 → QF Room 1 */}
          <path d="M 176 60 Q 210 110, 256 100" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 124 Q 210 110, 256 100" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 180 Q 210 130, 256 130" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 236 Q 210 150, 256 160" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 292 Q 210 170, 256 160" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          
          {/* Group 2: Rooms 6-10 → QF Room 2 */}
          <path d="M 176 360 Q 210 390, 256 260" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 424 Q 210 390, 256 260" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 480 Q 210 410, 256 290" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 536 Q 210 430, 256 290" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
          <path d="M 176 592 Q 210 450, 256 290" stroke="rgba(0,255,255,0.6)" strokeWidth="2" fill="none" />
        </svg>
        
        <div className="inline-flex gap-20 p-8 min-h-full relative z-10">
          
          {/* ROUND 1: 20 ROOMS (4 Groups of 5) */}
          <div className="flex flex-col gap-8 justify-start">
            <div className="text-center">
              <div className="text-xs font-arcade text-neon-pink font-bold uppercase bg-black/60 border border-neon-pink/50 px-3 py-1 rounded">
                Round 1
              </div>
            </div>

            {[0, 1, 2, 3].map((groupIdx) => (
              <div key={`group-${groupIdx}`} className="flex flex-col gap-2">
                {round1Rooms.slice(groupIdx * 5, (groupIdx + 1) * 5).map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ))}
          </div>

          {/* ROUND 2: 4 QUARTER FINAL ROOMS */}
          <div className="flex flex-col gap-12 justify-start">
            <div className="text-center">
              <div className="text-xs font-arcade text-neon-pink font-bold uppercase bg-black/60 border border-neon-pink/50 px-3 py-1 rounded">
                Quarter Finals
              </div>
            </div>

            {round2Rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {/* ROUND 3: FINAL ROOM */}
          <div className="flex flex-col justify-center gap-8">
            <div className="text-center">
              <div className="text-xs font-arcade text-neon-gold font-bold uppercase bg-black/60 border border-neon-gold/50 px-3 py-1 rounded">
                Semi Finals
              </div>
            </div>

            <RoomCard room={round3Rooms[0]} />
          </div>

          {/* CHAMPION TROPHY */}
          <div className="flex flex-col justify-center items-center gap-4 px-8">
            <div className="text-5xl drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-bounce">
              🏆
            </div>
            <div className="bg-gradient-to-b from-neon-gold/20 to-neon-gold/10 border-2 border-neon-gold/60 rounded-lg px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-base font-arcade text-neon-gold tracking-widest font-bold">
                CHAMPION
              </div>
              <div className="text-[8px] text-neon-cyan/70 mt-1">
                Winner Takes All
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar - Fixed at Bottom */}
      <div className="sticky bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent border-t-2 border-neon-cyan/60 px-3 sm:px-4 py-3 flex items-center justify-between gap-3 z-10 flex-shrink-0">
        <div className="text-xs sm:text-sm text-neon-cyan font-mono">
          Your Group: <span className="font-arcade font-bold text-neon-gold">G{groupNumber}</span>
        </div>
        <button
          onClick={() => {
            soundManager.play('click');
            onProceedClick?.();
          }}
          className="px-4 sm:px-6 py-2 bg-gradient-to-r from-neon-green to-neon-cyan text-black font-arcade text-xs sm:text-sm font-bold hover:from-neon-cyan hover:to-neon-green hover:shadow-[0_0_30px_rgba(0,255,0,0.8)] transition-all shadow-[0_0_20px_rgba(0,255,0,0.5)] transform hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          ▶ PROCEED
        </button>
      </div>
    </div>
  );
};

export default TournamentBracketNew;
