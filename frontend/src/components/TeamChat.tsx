'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, User, Clock, MessageSquare, Shield } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  team_id: string;
  created_at: string;
  sender_name?: string;
};

export default function TeamChat({ teamId, userId, leaderId }: { teamId: string, userId: string, leaderId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map((m: any) => ({
          ...m,
          sender_name: m.sender?.name || 'Unknown'
        })));
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`team-${teamId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `team_id=eq.${teamId}`
      }, async (payload) => {
        const newMsg = payload.new as Message;
        // Fetch sender name for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', newMsg.sender_id)
          .single();
        
        setMessages(prev => [...prev, { ...newMsg, sender_name: profile?.name || 'Unknown' }]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        team_id: teamId,
        sender_id: userId,
        content: content
      });

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } else {
      // Send notifications to all team members except sender
      try {
        // 1. Get all accepted members
        const { data: apps } = await supabase
          .from('applications')
          .select('user_id')
          .eq('team_id', teamId)
          .eq('status', 'accepted');
        
        // 2. Get team leader
        const { data: team } = await supabase
          .from('teams')
          .select('created_by, team_name')
          .eq('id', teamId)
          .single();

        if (team) {
          const recipientIds = new Set([
            ...(apps?.map(a => a.user_id) || []),
            team.created_by
          ]);
          
          // Remove sender
          recipientIds.delete(userId);

          // 3. Create notifications
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', userId)
            .single();

          const notifications = Array.from(recipientIds).map(recipientId => ({
            recipient_id: recipientId,
            type: 'chat',
            title: `Team Chat: ${team.team_name}`,
            message: `${senderProfile?.name || 'Someone'}: ${content.length > 50 ? `${content.substring(0, 50)}...` : content}`,
            link: `/teams/${teamId}`,
            is_read: false
          }));

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }
      } catch (err) {
        console.error('Error sending chat notifications:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center glass rounded-3xl">
        <div className="w-6 h-6 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white leading-none">Team Chat</h3>
          <p className="text-[10px] text-[#64748b] mt-1 uppercase tracking-widest font-bold">Encrypted & Secure</p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            const isLeader = msg.sender_id === leaderId;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!isMe && (
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase">
                      {msg.sender_name}
                      {isLeader && <span className="ml-1 text-[#f59e0b]">★</span>}
                    </span>
                  )}
                  <span className="text-[8px] text-[#64748b]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span className="text-[10px] font-bold text-[#a78bfa] uppercase ml-1">You</span>
                  )}
                </div>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                    isMe 
                      ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white rounded-tr-none' 
                      : 'glass-strong text-[#f1f5f9] rounded-tl-none border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 transition-all placeholder:text-[#64748b]"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
