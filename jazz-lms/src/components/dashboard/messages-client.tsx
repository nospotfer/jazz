'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Loader2, Mail, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Thread = {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName: string | null;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  threadId: string;
  senderId: string;
  senderEmail: string;
  senderName: string | null;
  senderRole: 'student' | 'professor';
  body: string;
  createdAt: string;
};

export function MessagesClient() {
  const [loading, setLoading] = useState(true);
  const [isProfessor, setIsProfessor] = useState(false);
  const [professorEmail, setProfessorEmail] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const loadThreads = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/messages');
      const nextThreads: Thread[] = response.data.threads || [];
      const nextIsProfessor = Boolean(response.data.isProfessor);
      setThreads(nextThreads);
      setIsProfessor(nextIsProfessor);
      setProfessorEmail(String(response.data.professorEmail || ''));
      setSelectedThreadId((current) =>
        current && nextThreads.some((thread) => thread.id === current) ? current : null
      );
    } catch {
      toast.error('Could not load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const response = await axios.get(`/api/messages/${threadId}`);
      setMessages(response.data.messages || []);
      setProfessorEmail(String(response.data.professorEmail || professorEmail));
    } catch {
      toast.error('Could not load this conversation.');
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    loadThreadMessages(selectedThreadId);
  }, [selectedThreadId]);

  const handleCreateThread = async (event: FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || isSending || submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSending(true);
    setSendStatus('Sending...');
    try {
      const response = await axios.post('/api/messages', {
        subject,
        message: newMessage,
      });

      const createdThreadId = String(response.data?.id || '');
      const createdAt = String(response.data?.createdAt || new Date().toISOString());
      const normalizedSubject = subject.trim() || 'General message';
      const pendingMessageBody = newMessage;

      if (createdThreadId) {
        const optimisticThread: Thread = {
          id: createdThreadId,
          studentId: '',
          studentEmail: '',
          studentName: null,
          subject: normalizedSubject,
          createdAt,
          updatedAt: createdAt,
          lastMessage: pendingMessageBody,
          lastMessageAt: createdAt,
          unreadCount: 0,
        };

        setThreads((previous) => {
          const exists = previous.some((thread) => thread.id === createdThreadId);
          if (exists) {
            return previous.map((thread) =>
              thread.id === createdThreadId
                ? {
                    ...thread,
                    subject: normalizedSubject,
                    updatedAt: createdAt,
                    lastMessage: pendingMessageBody,
                    lastMessageAt: createdAt,
                  }
                : thread
            );
          }
          return [optimisticThread, ...previous];
        });

        setSelectedThreadId(createdThreadId);
        setMessages([
          {
            id: `local-${Date.now()}`,
            threadId: createdThreadId,
            senderId: 'me',
            senderEmail: 'you',
            senderName: 'You',
            senderRole: 'student',
            body: pendingMessageBody,
            createdAt,
          },
        ]);
      }

      setSubject('');
      setNewMessage('');
      loadThreads();
      if (createdThreadId) {
        loadThreadMessages(createdThreadId);
      }
      setSendStatus('Sent now');
      const createdNewThread = Boolean(response.data?.createdNewThread);
      toast.success(
        createdNewThread
          ? 'Sent. New conversation created in Inbox.'
          : 'Sent. Message added to existing conversation.'
      );
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data || 'Could not send message.')
        : 'Could not send message.';
      setSendStatus('Failed to send');
      toast.error(message);
    } finally {
      setIsSending(false);
      submitLockRef.current = false;
    }
  };

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThreadId || !replyText.trim() || isSending || submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSending(true);
    setSendStatus('Sending...');
    try {
      const optimisticCreatedAt = new Date().toISOString();
      const optimisticBody = replyText;

      setMessages((previous) => [
        ...previous,
        {
          id: `local-reply-${Date.now()}`,
          threadId: selectedThreadId,
          senderId: 'me',
          senderEmail: 'you',
          senderName: 'You',
          senderRole: isProfessor ? 'professor' : 'student',
          body: optimisticBody,
          createdAt: optimisticCreatedAt,
        },
      ]);

      setThreads((previous) =>
        previous.map((thread) =>
          thread.id === selectedThreadId
            ? {
                ...thread,
                updatedAt: optimisticCreatedAt,
                lastMessage: optimisticBody,
                lastMessageAt: optimisticCreatedAt,
              }
            : thread
        )
      );

      await axios.post(`/api/messages/${selectedThreadId}`, {
        message: replyText,
      });
      setReplyText('');
      loadThreadMessages(selectedThreadId);
      loadThreads();
      setSendStatus('Sent now');
      toast.success('Reply sent successfully.');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data || 'Could not send reply.')
        : 'Could not send reply.';
      setSendStatus('Failed to send');
      toast.error(message);
    } finally {
      setIsSending(false);
      submitLockRef.current = false;
    }
  };

  const handleCloseConversation = () => {
    setSelectedThreadId(null);
    setMessages([]);
    setReplyText('');
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          {isProfessor
            ? 'Inbox — reply to student messages directly from the platform.'
            : 'Send questions to Professor Enric Vázquez.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-4">
        <aside className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Inbox Conversations</p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No messages yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[62dvh] overflow-y-auto pr-1">
              {threads.map((thread) => {
                const active = selectedThreadId === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      active ? 'border-primary/60 bg-primary/10' : 'border-border hover:bg-accent/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{thread.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {isProfessor
                        ? `${thread.studentEmail} • ID: ${thread.studentId}`
                        : (thread.lastMessage || 'No messages')}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {new Date(thread.updatedAt).toLocaleString('pt-BR')}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex mt-1 text-[11px] px-1.5 py-0.5 rounded-full border border-primary/40 text-primary">
                        {thread.unreadCount} unread
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
          {!isProfessor && !selectedThread && (
            <form onSubmit={handleCreateThread} className="space-y-2.5 border border-border rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground">Compose</p>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject (optional)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Write your message to Professor Enric Vázquez..."
                className="w-full min-h-[110px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
              />
              <Button type="submit" disabled={isSending || !newMessage.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send
              </Button>
              {sendStatus && <p className="text-xs text-muted-foreground">Status: {sendStatus}</p>}
            </form>
          )}

          {selectedThread ? (
            <>
              <div className="border-b border-border pb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{selectedThread.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isProfessor
                      ? `Student: ${selectedThread.studentEmail} • ID: ${selectedThread.studentId}`
                      : 'Professor Enric Vázquez'}
                  </p>
                </div>
                {!isProfessor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseConversation}
                    aria-label="Close conversation"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-[45dvh] overflow-y-auto pr-1">
                {messages.map((message) => {
                  return (
                    <div key={message.id} className="rounded-lg border border-border bg-background px-3 py-2.5">
                      <p className="text-xs text-muted-foreground mb-1">
                        {message.senderRole === 'professor' ? 'Professor Enric Vázquez' : (message.senderName || message.senderEmail)} •{' '}
                        {new Date(message.createdAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{message.body}</p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReply} className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={isProfessor ? 'Reply as Professor Enric Vázquez...' : 'Write your reply...'}
                  className="w-full min-h-[90px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
                />
                <Button type="submit" disabled={isSending || !replyText.trim()}>
                  {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Reply
                </Button>
              </form>
            </>
          ) : !isProfessor ? null : (
            <div className="py-14 text-center text-muted-foreground text-sm">
              {isProfessor
                ? 'Select a conversation from Inbox to open the chat.'
                : 'Select a conversation from Inbox to open the chat.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
