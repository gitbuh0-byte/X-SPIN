import React, { useState } from 'react';
import { User, Transaction } from '../types.ts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RANK_CONFIG } from '../constants.ts';
import { soundManager } from '../services/soundManager.ts';
import { ProfileSettings } from '../components/ProfileSettings.tsx';

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
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const rank = RANK_CONFIG[user.rank];
  const nextRankXp = user.rankXp >= 15 ? 15 : user.rankXp >= 10 ? 15 : user.rankXp >= 5 ? 10 : 5;
  const progress = Math.min((user.rankXp / nextRankXp) * 100, 100);

  return (
    <div className="min-h-screen px-1.5 sm:px-3 md:px-6 py-1.5 sm:py-3 md:py-6 mx-auto max-w-7xl space-y-1.5 sm:space-y-2 md:space-y-4 pb-24 w-full overflow-x-hidden">
      {onUpdateProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={onUpdateProfile} />}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-3 md:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ProfileSettings
              user={user}
              onUpdateProfile={onUpdateProfile || (() => {})}
              onClose={() => setShowProfileSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Stats Grid - Fully responsive with better mobile spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 w-full">
        <div className="bg-vegas-panel border border-neon-gold/30 p-1.5 sm:p-2 md:p-3 shadow-xl relative overflow-hidden group w-full min-h-[80px] sm:min-h-[90px]">
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-neon-gold/5 -translate-y-4 translate-x-4 rotate-45 group-hover:bg-neon-gold/10 transition-colors"></div>
          <h3 className="text-neon-gold text-[6px] sm:text-[7px] md:text-[8px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1">BANKROLL</h3>
          <button
            onClick={() => onOpenPayment('DEPOSIT')}
            className="text-xs sm:text-sm md:text-lg font-arcade text-white text-glow-gold break-words cursor-pointer hover:text-neon-gold transition-colors active:scale-95 w-full text-left py-0.5"
            title="Click to add funds"
          >
            ${user.balance.toFixed(0)}
          </button>
          <div className="mt-1 sm:mt-1.5 flex gap-1 sm:gap-1.5 w-full">
            <button onClick={() => onOpenPayment('DEPOSIT')} className="flex-1 bg-neon-gold text-black font-bold py-0.5 sm:py-1 md:py-1.5 uppercase text-[6px] sm:text-[7px] md:text-[8px] tracking-wide transition-transform active:scale-95 rounded-sm">Deposit</button>
            <button onClick={() => onOpenPayment('WITHDRAWAL')} className="flex-1 border border-neon-gold text-neon-gold font-bold py-0.5 sm:py-1 md:py-1.5 uppercase text-[6px] sm:text-[7px] md:text-[8px] tracking-wide transition-transform active:scale-95 rounded-sm">Withdraw</button>
          </div>
        </div>

        <div className="bg-vegas-panel border p-1.5 sm:p-2 md:p-3 shadow-xl relative w-full min-h-[80px] sm:min-h-[90px]" style={{ borderColor: rank.color + '50' }}>
          <h3 className="text-[6px] sm:text-[7px] md:text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: rank.color }}>RANK</h3>
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5">
             <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border border-2 ${rank.borderColor} flex items-center justify-center bg-black font-arcade text-[6px] sm:text-[7px] md:text-sm shrink-0`} style={{ color: rank.color, boxShadow: `0 0 10px ${rank.color}44` }}>{rank.label.charAt(0)}</div>
             <div className="min-w-0 flex-1">
               <span className="text-[6px] sm:text-[7px] md:text-sm font-arcade text-white uppercase block break-words line-clamp-1">{rank.label}</span>
               <span className="text-[5px] sm:text-[6px] md:text-[7px] text-slate-500 font-mono block uppercase line-clamp-1">XP: {user.rankXp}/{nextRankXp}</span>
             </div>
          </div>
          <div className="w-full h-0.5 bg-slate-800 rounded overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: rank.color }}></div>
          </div>
        </div>

        <div className="bg-vegas-panel border border-neon-cyan/30 p-1.5 sm:p-2 md:p-3 shadow-xl relative w-full min-h-[80px] sm:min-h-[90px]">
          <h3 className="text-neon-cyan text-[6px] sm:text-[7px] md:text-[8px] font-bold uppercase tracking-widest mb-1">PROFILE</h3>
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5">
               <img src={user.avatar} className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border border-2 border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)] shrink-0" alt="U" />
               <div className="min-w-0 flex-1"><div className="text-white font-bold font-mono break-words uppercase text-[6px] sm:text-[7px] md:text-[8px] line-clamp-1">{user.username}</div></div>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-transparent border border-neon-cyan text-neon-cyan font-bold py-0.5 sm:py-1 md:py-1.5 uppercase text-[5px] sm:text-[6px] md:text-[7px] tracking-wider hover:bg-neon-cyan/10 transition-colors text-center rounded-sm">EDIT</button>
            <button onClick={() => setShowProfileSettings(true)} className="w-full bg-transparent border border-neon-green text-neon-green font-bold py-0.5 sm:py-1 md:py-1.5 uppercase text-[5px] sm:text-[6px] md:text-[7px] tracking-wider hover:bg-neon-green/10 transition-colors text-center rounded-sm">INFO</button>
            {onLogout && (
              <button onClick={onLogout} className="w-full bg-transparent border border-neon-pink text-neon-pink font-bold py-0.5 sm:py-1 md:py-1.5 uppercase text-[5px] sm:text-[6px] md:text-[7px] tracking-wider hover:bg-neon-pink/10 transition-colors text-center rounded-sm">LOGOUT</button>
            )}
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="bg-vegas-panel border border-slate-800 p-1 sm:p-2 md:p-3 h-24 sm:h-32 md:h-48 relative overflow-hidden w-full">
        <h3 className="text-white font-arcade mb-0.5 sm:mb-1 md:mb-1.5 tracking-widest text-[6px] sm:text-[7px] md:text-[8px] uppercase">WALLET HISTORY</h3>
        <div className="h-[calc(100%-1rem)] sm:h-[calc(100%-1.5rem)] w-full">

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 3, right: 3, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#444" tick={{fill: '#444', fontSize: 7}} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" tick={{fill: '#444', fontSize: 7}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a12', borderColor: '#bf00ff', fontSize: '8px', borderRadius: '0px' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#bf00ff" fill="#bf00ff33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-vegas-panel border border-slate-800 shadow-xl overflow-hidden rounded-sm w-full">
        <div className="p-1.5 sm:p-2 md:p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse"></div>
            <h3 className="text-white font-arcade text-[6px] sm:text-[7px] md:text-[8px] tracking-widest uppercase">TRANSACTIONS</h3>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-[6px] sm:text-[7px] md:text-[8px] min-w-full">
            <thead className="bg-black/80 text-slate-500 uppercase font-mono">
              <tr>
                <th className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[6px] sm:text-[7px] md:text-[8px]">Type</th>
                <th className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[6px] sm:text-[7px] md:text-[8px]">Amount</th>
                <th className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[6px] sm:text-[7px] md:text-[8px] hidden sm:table-cell">Status</th>
                <th className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[6px] sm:text-[7px] md:text-[8px] hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono text-[6px] sm:text-[7px] md:text-[8px]">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className={`px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 font-bold ${tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'text-neon-green' : 'text-neon-pink'}`}>{tx.type.substring(0, 3)}</td>
                  <td className="px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 text-white whitespace-nowrap">${tx.amount.toFixed(0)}</td>
                  <td className="px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 hidden sm:table-cell">
                    <span className={`px-0.5 py-0.25 border text-[5px] sm:text-[6px] rounded-sm inline-block ${tx.status === 'COMPLETED' ? 'border-neon-green/50 text-neon-green' : 'border-neon-gold/50 text-neon-gold'}`}>
                      {tx.status.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 text-slate-600 group-hover:text-slate-400 transition-colors text-[5px] sm:text-[6px] md:text-[7px] hidden md:table-cell">{tx.date.substring(0, 10)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 text-center text-slate-700 font-arcade uppercase text-[6px] sm:text-[7px] tracking-wide">
                    No History
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