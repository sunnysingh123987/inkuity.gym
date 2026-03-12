'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SendHorizontal, Loader2, MessageSquare } from 'lucide-react';
import { sendFeedbackMessage, getFeedbackMessages } from '@/lib/actions/reviews';
import { toast } from '@/components/ui/toaster';
import type { FeedbackMessage } from '@/types/database';

interface FeedbackChatProps {
  memberId: string;
  gymId: string;
  initialMessages: FeedbackMessage[];
}

export function FeedbackChat({
  memberId,
  gymId,
  initialMessages,
}: FeedbackChatProps) {
  const [messages, setMessages] = useState<FeedbackMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const poll = setInterval(async () => {
      const result = await getFeedbackMessages(memberId, gymId);
      if (result.success && result.data) {
        setMessages((prev) => {
          // Keep optimistic (temp-) messages, merge real ones
          const tempIds = new Set(prev.filter((m) => m.id.startsWith('temp-')).map((m) => m.id));
          const tempMessages = prev.filter((m) => tempIds.has(m.id));
          const incoming = result.data!;
          // If server has more real messages than we do, update
          const prevReal = prev.filter((m) => !m.id.startsWith('temp-'));
          if (incoming.length !== prevReal.length || (incoming.length > 0 && incoming[incoming.length - 1].id !== prevReal[prevReal.length - 1]?.id)) {
            return [...incoming, ...tempMessages];
          }
          return prev;
        });
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [memberId, gymId]);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  // Count consecutive trailing member messages (no inkuity reply after them)
  const consecutiveMemberCount = (() => {
    let count = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_type === 'member') count++;
      else break;
    }
    return count;
  })();
  const limitReached = consecutiveMemberCount >= 5;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending || limitReached) return;

    // Optimistic update
    const optimistic: FeedbackMessage = {
      id: `temp-${Date.now()}`,
      gym_id: gymId,
      member_id: memberId,
      message: text,
      sender_type: 'member',
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    setSending(true);
    const result = await sendFeedbackMessage(memberId, gymId, text);
    setSending(false);

    if (result.success && result.data) {
      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? result.data! : m))
      );
    } else {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(result.error || 'Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain space-y-1 px-1 pb-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-full bg-brand-cyan-500/10 flex items-center justify-center mb-3">
              <MessageSquare className="h-7 w-7 text-brand-cyan-400" />
            </div>
            <p className="text-sm font-medium text-white">Start a conversation</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
              Share your feedback, suggestions, or questions with us. We&apos;re listening!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_type === 'member';
              const prevMsg = messages[i - 1];
              const showDate = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
              const showTail =
                !prevMsg ||
                prevMsg.sender_type !== msg.sender_type ||
                showDate;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-slate-600 glass-pill px-2.5 py-0.5 rounded-full">
                        {formatDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-2' : 'mt-0.5'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                        isMe
                          ? `bg-brand-cyan-500/15 text-slate-100 ${showTail ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-br-md'}`
                          : `glass text-slate-200 ${showTail ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-bl-md'}`
                      }`}
                    >
                      {!isMe && showTail && (
                        <p className="text-[10px] font-semibold text-brand-cyan-400 mb-0.5">
                          Inkuity
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMe ? 'text-brand-cyan-400/50 text-right' : 'text-slate-600'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-white/[0.06] pt-3">
        {limitReached ? (
          <p className="text-xs text-amber-400/80 text-center py-2">
            Please wait for a reply before sending more messages.
          </p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Type your feedback..."
                rows={1}
                className="flex-1 resize-none rounded-xl glass-input px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 max-h-[120px]"
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
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
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
