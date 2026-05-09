import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MessageSquare, Send, Plus, LogOut, User as UserIcon, Shield, Target, Users, MapPin, ShoppingCart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Conversation, ChatMessage } from '../types/shared';
import AudienceVisuals from '../components/AudienceVisuals';

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    const res = await api.get('/conversations');
    setConversations(res.data);
    if (res.data.length > 0 && !activeConversation) {
      setActiveConversation(res.data[0].id);
    }
  };

  const fetchMessages = async (id: string) => {
    const res = await api.get(`/conversations/${id}/messages`);
    setMessages(res.data);
  };

  const startNewConversation = async () => {
    const title = prompt('Enter a name for your audience plan:');
    if (!title) return;
    const res = await api.post('/conversations', { title });
    setConversations([res.data, ...conversations]);
    setActiveConversation(res.data.id);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post(`/conversations/${activeConversation}/messages`, { content: input });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const activeSignals = activeAssistantMsg?.signals || [];
  const activeSize = activeAssistantMsg?.estimatedSize || 0;
  const activeInsights = activeAssistantMsg?.insights;

  const handleExport = () => {
    if (activeSignals.length === 0) return;
    
    const manifest = {
      audience_title: conversations.find(c => c.id === activeConversation)?.title || 'Untitled Audience',
      estimated_reach: activeSize,
      timestamp: new Date().toISOString(),
      signals: activeSignals
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audience_manifest_${Date.now()}.json`;
    a.click();
    
    alert('✅ Audience confirmed and manifest exported!');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
            <Target size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '18px' }}>Audiences</h2>
        </div>

        <button 
          onClick={startNewConversation}
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px dashed var(--glass-border)',
            color: 'white',
            padding: '12px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
        >
          <Plus size={18} /> New Plan
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                background: activeConversation === conv.id ? 'var(--primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <MessageSquare size={16} />
              <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conv.title}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={16} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.username}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user?.role === 'admin' ? <Shield size={10} /> : <Activity size={10} />}
                {user?.role}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            style={{ background: 'transparent', color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ 
                  padding: '16px 20px', 
                  borderRadius: '16px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--glass-bg)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  color: 'white',
                  fontSize: '15px',
                  lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', background: 'var(--glass-bg)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '20px 100px 40px' }}>
          <form onSubmit={handleSendMessage} style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your target audience..."
              style={{ width: '100%', padding: '20px 60px 20px 24px', fontSize: '16px', borderRadius: '16px' }}
              disabled={isLoading || !activeConversation}
            />
            <button 
              type="submit"
              disabled={isLoading || !activeConversation}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '12px', 
                background: 'var(--primary)', 
                color: 'white', 
                padding: '10px',
                borderRadius: '12px'
              }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Audience Details */}
      <div style={{ width: '350px', borderLeft: '1px solid var(--border)', background: 'rgba(15, 23, 42, 0.5)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} color="var(--primary)" /> Audience Insight
        </h3>

        <div className="glass" style={{ padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Estimated Reach</p>
          <h2 style={{ fontSize: '32px', color: 'var(--secondary)' }}>{activeSize.toLocaleString()}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Potential individual devices</p>
        </div>

        <AudienceVisuals signals={activeSignals} insights={activeInsights} />

        <div>
          <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Targeting Signals
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeSignals.length > 0 ? activeSignals.map((signal: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  padding: '12px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ color: 'var(--primary)' }}>
                  {signal.type === 'demographic' && <UserIcon size={18} />}
                  {signal.type === 'interest' && <Activity size={18} />}
                  {signal.type === 'location' && <MapPin size={18} />}
                  {signal.type === 'transaction' && <ShoppingCart size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{signal.description}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{signal.type.toUpperCase()}: {signal.value}</p>
                </div>
              </motion.div>
            )) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No signals identified yet.</p>
            )}
          </div>
        </div>

        {activeSignals.length > 0 && (
          <button 
            onClick={handleExport}
            style={{ background: 'var(--secondary)', color: 'white', width: '100%', padding: '14px', fontSize: '16px', marginTop: 'auto' }}
          >
            Confirm & Export Audience
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
