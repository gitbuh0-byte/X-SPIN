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

  if (!isOpen) return null;

  const handleSave = () => { onSave({ username, avatar, email, bio }); soundManager.play('lock'); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-vegas-panel border-2 border-neon-cyan box-glow-cyan p-6 rounded max-w-md w-full relative">
        <h2 className="text-xl font-arcade text-white mb-6 text-center tracking-widest uppercase">PLAYER SETTINGS</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-neon-cyan text-[10px] font-bold uppercase mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-neon-cyan/50 p-3 text-white font-mono text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-neon-cyan text-[10px] font-bold uppercase mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black border border-neon-cyan/50 p-3 text-white font-mono text-sm h-16 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 py-3 border border-red-500 text-red-500 font-arcade text-xs uppercase">BACK</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-neon-cyan text-black font-arcade text-xs font-bold uppercase">SAVE</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, onOpenPayment, onUpdateProfile }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const rank = RANK_CONFIG[user.rank];
  const nextRankXp = user.rankXp >= 15 ? 15 : user.rankXp >= 10 ? 15 : user.rankXp >= 5 ? 10 : 5;
  const progress = Math.min((user.rankXp / nextRankXp) * 100, 100);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 overflow-x-hidden">
      {onUpdateProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={onUpdateProfile} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-vegas-panel border border-neon-gold/30 p-4 md:p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-neon-gold/5 -translate-y-8 translate-x-8 rotate-45 group-hover:bg-neon-gold/10 transition-colors"></div>
          <h3 className="text-neon-gold text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">BANKROLL</h3>
          <div className="text-3xl md:text-4xl font-arcade text-white text-glow-gold truncate">${user.balance.toFixed(0)}</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => onOpenPayment('DEPOSIT')} className="flex-1 bg-neon-gold text-black font-bold py-2.5 uppercase text-[10px] tracking-wider transition-transform active:scale-95">Deposit</button>
            <button onClick={() => onOpenPayment('WITHDRAWAL')} className="flex-1 border border-neon-gold text-neon-gold font-bold py-2.5 uppercase text-[10px] tracking-wider transition-transform active:scale-95">Cash Out</button>
          </div>
        </div>

        <div className="bg-vegas-panel border p-4 md:p-6 shadow-xl relative" style={{ borderColor: rank.color + '50' }}>
          <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4" style={{ color: rank.color }}>PLAYER RANK</h3>
          <div className="flex items-center gap-4 mb-4">
             <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 ${rank.borderColor} flex items-center justify-center bg-black font-arcade text-xl shrink-0`} style={{ color: rank.color, boxShadow: `0 0 15px ${rank.color}44` }}>{rank.label.charAt(0)}</div>
             <div className="min-w-0">
               <span className="text-lg md:text-2xl font-arcade text-white uppercase block truncate">{rank.label}</span>
               <span className="text-[9px] text-slate-500 font-mono block uppercase">XP: {user.rankXp} / {nextRankXp}</span>
             </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: rank.color }}></div>
          </div>
        </div>

        <div className="bg-vegas-panel border border-neon-cyan/30 p-4 md:p-6 shadow-xl relative">
          <h3 className="text-neon-cyan text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3">PROFILE</h3>
          <div className="flex items-center gap-3 mb-4">
               <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]" alt="U" />
               <div className="min-w-0"><div className="text-white font-bold font-mono truncate uppercase text-sm">{user.username}</div></div>
          </div>
          <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-transparent border border-neon-cyan text-neon-cyan font-bold py-2.5 uppercase text-[10px] tracking-wider hover:bg-neon-cyan/10 transition-colors">EDIT_NEURAL_LINK</button>
        </div>
      </div>

      {/* History Chart */}
      <div className="bg-vegas-panel border border-slate-800 p-4 md:p-6 h-64 md:h-80 relative overflow-hidden">
        <h3 className="text-white font-arcade mb-6 tracking-widest text-[10px] md:text-sm uppercase">WALLET_HISTORY_NODE</h3>
        <div className="h-[80%] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#444" tick={{fill: '#444', fontSize: 10}} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" tick={{fill: '#444', fontSize: 10}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a12', borderColor: '#bf00ff', fontSize: '10px', borderRadius: '0px' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#bf00ff" fill="#bf00ff33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-vegas-panel border border-slate-800 shadow-xl overflow-hidden rounded-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
            <h3 className="text-white font-arcade text-[10px] md:text-sm tracking-widest uppercase">TRANSACTION_LOGS</h3>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-black/80 text-slate-500 text-[10px] uppercase font-mono">
              <tr>
                <th className="px-6 py-4">Protocol_Type</th>
                <th className="px-6 py-4">Quantum_Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono text-[11px] md:text-xs">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className={`px-6 py-4 font-bold ${tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'text-neon-green' : 'text-neon-pink'}`}>{tx.type}</td>
                  <td className="px-6 py-4 text-white">${tx.amount.toFixed(0)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 border text-[9px] ${tx.status === 'COMPLETED' ? 'border-neon-green/50 text-neon-green' : 'border-neon-gold/50 text-neon-gold'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 group-hover:text-slate-400 transition-colors">{tx.date}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-700 font-arcade uppercase text-[10px] tracking-[0.2em]">
                    No Logs Found in Local Buffer
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