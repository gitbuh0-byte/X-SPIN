import React, { useState } from 'react';
import { User, Transaction } from '../types.ts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RANK_CONFIG } from '../constants.ts';
import { soundManager } from '../services/soundManager.ts';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  onOpenPayment: (type: 'DEPOSIT' | 'WITHDRAWAL') => void;
  onUpdateProfile?: (updates: Partial<User>) => void;
  onLogout?: () => void;
}

const data = [
  { name: 'Mon', balance: 400 },
  { name: 'Tue', balance: 300 },
  { name: 'Wed', balance: 550 },
  { name: 'Thu', balance: 480 },
  { name: 'Fri', balance: 890 },
  { name: 'Sat', balance: 1200 },
  { name: 'Sun', balance: 1550 },
];

const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onSave: (u: Partial<User>) => void }> = ({ isOpen, onClose, user, onSave }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');

  // Preset avatars for selection
  const presetAvatars = [
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=SpinMaster`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Cyber`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Ghost`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Phoenix`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Vortex`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Plasma`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Eclipse`,
  ];

  if (!isOpen) return null;

  const handleSave = () => { onSave({ username, avatar, email, bio }); soundManager.play('lock'); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-vegas-panel border-2 border-neon-cyan box-glow-cyan p-4 sm:p-6 rounded w-full max-w-2xl relative max-h-[95vh] my-auto overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-arcade text-white mb-4 sm:mb-6 text-center tracking-widest uppercase">PLAYER SETTINGS</h2>
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Picture Section */}
          <div>
            <label className="block text-neon-cyan text-[8px] sm:text-[10px] font-bold uppercase mb-2 sm:mb-3">Profile Picture</label>
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-black/40 rounded border border-neon-cyan/30 flex items-center justify-center">
              <img src={avatar} className="w-14 sm:w-20 h-14 sm:h-20 rounded-full border-2 border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]" alt="Current Avatar" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              {presetAvatars.map((presetAvatar, idx) => (
                <button
                  key={idx}
                  onClick={() => { soundManager.play('click'); setAvatar(presetAvatar); }}
                  className={`p-1 sm:p-2 rounded border-2 transition-all ${
                    avatar === presetAvatar 
                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                      : 'border-slate-700 hover:border-neon-cyan/50'
                  }`}
                >
                  <img src={presetAvatar} className="w-full h-10 sm:h-16 rounded object-cover" alt={`Avatar ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-neon-cyan text-[8px] sm:text-[10px] font-bold uppercase mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-neon-cyan/50 p-2 sm:p-3 text-white font-mono text-xs sm:text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-neon-cyan text-[8px] sm:text-[10px] font-bold uppercase mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black border border-neon-cyan/50 p-2 sm:p-3 text-white font-mono text-xs sm:text-sm h-12 sm:h-16 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button onClick={onClose} className="flex-1 py-2 sm:py-3 border border-red-500 text-red-500 font-arcade text-xs sm:text-sm uppercase">BACK</button>
          <button onClick={handleSave} className="flex-1 py-2 sm:py-3 bg-neon-cyan text-black font-arcade text-xs sm:text-sm font-bold uppercase">SAVE</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, onOpenPayment, onUpdateProfile, onLogout }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const rank = RANK_CONFIG[user.rank];
  const nextRankXp = user.rankXp >= 15 ? 15 : user.rankXp >= 10 ? 15 : user.rankXp >= 5 ? 10 : 5;
  const progress = Math.min((user.rankXp / nextRankXp) * 100, 100);

  return (
    <div className="p-1 sm:p-2 md:p-6 max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-6 pb-24 overflow-x-hidden">
      {onUpdateProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={onUpdateProfile} />}

      {/* Stats Grid - Stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-4">
        <div className="bg-vegas-panel border border-neon-gold/30 p-2 sm:p-2.5 md:p-4 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-8 h-8 bg-neon-gold/5 -translate-y-4 translate-x-4 rotate-45 group-hover:bg-neon-gold/10 transition-colors"></div>
          <h3 className="text-neon-gold text-[7px] sm:text-[8px] md:text-xs font-bold uppercase tracking-widest mb-1">BANKROLL</h3>
          <div className="text-lg sm:text-xl md:text-3xl font-arcade text-white text-glow-gold truncate">${user.balance.toFixed(0)}</div>
          <div className="mt-1.5 sm:mt-2 flex gap-1 sm:gap-1.5">
            <button onClick={() => onOpenPayment('DEPOSIT')} className="flex-1 bg-neon-gold text-black font-bold py-1 sm:py-1.5 uppercase text-[7px] sm:text-[8px] tracking-wide transition-transform active:scale-95">Deposit</button>
            <button onClick={() => onOpenPayment('WITHDRAWAL')} className="flex-1 border border-neon-gold text-neon-gold font-bold py-1 sm:py-1.5 uppercase text-[7px] sm:text-[8px] tracking-wide transition-transform active:scale-95">Out</button>
          </div>
        </div>

        <div className="bg-vegas-panel border p-2 sm:p-2.5 md:p-4 shadow-xl relative" style={{ borderColor: rank.color + '50' }}>
          <h3 className="text-[7px] sm:text-[8px] md:text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: rank.color }}>RANK</h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
             <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full border-2 ${rank.borderColor} flex items-center justify-center bg-black font-arcade text-xs sm:text-sm md:text-lg shrink-0`} style={{ color: rank.color, boxShadow: `0 0 15px ${rank.color}44` }}>{rank.label.charAt(0)}</div>
             <div className="min-w-0 flex-1">
               <span className="text-[7px] sm:text-xs md:text-xl font-arcade text-white uppercase block truncate">{rank.label}</span>
               <span className="text-[6px] sm:text-[7px] md:text-[8px] text-slate-500 font-mono block uppercase">XP: {user.rankXp}/{nextRankXp}</span>
             </div>
          </div>
          <div className="w-full h-0.5 sm:h-0.5 bg-slate-800 rounded overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: rank.color }}></div>
          </div>
        </div>

        <div className="bg-vegas-panel border border-neon-cyan/30 p-2 sm:p-2.5 md:p-4 shadow-xl relative">
          <h3 className="text-neon-cyan text-[7px] sm:text-[8px] md:text-xs font-bold uppercase tracking-widest mb-1">PROFILE</h3>
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5">
               <img src={user.avatar} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]" alt="U" />
               <div className="min-w-0 flex-1"><div className="text-white font-bold font-mono truncate uppercase text-[7px] sm:text-[8px] md:text-xs">{user.username}</div></div>
          </div>
          <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-transparent border border-neon-cyan text-neon-cyan font-bold py-1 sm:py-1.5 uppercase text-[6px] sm:text-[7px] md:text-[8px] tracking-wider hover:bg-neon-cyan/10 transition-colors text-center">EDIT</button>
          {onLogout && (
            <button onClick={onLogout} className="w-full mt-1 sm:mt-1.5 bg-transparent border border-neon-pink text-neon-pink font-bold py-1 sm:py-1.5 uppercase text-[6px] sm:text-[7px] md:text-[8px] tracking-wider hover:bg-neon-pink/10 transition-colors text-center">LOGOUT</button>
          )}
        </div>
      </div>

      {/* History Chart */}
      <div className="bg-vegas-panel border border-slate-800 p-1.5 sm:p-2 md:p-4 h-40 sm:h-48 md:h-64 relative overflow-hidden">
        <h3 className="text-white font-arcade mb-1.5 sm:mb-2 md:mb-3 tracking-widest text-[7px] sm:text-[8px] md:text-sm uppercase">WALLET_HISTORY_NODE</h3>
        <div className="h-[88%] w-full">

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#444" tick={{fill: '#444', fontSize: 9}} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" tick={{fill: '#444', fontSize: 9}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a12', borderColor: '#bf00ff', fontSize: '9px', borderRadius: '0px' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#bf00ff" fill="#bf00ff33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-vegas-panel border border-slate-800 shadow-xl overflow-hidden rounded-sm">
        <div className="p-1.5 sm:p-2 md:p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-neon-cyan rounded-full animate-pulse"></div>
            <h3 className="text-white font-arcade text-[7px] sm:text-[8px] md:text-xs tracking-widest uppercase">LOGS</h3>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[6px] sm:text-[7px] md:text-xs min-w-[420px]">
            <thead className="bg-black/80 text-slate-500 uppercase font-mono">
              <tr>
                <th className="px-1.5 sm:px-3 py-1.5 sm:py-2">Type</th>
                <th className="px-1.5 sm:px-3 py-1.5 sm:py-2">Value</th>
                <th className="px-1.5 sm:px-3 py-1.5 sm:py-2">Status</th>
                <th className="px-1.5 sm:px-3 py-1.5 sm:py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className={`px-1.5 sm:px-3 py-1 sm:py-2 font-bold ${tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'text-neon-green' : 'text-neon-pink'}`}>{tx.type}</td>
                  <td className="px-1.5 sm:px-3 py-1 sm:py-2 text-white">${tx.amount.toFixed(0)}</td>
                  <td className="px-1.5 sm:px-3 py-1 sm:py-2">
                    <span className={`px-1 py-0.5 border text-[5px] sm:text-[6px] ${tx.status === 'COMPLETED' ? 'border-neon-green/50 text-neon-green' : 'border-neon-gold/50 text-neon-gold'}`}>
                      {tx.status.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-1.5 sm:px-3 py-1 sm:py-2 text-slate-600 group-hover:text-slate-400 transition-colors text-[6px] sm:text-[7px]">{tx.date}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-1.5 sm:px-3 py-4 text-center text-slate-700 font-arcade uppercase text-[7px] tracking-wide">
                    No Logs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;