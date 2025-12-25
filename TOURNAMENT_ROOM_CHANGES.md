// NEEDED CHANGES FOR TournamentRoom.tsx

// 1. REPLACE the proceed button onClick (around line 365-371):
onClick={() => {
  setShowWinnerProceed(false);
  setAnnouncing(false);
  const reassigned = groupWinners.map((w, idx) => ({ ...w, assignedColor: COLORS[idx % COLORS.length] }));
  setGroupWinners(reassigned);
  // Change FINAL_PREP to FINAL_COLOR phase
  setPhase('FINAL_COLOR');
  setFinalColorCountdown(5);
}}

// 2. ADD useEffect after line 220 (after winnerCountdown useEffect):
useEffect(() => {
  if (finalColorCountdown === null) return;
  if (finalColorCountdown <= 0) {
    setFinalColorCountdown(null);
    setPhase('FINAL_SPIN_COUNTDOWN');
    setCountdown(3);
    setCountdownActive(true);
    return;
  }
  const t = setTimeout(() => setFinalColorCountdown(c => (c !== null ? c - 1 : null)), 1000);
  return () => clearTimeout(t);
}, [finalColorCountdown]);

// 3. ADD FINAL_COLOR phase block (before line 737):
{phase === 'FINAL_COLOR' && (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center max-w-md bg-slate-900/60 border border-neon-cyan/30 rounded p-8">
      <div className="text-5xl mb-4">🎮</div>
      <div className="text-2xl font-arcade text-neon-gold mb-4">Your Final Color</div>
      <div className="flex justify-center mb-6">
        <div
          className="w-24 h-24 rounded-lg border-2 border-white shadow-lg"
          style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}
        />
      </div>
      <div className="text-lg font-arcade capitalize text-neon-cyan mb-6">{userColor}</div>
      <div className="text-4xl font-arcade text-neon-pink mb-3 animate-pulse">{finalColorCountdown}</div>
      <div className="text-sm text-slate-400">Entering final room...</div>
    </div>
  </div>
)}

// 4. ADD FINAL_SPIN_COUNTDOWN phase block (before FINAL_PREP block at line 737):
{phase === 'FINAL_SPIN_COUNTDOWN' && (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="text-6xl font-arcade text-neon-gold mb-4 animate-bounce">{countdown}</div>
      <div className="text-lg font-arcade text-neon-cyan">Final Spin Starting</div>
      {countdown === 0 && (
        <button
          onClick={() => {
            setCountdownActive(false);
            setPhase('FINAL');
            setFinalTarget(Math.floor(Math.random() * groupWinners.length));
            setFinalSpinning(true);
          }}
          className="mt-6 px-6 py-3 bg-neon-gold text-black font-arcade rounded hover:scale-105 transition"
        >
          SPIN!
        </button>
      )}
    </div>
  </div>
)}
