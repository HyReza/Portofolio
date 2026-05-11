import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Reply, Edit2, MessageCircle, X, Lock, Sparkles, Code, Bold, Italic, ArrowDown, LogOut } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAchievements } from '@/hooks/useGimmicks';
import { PublicLayout } from '@/layouts/PublicLayout';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatSkeleton from '@/components/chat/ChatSkeleton';
import type { Message } from '@/components/chat/ChatBubble';

export default function ChatPage() {
    const { theme: appTheme, t, lang } = useApp();
    const { unlock } = useAchievements();
    const dk = appTheme === 'dark';
    const { props } = usePage<any>();
    const auth = props.auth as { user: { id: number; name: string; email: string; avatar: string | null; role?: string } | null };
    const flash = props.flash as { error?: string; success?: string } | undefined;
    const user = auth.user;

    const siteProfile = props.siteProfile || {};
    const adminPhoto = lang === 'id'
        ? (siteProfile['profile_photo']?.value_id || siteProfile['profile_photo']?.value_en || '/assets/img/profil.jpeg')
        : (siteProfile['profile_photo']?.value_en || siteProfile['profile_photo']?.value_id || '/assets/img/profil.jpeg');
    const adminName = lang === 'id'
        ? (siteProfile['name']?.value_id || siteProfile['name']?.value_en || 'Reza Edi Saputra')
        : (siteProfile['name']?.value_en || siteProfile['name']?.value_id || 'Reza Edi Saputra');

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [editMsg, setEditMsg] = useState<Message | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // CSRF helper
    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    // Fetch messages with loading state
    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch { /* silent */ } finally {
            setIsLoading(false);
        }
    }, []);

    // 1.5s polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 1500);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Auto-scroll
    const prevCount = useRef(0);
    const initialLoad = useRef(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (listRef.current) {
            listRef.current.scrollTo({
                top: listRef.current.scrollHeight,
                behavior
            });
        }
    };

    const isNearBottom = () => {
        if (!listRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        return scrollHeight - scrollTop - clientHeight < 120;
    };

    // Scroll button visibility + new message indicator
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const handleScroll = () => {
            const scrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 200;
            setShowScrollBtn(scrolledUp);
            if (!scrolledUp) setHasNewMessages(false);
        };

        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    // Trap scroll inside chat area — prevent page scroll when hovering chat
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const atTop = scrollTop <= 0 && e.deltaY < 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;

            // Only prevent page scroll if chat can still scroll in that direction
            if (!atTop && !atBottom) {
                e.preventDefault();
                el.scrollTop += e.deltaY;
            } else if (atTop || atBottom) {
                // Already at edge — still prevent page scroll to keep UX inside chat
                e.preventDefault();
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    // Initial load → scroll to bottom instantly
    useEffect(() => {
        if (!isLoading && initialLoad.current) {
            initialLoad.current = false;
            setTimeout(() => scrollToBottom('auto'), 50);
        }
    }, [isLoading]);

    // New messages arrive — only auto-scroll if user is near bottom, otherwise show indicator
    useEffect(() => {
        if (messages.length > prevCount.current) {
            if (prevCount.current === 0) {
                // First load
                scrollToBottom('auto');
            } else if (isNearBottom()) {
                scrollToBottom('smooth');
            } else {
                setHasNewMessages(true);
            }
        }
        prevCount.current = messages.length;
    }, [messages]);

    // Auto-resize textarea
    useLayoutEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const maxH = 150;
        if (el.scrollHeight > maxH) {
            el.style.height = maxH + 'px';
            el.style.overflowY = 'auto';
        } else {
            el.style.height = el.scrollHeight + 'px';
            el.style.overflowY = 'hidden';
        }
    }, [input]);

    // Send / Edit
    const handleSend = useCallback(async () => {
        if (!input.trim() || isSending || !user) return;
        setIsSending(true);
        try {
            if (editMsg) {
                await fetch(`/api/chat/${editMsg.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
                    body: JSON.stringify({ message: input.trim() }),
                });
                setEditMsg(null);
            } else {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
                    body: JSON.stringify({ message: input.trim(), parent_id: replyTo?.id || null }),
                });
                setReplyTo(null);
            }
            setInput('');
            fetchMessages();
            unlock('socializer');
            setTimeout(() => scrollToBottom('smooth'), 200);
        } catch (e) { console.error(e); }
        finally { setIsSending(false); inputRef.current?.focus(); }
    }, [input, isSending, user, editMsg, replyTo, fetchMessages]);

    // Delete
    const handleDelete = useCallback(async (id: string) => {
        setDeleteId(id);
        setMenuOpenId(null);
    }, []);

    const confirmDelete = async () => {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        await fetch(`/api/chat/${id}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf() } });
        fetchMessages();
    };

    // React
    const handleReact = useCallback(async (id: string, emoji: string) => {
        setPickerOpenId(null);
        await fetch(`/api/chat/${id}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({ reaction: emoji }),
        });
        unlock('supporter');
        fetchMessages();
    }, [fetchMessages]);

    // Root messages only
    const rootMessages = useMemo(() => messages.filter(m => !m.parent_id), [messages]);

    // Online count (simulated from unique users in last hour)
    const onlineCount = useMemo(() => {
        const oneHourAgo = Date.now() - 3600000;
        const recent = new Set(messages.filter(m => new Date(m.created_at).getTime() > oneHourAgo).map(m => m.user_id));
        return Math.max(recent.size, 1);
    }, [messages]);

    return (
        <PublicLayout>
            <Head title={t('Chat Room', 'Ruang Chat')} />

            <section className="space-y-3 sm:space-y-5">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 sm:p-2 rounded-xl ${dk ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
                            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-bold">
                            {t('Chat Room', 'Ruang Chat')}
                        </h1>
                        {/* Online badge — inline with title */}
                        <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium ${dk ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
                            </span>
                            {onlineCount}
                        </div>
                    </div>
                    <p className={`text-xs sm:text-sm max-w-md leading-relaxed ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {t(
                            'Leave a message, say hi, or just hang out!',
                            'Tinggalkan pesan, sapa, atau sekedar nongkrong!'
                        )}
                    </p>
                </div>

                {/* Flash Messages */}
                <AnimatePresence>
                    {flash?.error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`rounded-xl p-3 sm:p-3.5 border text-xs sm:text-sm font-medium ${dk ? 'bg-red-900/20 border-red-900/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {flash.error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Container */}
                <div className={`overflow-hidden rounded-2xl border flex flex-col h-[calc(100dvh-180px)] sm:h-[calc(100dvh-220px)] lg:h-[600px] min-h-[300px] max-h-[700px] shadow-xl ${dk ? 'border-neutral-800 bg-neutral-900/60 backdrop-blur-sm' : 'border-neutral-200 bg-white/80 backdrop-blur-sm'}`}>

                    {/* Top bar — shows logged-in user + sign out */}
                    {user && (
                        <div className={`flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b ${dk ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-100 bg-neutral-50/50'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`shrink-0 h-6 w-6 rounded-full overflow-hidden ${dk ? 'ring-1 ring-neutral-700' : 'ring-1 ring-neutral-200'}`}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className={`h-full w-full flex items-center justify-center text-[10px] font-bold ${dk ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs font-medium truncate ${dk ? 'text-neutral-300' : 'text-neutral-600'}`}>{user.name}</span>
                            </div>
                            <button onClick={() => { fetch('/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } }).then(() => window.location.reload()); }}
                                className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 ${dk ? 'text-neutral-500 hover:text-red-400 hover:bg-red-900/15' : 'text-neutral-400 hover:text-red-500 hover:bg-red-50'}`}>
                                <LogOut className="w-3 h-3" />
                                {t('Sign out', 'Keluar')}
                            </button>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div 
                        ref={listRef} 
                        className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 scroll-smooth chat-scroll overscroll-contain relative"
                    >
                        {isLoading ? (
                            <ChatSkeleton dk={dk} count={4} />
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col h-full items-center justify-center gap-3 py-12">
                                <div className={`p-4 rounded-2xl ${dk ? 'bg-neutral-800/50' : 'bg-neutral-100/80'}`}>
                                    <Sparkles className={`h-8 w-8 ${dk ? 'text-teal-400' : 'text-teal-500'}`} />
                                </div>
                                <p className={`text-sm font-medium ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {t('No messages yet. Be the first to say hi! 👋', 'Belum ada pesan. Jadilah yang pertama menyapa! 👋')}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {rootMessages.map((msg) => (
                                    <ChatBubble
                                        key={msg.id}
                                        msg={msg}
                                        allMessages={messages}
                                        user={user}
                                        adminPhoto={adminPhoto}
                                        adminName={adminName}
                                        dk={dk}
                                        onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                        onEdit={(m) => { setEditMsg(m); setInput(m.message); inputRef.current?.focus(); }}
                                        onDelete={handleDelete}
                                        onReact={handleReact}
                                        pickerOpenId={pickerOpenId}
                                        setPickerOpenId={setPickerOpenId}
                                        menuOpenId={menuOpenId}
                                        setMenuOpenId={setMenuOpenId}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Floating Scroll to Bottom Button (Moved outside scroll area) */}
                    <AnimatePresence>
                        {showScrollBtn && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                onClick={() => { scrollToBottom('smooth'); setHasNewMessages(false); }}
                                className={`absolute bottom-[100px] right-8 z-30 flex h-10 w-10 items-center justify-center rounded-full shadow-2xl transition-all active:scale-95 ${
                                    dk ? 'bg-neutral-800 text-teal-400 border border-neutral-700 hover:bg-neutral-700' : 'bg-white text-teal-500 border border-neutral-200 hover:bg-neutral-50'
                                } backdrop-blur-md`}
                            >
                                <ArrowDown className="h-5 w-5" />
                                {hasNewMessages && (
                                    <div className="absolute -top-1 -right-1 h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500 border-2 border-white dark:border-neutral-800" />
                                    </div>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Input Area */}
                    <div className={`border-t p-2.5 sm:p-3.5 ${dk ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-100 bg-neutral-50/80'}`}>
                        {!user ? (
                            /* Login Prompt */
                            <div className="flex flex-col items-center justify-center py-4 sm:py-5 gap-2.5 sm:gap-3">
                                <div className={`p-2 sm:p-2.5 rounded-xl ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    <Lock className={`h-4 w-4 sm:h-5 sm:w-5 ${dk ? 'text-neutral-400' : 'text-neutral-500'}`} />
                                </div>
                                <p className={`text-xs sm:text-sm text-center max-w-xs leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {t(
                                        "Sign in with Google to join the conversation!",
                                        'Masuk dengan Google untuk bergabung!'
                                    )}
                                </p>
                                <a href="/auth/google"
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${dk ? 'bg-white text-neutral-800 hover:bg-neutral-100' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill={dk ? '#4285F4' : '#fff'} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {t('Sign in with Google', 'Masuk dengan Google')}
                                </a>
                            </div>
                        ) : (
                            /* Chat Input */
                            <>
                                {/* Reply / Edit Indicator */}
                                <AnimatePresence>
                                    {(replyTo || editMsg) && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className={`mb-2.5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${dk ? 'bg-neutral-800 border border-neutral-700 text-neutral-300' : 'bg-white border border-neutral-200 text-neutral-600'}`}>
                                            {replyTo ? (
                                                <><Reply className="h-3.5 w-3.5 text-teal-500 shrink-0" /> <span className="truncate">{t('Replying to', 'Membalas')} <strong>{replyTo.user?.name || replyTo.name}</strong></span></>
                                            ) : (
                                                <><Edit2 className="h-3.5 w-3.5 text-amber-500 shrink-0" /> <span>{t('Editing message', 'Mengedit pesan')}</span></>
                                            )}
                                            <button onClick={() => { setReplyTo(null); setEditMsg(null); setInput(''); }}
                                                className="ml-auto shrink-0 p-0.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input Row */}
                                <div className="flex gap-2 sm:gap-3 items-center">
                                    {/* User Avatar */}
                                    <div className={`shrink-0 h-9 w-9 sm:h-11 sm:w-11 rounded-full overflow-hidden shadow-sm flex items-center justify-center ${dk ? 'ring-2 ring-neutral-700' : 'ring-2 ring-neutral-200'}`}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className={`h-full w-full flex items-center justify-center text-xs sm:text-sm font-bold ${dk ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Textarea */}
                                    <div className="flex-1 min-w-0 flex items-center">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            placeholder={t('Type a message...', 'Ketik pesan...')}
                                            rows={1}
                                            disabled={isSending}
                                            className={`w-full resize-none rounded-2xl border px-3 py-2 sm:px-4 sm:py-[10px] text-xs sm:text-sm leading-[20px] sm:leading-[22px] outline-none transition-all focus:ring-2 scrollbar-hide overflow-hidden ${dk
                                                ? 'border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus:border-teal-500 focus:ring-teal-500/15'
                                                : 'border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-teal-400 focus:ring-teal-400/15'
                                            }`}
                                            style={{ height: 'auto', minHeight: '38px', maxHeight: '120px' }}
                                        />
                                    </div>

                                    {/* Send Button */}
                                    <button onClick={handleSend} disabled={!input.trim() || isSending}
                                        className={`shrink-0 flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 rounded-full transition-all duration-200 active:scale-90 ${input.trim()
                                            ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/25'
                                            : (dk ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed')
                                        }`}>
                                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </button>
                                </div>

                                {/* Markdown Hint */}
                                <AnimatePresence>
                                    {input.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -5 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: -5 }}
                                            className={`mt-1.5 sm:mt-2 flex flex-wrap gap-2 sm:gap-3 px-12 text-[9px] sm:text-[10px] font-medium ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}
                                        >
                                            <span className="hidden sm:flex items-center gap-1"><Bold className="w-3 h-3" /> **bold**</span>
                                            <span className="hidden sm:flex items-center gap-1"><Italic className="w-3 h-3" /> *italic*</span>
                                            <span className="hidden sm:flex items-center gap-1"><Code className="w-3 h-3" /> `code`</span>
                                            <span className="sm:hidden text-neutral-500">{t('Shift+Enter = newline', 'Shift+Enter = baris baru')}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`relative w-full max-w-sm overflow-hidden rounded-3xl border shadow-2xl ${dk ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}
                        >
                            <div className="p-6 text-center">
                                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${dk ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                                    <X size={28} />
                                </div>
                                <h3 className={`mb-2 text-lg font-bold ${dk ? 'text-white' : 'text-neutral-900'}`}>
                                    {t('Delete Message?', 'Hapus Pesan?')}
                                </h3>
                                <p className={`mb-6 text-sm leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {t('Are you sure you want to delete this message? This action cannot be undone.', 'Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.')}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setDeleteId(null)}
                                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${dk ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'}`}
                                    >
                                        {t('Cancel', 'Batal')}
                                    </button>
                                    <button 
                                        onClick={confirmDelete}
                                        className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 shadow-lg shadow-red-500/20"
                                    >
                                        {t('Delete', 'Hapus')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PublicLayout>
    );
}
