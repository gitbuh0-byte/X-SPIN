import React, { useState } from 'react';
import { soundManager } from '../services/soundManager.ts';

interface Player {
  id: string;
  name: string;
  avatar: string;
  username?: string;
}

interface Room {
  id: string;
  roomNumber: number;
  roomLabel: string; // "G1", "G2", etc or "QF1", "Final"
  players: Player[];
  status: 'active' | 'upcoming' | 'completed';
  winner?: string;
}

interface TournamentBracketNewProps {
  groupNumber: number;  // 1-20 (user's assigned room/group)
  playersInGroup: number;
  onProceedClick?: () => void;
  userUsername?: string;  // User's actual username to display in their room
}

const TournamentBracketNew: React.FC<TournamentBracketNewProps> = ({ 
  groupNumber, 
  playersInGroup,
  onProceedClick,
  userUsername
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Generate mock players for demonstration
  const generatePlayers = (seedValue: string, count: number, includeUser: boolean = false): Player[] => {
    const names = ['NeonGhost', 'CyberVortex', 'PixelKing', 'ShadowEcho', 'VortexRider', 'CrimsonBlade', 'NovaStrike', 'PhantomRage'];
    return Array.from({ length: count }).map((_, i) => {
      // First player is the user if this is the user's room
      if (includeUser && i === 0 && userUsername) {
        return {
          id: `${seedValue}-player-${i}`,
          name: userUsername,
          username: userUsername,
          avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userUsername}`
        };
      }
      return {
        id: `${seedValue}-player-${i}`,
        name: names[i % names.length],
        username: names[i % names.length],
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seedValue}-${i}`
      };
    });
  };

  // ROUND 1: 20 Rooms (G1 through G20)
  const round1Rooms: Room[] = Array.from({ length: 20 }).map((_, i) => {
    const isUserRoom = (i + 1) === groupNumber;
    return {
      id: `r1-room-${i + 1}`,
      roomNumber: i + 1,
      roomLabel: `G${i + 1}`,  // G1, G2, ... G20
      players: generatePlayers(`r1-room-${i + 1}`, playersInGroup, isUserRoom),
      status: 'completed' as const,
      winner: `r1-room-${i + 1}-player-0`
    };
  });

  // ROUND 2: 4 Quarter Final rooms (QF1 through QF4)
  // Each QF room gets winners from 5 Round 1 rooms
  const round2Rooms: Room[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `r2-room-${i + 1}`,
    roomNumber: i + 1,
    roomLabel: `QF${i + 1}`,  // QF1, QF2, QF3, QF4
    players: generatePlayers(`r2-room-${i + 1}`, 5),  // Each QF has 5 finalists from their group
    status: 'upcoming' as const
  }));

  // ROUND 3: 1 Final room (Final)
  // The final has the 4 winners from each QF room
  const round3Rooms: Room[] = Array.from({ length: 1 }).map((_, i) => ({
    id: `final-room-${i + 1}`,
    roomNumber: i + 1,
    roomLabel: 'FINAL',
    players: generatePlayers(`final-room-${i + 1}`, 4),  // 4 finalists competing
    status: 'upcoming' as const
  }));

  const RoomCardContent = ({ room, isHovered, round, showPlayers = true }: { room: Room; isHovered: boolean; round: 1 | 2 | 3; showPlayers?: boolean }) => {
    // Only show player details in Round 1, for Round 2 and Final show "TBC"
    if (isHovered && showPlayers) {
      return (
        <div className="space-y-1">
          <div className="font-arcade text-neon-cyan font-bold text-[8px]">{room.roomLabel}</div>
          {room.players.map((player) => (
            <div key={player.id} className="flex items-center gap-1 p-1 bg-black/40 rounded text-[7px]">
              <img 
                src={player.avatar}
                alt={player.username || player.name}
                className="w-3 h-3 rounded-full"
              />
              <div className="flex-1 min-w-0 truncate text-neon-cyan">
                {(player.username || player.name).slice(0, 12)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isHovered && !showPlayers) {
      // Round 2 and Final: show "TBC" on hover
      return (
        <div className="space-y-1">
          <div className="font-arcade text-neon-cyan font-bold text-[8px]">{room.roomLabel}</div>
          <div className="text-neon-pink/70 text-[7px] font-arcade">TBC</div>
        </div>
      );
    }

    return (
      <>
        <div className="font-arcade text-neon-cyan font-bold text-[9px]">{room.roomLabel}</div>
        {showPlayers && room.players.length > 0 && (
          <div className="text-neon-gold text-[8px] truncate">
            {(room.players[0].username || room.players[0].name).slice(0, 10)}
          </div>
        )}
        {!showPlayers && (
          <div className="text-neon-pink/60 text-[8px]">—</div>
        )}
      </>
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
            Round 1: 20 Rooms • Round 2: 4 Rooms • Final: 1 Room
          </p>
          <p className="text-[8px] sm:text-[9px] text-neon-pink font-arcade mt-1">
            Your Room: <span className="text-neon-green font-bold">G{groupNumber}</span>
          </p>
        </div>
      </div>

      {/* Bracket Container */}
      <div className="flex-1 overflow-auto relative pb-8">
        <div className="w-full h-full flex flex-col justify-center items-center p-4 sm:p-8 min-h-fit">
          
          {/* Stage Headers */}
          <div className="flex gap-8 sm:gap-16 justify-center w-full mb-8 px-4">
            <div className="text-center">
              <div className="text-xs sm:text-sm font-arcade text-neon-pink font-bold uppercase tracking-wider">Round 1</div>
              <div className="text-[8px] text-neon-pink/60">20 Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm font-arcade text-neon-cyan font-bold uppercase tracking-wider">Round 2</div>
              <div className="text-[8px] text-neon-cyan/60">4 Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm font-arcade text-neon-gold font-bold uppercase tracking-wider">Final</div>
              <div className="text-[8px] text-neon-gold/60">1 Room</div>
            </div>
          </div>

          {/* Main Bracket */}
          <div className="flex gap-6 sm:gap-12 justify-center items-center relative w-full overflow-x-auto">
            
            {/* ROUND 1 - 20 Rooms (G1-G20) */}
            <div className="flex flex-col gap-0.5 justify-center flex-shrink-0">
              {round1Rooms.map((room, idx) => {
                const isUserRoom = (idx + 1) === groupNumber;  // Fixed: direct comparison with groupNumber (1-20)
                const isHovered = hoveredRoom === `r1-${idx}`;
                
                return (
                  <div key={room.id} className="flex flex-col gap-0.5">
                    <div
                      onClick={() => {
                        soundManager.play('click');
                        setSelectedRoom(selectedRoom === `r1-${idx}` ? null : `r1-${idx}`);
                      }}
                      onMouseEnter={() => setHoveredRoom(`r1-${idx}`)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className={`cursor-pointer transition-all duration-300 border rounded px-2 py-1 sm:px-3 sm:py-2 w-32 sm:w-40 text-center backdrop-blur-sm text-[8px] sm:text-[9px] ${
                        isUserRoom
                          ? 'border-neon-green/90 bg-neon-green/20 shadow-[0_0_25px_rgba(0,255,0,0.6)] ring-2 ring-neon-green/70'  // User's room highlighted in green
                          : selectedRoom === `r1-${idx}`
                          ? 'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : 'border-neon-cyan/40 bg-black/50 hover:border-neon-cyan'
                      }`}
                      title={`Room ${room.roomLabel}`}
                    >
                      <RoomCardContent room={room} isHovered={isHovered} round={1} showPlayers={true} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ROUND 2 - 4 Quarter Finals */}
            <div className="flex flex-col gap-4 justify-center flex-shrink-0">
              {round2Rooms.map((room, idx) => {
                const isHovered = hoveredRoom === `r2-${idx}`;
                
                return (
                  <div key={room.id} className="flex flex-col gap-0.5">
                    <div
                      onClick={() => {
                        soundManager.play('click');
                        setSelectedRoom(selectedRoom === `r2-${idx}` ? null : `r2-${idx}`);
                      }}
                      onMouseEnter={() => setHoveredRoom(`r2-${idx}`)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className={`cursor-pointer transition-all duration-300 border-2 rounded px-2 py-1 sm:px-3 sm:py-2 w-32 sm:w-40 text-center backdrop-blur-sm text-[8px] sm:text-[9px] ${
                        selectedRoom === `r2-${idx}`
                          ? 'border-neon-pink bg-neon-pink/20 shadow-[0_0_20px_rgba(255,0,128,0.4)]'
                          : 'border-neon-pink/40 bg-black/50 hover:border-neon-pink'
                      }`}
                      title={`${room.roomLabel}`}
                    >
                      <RoomCardContent room={room} isHovered={isHovered} round={2} showPlayers={false} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ROUND 3 - Final */}
            <div className="flex flex-col gap-1.5 justify-center flex-shrink-0">
              {round3Rooms.map((room, idx) => {
                const isHovered = hoveredRoom === `r3-${idx}`;
                
                return (
                  <div key={room.id} className="flex flex-col gap-0.5">
                    <div
                      onClick={() => {
                        soundManager.play('click');
                        setSelectedRoom(selectedRoom === `r3-${idx}` ? null : `r3-${idx}`);
                      }}
                      onMouseEnter={() => setHoveredRoom(`r3-${idx}`)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className={`cursor-pointer transition-all duration-300 border-2 rounded px-2 py-1 sm:px-3 sm:py-2 w-32 sm:w-40 text-center backdrop-blur-sm text-[8px] sm:text-[9px] ${
                        selectedRoom === `r3-${idx}`
                          ? 'border-neon-gold bg-neon-gold/20 shadow-[0_0_25px_rgba(255,215,0,0.5)]'
                          : 'border-neon-gold/40 bg-black/50 hover:border-neon-gold/70'
                      }`}
                      title="Grand Final - 4 Players"
                    >
                      <RoomCardContent room={room} isHovered={isHovered} round={3} showPlayers={false} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trophy Decoration */}
            <div className="flex flex-col justify-center items-center gap-2 flex-shrink-0 ml-4 sm:ml-6">
              <div className="text-4xl sm:text-5xl drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-bounce">🏆</div>
              <div className="text-xs font-arcade text-neon-gold font-bold tracking-wider hidden sm:block">CHAMPION</div>
            </div>
          </div>

          {/* Proceed Button */}
          <div className="mt-12 flex gap-4">
            <button
              onClick={() => {
                soundManager.play('click');
                if (onProceedClick) onProceedClick();
              }}
              className="px-6 sm:px-8 py-2 sm:py-3 font-arcade text-xs sm:text-sm tracking-wider text-black bg-gradient-to-r from-neon-green to-neon-cyan hover:shadow-[0_0_30px_rgba(0,255,0,0.6)] transition-all duration-300 shadow-[0_0_15px_rgba(0,255,0,0.4)] rounded border-2 border-transparent hover:border-neon-green whitespace-nowrap font-black"
            >
              START TOURNAMENT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracketNew;
