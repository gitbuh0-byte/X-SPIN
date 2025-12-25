import React, { useState } from 'react';
import { soundManager } from '../services/soundManager.ts';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

const HelpCentre: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Welcome to X-SPIN Support! How can we help you today?',
      sender: 'support',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: 'account',
      title: '💳 Account & Payments',
      items: [
        { q: 'How do I add funds?', a: 'Click on your balance in the dashboard or go to Bankroll > Deposit to add funds instantly.' },
        { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, bank transfers, and digital wallets.' },
        { q: 'How long do deposits take?', a: 'Most deposits are instant. Bank transfers may take 1-2 business days.' },
        { q: 'Can I withdraw my winnings?', a: 'Yes! Go to Bankroll > Withdrawal to cash out your winnings anytime.' }
      ]
    },
    {
      id: 'gameplay',
      title: '🎡 Gameplay & Rules',
      items: [
        { q: 'What is BLITZ mode?', a: 'BLITZ is a fast-paced game with 15 players. Choose your color, spin the wheel, and win!' },
        { q: 'How does GRAND PRIX work?', a: 'GRAND PRIX features 100 players divided into 10 groups. Each group competes separately, and winners compete in the final round.' },
        { q: 'Can I play multiple games at once?', a: 'No, you can only play one game at a time. Finish or exit the current game to start a new one.' },
        { q: 'What happens if I disconnect?', a: 'Your game will pause. Reconnect within 5 minutes to resume. After 5 minutes, you forfeit.' }
      ]
    },
    {
      id: 'technical',
      title: '⚙️ Technical Support',
      items: [
        { q: 'Which browsers are supported?', a: 'We support Chrome, Firefox, Safari, and Edge (latest versions).' },
        { q: 'The game is lagging. What should I do?', a: 'Try: 1) Refresh the page, 2) Close other tabs, 3) Check your internet speed.' },
        { q: 'I lost my password. How do I reset it?', a: 'Click "Forgot Password" on the login page and follow the email instructions.' },
        { q: 'The game won\'t load. Help!', a: 'Clear your browser cache and cookies, then try again. If issues persist, contact support.' }
      ]
    },
    {
      id: 'security',
      title: '🔒 Security & Privacy',
      items: [
        { q: 'Is my data secure?', a: 'Yes! We use bank-level encryption (SSL/TLS) and comply with GDPR & CCPA.' },
        { q: 'Can I see my transaction history?', a: 'Yes! Go to Dashboard > LOGS to view all your transactions.' },
        { q: 'How do I delete my account?', a: 'Go to Account Info > Danger Zone > Delete Account. This is permanent.' },
        { q: 'Do you share my data?', a: 'No. Your data is never sold. See our Privacy Policy for details.' }
      ]
    }
  ];

  const handleSendMessage = () => {
    if (!input.trim()) return;

    soundManager.play('click');
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate support response after 1s
    setTimeout(() => {
      const supportMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message! Our team will respond within 24 hours. If you need immediate help, check the FAQ below.',
        sender: 'support',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supportMsg]);
      soundManager.play('ding');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">❓</div>
          <h1 className="text-3xl sm:text-4xl font-arcade font-black text-neon-cyan mb-2">HELP CENTRE</h1>
          <p className="text-neon-green">Get answers fast or chat with our support team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: FAQ */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-arcade text-neon-cyan mb-4 uppercase">Frequently Asked Questions</h2>
            
            {faqs.map(section => (
              <div key={section.id} className="bg-slate-900/40 border border-neon-cyan/20 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => setExpandedFaq(expandedFaq === section.id ? null : section.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-neon-cyan/5 transition-colors text-left"
                >
                  <span className="font-arcade text-sm sm:text-base text-neon-cyan">{section.title}</span>
                  <span className="text-neon-cyan text-xl">{expandedFaq === section.id ? '▾' : '▸'}</span>
                </button>

                {/* FAQ Items */}
                {expandedFaq === section.id && (
                  <div className="border-t border-neon-cyan/10 divide-y divide-neon-cyan/10">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="p-4 sm:p-5 bg-black/20">
                        <h4 className="text-sm sm:text-base text-neon-gold font-bold mb-2">{item.q}</h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-neon-green/30 rounded-lg overflow-hidden flex flex-col h-[500px] sm:h-[600px]">
              {/* Chat Header */}
              <div className="bg-neon-green/10 border-b border-neon-green/30 p-4">
                <h3 className="font-arcade text-sm text-neon-green uppercase font-bold">💬 Live Chat</h3>
                <p className="text-[10px] text-neon-green/60 mt-1">Response time: ~1 hour</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded px-3 py-2 text-[11px] sm:text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-neon-green text-black font-bold'
                          : 'bg-slate-800 border border-neon-cyan/20 text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-neon-green/20 p-3 bg-black/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your question..."
                    className="flex-1 bg-black/60 border border-neon-green/20 rounded px-3 py-2 text-[11px] sm:text-xs text-white placeholder-slate-600 focus:border-neon-green focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-neon-green text-black px-3 py-2 rounded text-sm font-bold hover:bg-neon-green/80 transition-colors active:scale-95"
                  >
                    📤
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-6 sm:p-8 text-center">
          <h3 className="font-arcade text-lg text-neon-cyan mb-3">Need More Help?</h3>
          <p className="text-sm text-slate-300 mb-4">Our support team is available 24/7</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:support@x-spin.com" className="px-6 py-2 bg-neon-cyan text-black font-bold rounded hover:bg-white transition-colors">
              📧 Email Support
            </a>
            <a href="tel:+1234567890" className="px-6 py-2 border-2 border-neon-cyan text-neon-cyan font-bold rounded hover:bg-neon-cyan/10 transition-colors">
              ☎️ Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
