'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  SendHorizontal,
  Loader2,
  MessageSquare,
  Circle,
} from 'lucide-react';
import {
  getFeedbackMessages,
  sendInkuityReply,
  markConversationRead,
  getAllFeedbackConversations,
} from '@/lib/actions/reviews';
import type { FeedbackConversation } from '@/lib/actions/reviews';
import type { FeedbackMessage } from '@/types/database';
import { toast } from '@/components/ui/toaster';

interface FeedbackInboxProps {
  conversations: FeedbackConversation[];
}

export function FeedbackInbox({ conversations: initial }: FeedbackInboxProps) {
  const [conversations, setConversations] = useState(initial);
  const [selected, setSelected] = useState<FeedbackConversation | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Poll conversation list every 5s when on list view
  useEffect(() => {
    if (selected) return; // Don't poll list when in detail view
    const poll = setInterval(async () => {
      const result = await getAllFeedbackConversations();
      if (result.success && result.data) {
        setConversations(result.data);
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [selected]);

  // Poll messages every 5s when viewing a conversation
  useEffect(() => {
    if (!selected) return;
    const poll = setInterval(async () => {
      const result = await getFeedbackMessages(selected.member_id, selected.gym_id);
      if (result.success && result.data) {
        setMessages((prev) => {
          const tempMessages = prev.filter((m) => m.id.startsWith('temp-'));
          const incoming = result.data!;
          const prevReal = prev.filter((m) => !m.id.startsWith('temp-'));
          if (incoming.length !== prevReal.length || (incoming.length > 0 && incoming[incoming.length - 1].id !== prevReal[prevReal.length - 1]?.id)) {
            return [...incoming, ...tempMessages];
          }
          return prev;
        });
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [selected]);

  const openConversation = async (conv: FeedbackConversation) => {
    setSelected(conv);
    setLoadingMessages(true);

    const [msgResult] = await Promise.all([
      getFeedbackMessages(conv.member_id, conv.gym_id),
      conv.unread_count > 0 ? markConversationRead(conv.member_id, conv.gym_id) : Promise.resolve(),
    ]);

    setMessages(msgResult.data || []);
    setLoadingMessages(false);

    // Clear unread badge locally
    if (conv.unread_count > 0) {
      setConversations((prev) =>
        prev.map((c) =>
          c.member_id === conv.member_id && c.gym_id === conv.gym_id
            ? { ...c, unread_count: 0 }
            : c
        )
      );
    }
  };

  const goBack = () => {
    setSelected(null);
    setMessages([]);
    setDraft('');
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!selected || !draft.trim() || sending) return;
    const text = draft.trim();

    // Optimistic
    const optimistic: FeedbackMessage = {
      id: `temp-${Date.now()}`,
      gym_id: selected.gym_id,
      member_id: selected.member_id,
      message: text,
      sender_type: 'inkuity',
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    setSending(true);
    const result = await sendInkuityReply(selected.member_id, selected.gym_id, text);
    setSending(false);

    if (result.success && result.data) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? result.data! : m)));
      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.member_id === selected.member_id && c.gym_id === selected.gym_id
            ? { ...c, last_message: text, last_message_at: result.data!.created_at, last_sender: 'inkuity' }
            : c
        )
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(result.error || 'Failed to send reply');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Detail view ───────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <button
            onClick={goBack}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {selected.member_name}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {selected.gym_name}
              {selected.member_email && ` · ${selected.member_email}`}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain space-y-1 py-4 px-1"
        >
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              No messages yet
            </div>
          ) : (
            messages.map((msg, i) => {
              const isInkuity = msg.sender_type === 'inkuity';
              const prevMsg = messages[i - 1];
              const showDate = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
              const showTail = !prevMsg || prevMsg.sender_type !== msg.sender_type || showDate;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-slate-600 bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                        {formatDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isInkuity ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-2' : 'mt-0.5'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 text-sm leading-relaxed ${
                        isInkuity
                          ? 'bg-brand-cyan-500/15 text-slate-100 rounded-2xl rounded-br-md'
                          : 'bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {isInkuity && showTail && (
                        <p className="text-[10px] font-semibold text-brand-cyan-400 mb-0.5">You (Inkuity)</p>
                      )}
                      {!isInkuity && showTail && (
                        <p className="text-[10px] font-semibold text-purple-400 mb-0.5">{selected.member_name}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isInkuity ? 'text-brand-cyan-400/50 text-right' : 'text-slate-600'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply input */}
        <div className="shrink-0 border-t border-slate-800 pt-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Reply as Inkuity..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 max-h-[120px]"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="shrink-0 h-10 w-10 rounded-xl bg-brand-cyan-500 flex items-center justify-center text-white hover:bg-brand-cyan-600 active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Feedback Inbox</h1>
        <span className="text-xs text-slate-500">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-300">No conversations yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Member feedback will appear here when they start chatting.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={`${conv.member_id}::${conv.gym_id}`}
              onClick={() => openConversation(conv)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-800/60 active:bg-slate-800/80 transition-colors text-left"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-slate-400">
                  {(conv.member_name || '?').charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-white' : 'font-medium text-slate-300'}`}>
                    {conv.member_name}
                  </p>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {formatRelative(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
                    {conv.last_sender === 'inkuity' && (
                      <span className="text-brand-cyan-400/70">You: </span>
                    )}
                    {conv.last_message}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-600">{conv.gym_name}</span>
                    {conv.unread_count > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-brand-cyan-500 text-[10px] font-bold text-white px-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
