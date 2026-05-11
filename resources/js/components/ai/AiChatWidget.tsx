import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, X, Send, ChevronDown, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAchievements, trackAiQuestion } from '@/hooks/useGimmicks';
import AiTypingIndicator from './AiTypingIndicator';
import { parseMarkdown, timeAgo } from '../chat/ChatBubble';

interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export default function AiChatWidget() {
    const { dk, t, lang } = useApp();
    const { unlock } = useAchievements();
    const [isOpen, setIsOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');
    const [streamingText, setStreamingText] = useState('');
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortController = useRef<AbortController | null>(null);

    // ── Load history or show greeting ──
    useEffect(() => {
        const t1 = setTimeout(() => setShowWelcome(true), 2500);
        const t2 = setTimeout(() => setShowWelcome(false), 12000);

        fetch('/api/ai-chat/history')
            .then(r => r.json())
            .then(data => {
                if (data.messages?.length > 0) {
                    setMessages(data.messages);
                } else {
                    setMessages([{
                        id: 'greeting',
                        role: 'assistant',
                        content: lang === 'id'
                            ? 'Halo! 👋 Saya asisten AI Reza. Ada yang ingin ditanyakan tentang beliau?'
                            : 'Hello! 👋 I\'m Reza\'s AI assistant. What would you like to know?',
                        created_at: new Date().toISOString()
                    }]);
                }
            })
            .catch(() => { });

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [lang]);

    // ── Scroll helpers ──
    const scrollToBottom = useCallback((smooth = true) => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, streamingText, scrollToBottom]);

    const onScroll = useCallback(() => {
        if (!listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 80);
    }, []);

    // ── Overscroll containment — prevent page scroll when scrolling chat ──
    useEffect(() => {
        const el = listRef.current;
        if (!el || !isOpen) return;
        const handler = (e: WheelEvent) => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const atTop = scrollTop <= 0 && e.deltaY < 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
            if (!atTop && !atBottom) e.stopPropagation();
            if (atTop || atBottom) e.preventDefault();
        };
        el.addEventListener('wheel', handler, { passive: false });
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => { el.removeEventListener('wheel', handler); el.removeEventListener('scroll', onScroll); };
    }, [isOpen, onScroll]);

    // ── Auto-resize textarea ──
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 100) + 'px';
        el.style.overflowY = el.scrollHeight > 100 ? 'auto' : 'hidden';
    }, [input]);

    // ── Send message ──
    const handleSend = async (overrideText?: string) => {
        const msgText = overrideText || input;
        if (!msgText.trim() || isLoading) return;

        const textToSend = msgText.trim();
        setInput('');
        setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content: textToSend, created_at: new Date().toISOString() }]);
        setIsLoading(true);
        setIsTyping(true);
        setError('');
        setShowWelcome(false);

        // Track AI questions for achievement
        const qCount = trackAiQuestion();
        if (qCount >= 3) unlock('ai_whisperer');

        if (abortController.current) abortController.current.abort();
        abortController.current = new AbortController();

        try {
            const match = document.cookie.match(/(^| )XSRF-TOKEN=([^;]+)/);
            const xsrf = match ? decodeURIComponent(match[2]) : '';

            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf },
                body: JSON.stringify({ message: textToSend, lang }),
                signal: abortController.current.signal
            });

            const data = await res.json();
            setIsTyping(false);

            if (res.ok && data.success) {
                const full = data.message;
                setStreamingText('');

                // Switch to word-by-word to avoid "broken markdown" glitches (typos)
                const words = full.split(/(\s+)/); // Preserve spaces
                let i = 0;
                let current = '';

                const iv = setInterval(() => {
                    if (i < words.length) {
                        current += words[i];
                        setStreamingText(current);
                        i++;
                    } else {
                        clearInterval(iv);
                        setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: full, created_at: new Date().toISOString() }]);
                        setStreamingText('');
                    }
                }, 30); // Faster word-by-word flow
            } else {
                setError(data.message || (lang === 'id' ? 'Terjadi kesalahan.' : 'An error occurred.'));
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setIsTyping(false);
                setError(lang === 'id' ? 'Koneksi terputus. Coba lagi.' : 'Connection lost. Try again.');
            }
        } finally {
            setIsLoading(false);
            if (!/Mobi|Android/i.test(navigator.userAgent)) inputRef.current?.focus();
        }
    };

    // ── Retry last failed message ──
    const handleRetry = () => {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) { setError(''); handleSend(lastUserMsg.content); }
    };

    // ── Suggestions ──
    const getSuggestions = () => {
        if (lang === 'id') return [
            'Apa saja keahlian utama Reza?',
            'Lihat proyek terbaru',
            'Baca blog terbaru',
            'Bagaimana cara menghubungi Reza?'
        ];
        return [
            "What are Reza's main skills?",
            "Show me the latest projects",
            "Read the latest blog posts",
            "How can I contact Reza?"
        ];
    };

    const handleSuggestion = (txt: string) => {
        setInput(txt);
        setTimeout(() => {
            handleSend(txt);
        }, 100);
    };

    // ── Clear chat ──
    const clearChat = async () => {
        if (messages.length <= 1) return;

        try {
            const match = document.cookie.match(/(^| )XSRF-TOKEN=([^;]+)/);
            const xsrf = match ? decodeURIComponent(match[2]) : '';

            await fetch('/api/ai-chat', {
                method: 'DELETE',
                headers: { 'X-XSRF-TOKEN': xsrf }
            });

            setMessages([{
                id: 'greeting-' + Date.now(),
                role: 'assistant',
                content: lang === 'id' ? 'Halo! 👋 Ada yang bisa saya bantu?' : 'Hello! 👋 How can I help you?',
                created_at: new Date().toISOString()
            }]);
            setError('');
            setStreamingText('');
        } catch (err) {
            console.error('Failed to clear chat:', err);
        }
    };

    // ── Toggle ──
    const toggleOpen = () => {
        const next = !isOpen;
        setIsOpen(next);
        setShowWelcome(false);
        if (next) setTimeout(() => { scrollToBottom(false); if (!/Mobi|Android/i.test(navigator.userAgent)) inputRef.current?.focus(); }, 150);
    };

    // ── Render ──
    return (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">

            {/* ═══ Chat Panel ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`mb-3 flex flex-col overflow-hidden rounded-2xl border w-[90vw] sm:w-[380px] h-[560px] max-h-[82vh] ${dk ? 'bg-[#0f0f0f] border-neutral-800' : 'bg-white border-neutral-200'
                            }`}
                        style={{ boxShadow: dk ? '0 20px 50px -10px rgba(0,0,0,0.6)' : '0 20px 50px -10px rgba(0,0,0,0.12)' }}
                    >
                        {/* ─── Header ─── */}
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${dk ? 'border-neutral-800' : 'border-neutral-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${dk ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${dk ? 'text-white' : 'text-neutral-900'}`}>Reza's AI</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span className={`text-[10px] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <button onClick={clearChat} title={t('Clear chat', 'Hapus chat')}
                                    className={`p-2 rounded-lg transition-colors ${dk ? 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}>
                                    <Trash2 size={15} />
                                </button>
                                <button onClick={() => setIsOpen(false)}
                                    className={`p-2 rounded-lg transition-colors ${dk ? 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* ─── Messages ─── */}
                        <div ref={listRef}
                            className={`relative flex-1 overflow-y-auto p-4 overscroll-contain ${dk ? '' : 'bg-neutral-50/60'}`}
                            style={{ scrollbarWidth: 'thin', scrollbarColor: dk ? '#333 transparent' : '#ddd transparent' }}
                        >
                            {messages.map(msg => {
                                const isAi = msg.role === 'assistant';
                                return (
                                    <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col mb-3 ${isAi ? 'items-start' : 'items-end'}`}>
                                        <div className={`flex gap-2 max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                                            {isAi && (
                                                <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg mt-0.5 ${dk ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    <Sparkles size={11} />
                                                </div>
                                            )}
                                            <div className={`px-3 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap ${isAi
                                                    ? dk ? 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-2xl rounded-tl-md' : 'bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-tl-md shadow-sm'
                                                    : dk ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-md' : 'bg-indigo-600 text-white rounded-2xl rounded-tr-md shadow-sm'
                                                }`} dangerouslySetInnerHTML={{ __html: isAi ? parseMarkdown(msg.content) : msg.content.replace(/</g, '&lt;') }} />
                                        </div>
                                        <span className={`text-[9px] mt-1 mx-8 ${dk ? 'text-neutral-600' : 'text-neutral-400'}`}>{timeAgo(msg.created_at, lang)}</span>
                                    </motion.div>
                                );
                            })}

                            {/* Streaming */}
                            {streamingText && (
                                <div className="flex flex-col mb-3 items-start">
                                    <div className="flex gap-2 max-w-[85%]">
                                        <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg mt-0.5 ${dk ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <Sparkles size={11} />
                                        </div>
                                        <div className={`px-3 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap ${dk ? 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-2xl rounded-tl-md' : 'bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-tl-md shadow-sm'}`}
                                            dangerouslySetInnerHTML={{ __html: parseMarkdown(streamingText) }} />
                                    </div>
                                </div>
                            )}

                            {/* Typing */}
                            {isTyping && !streamingText && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 mb-3">
                                    <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg mt-0.5 ${dk ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Sparkles size={11} />
                                    </div>
                                    <AiTypingIndicator dk={dk} />
                                </motion.div>
                            )}

                            {/* Error with Retry */}
                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-3">
                                    <button onClick={handleRetry}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dk ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                            }`}>
                                        <RotateCcw size={12} />
                                        {error} — {t('Retry', 'Coba lagi')}
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* ─── Scroll-to-Bottom Button ─── */}
                        <AnimatePresence>
                            {showScrollBtn && (
                                <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                    onClick={() => scrollToBottom()}
                                    className={`absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border shadow-md ${dk ? 'bg-neutral-900 text-neutral-300 border-neutral-700' : 'bg-white text-neutral-600 border-neutral-200'
                                        }`}>
                                    <ChevronDown size={12} />
                                    {t('New messages', 'Pesan baru')}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* ─── Input ─── */}
                        <div className={`p-3 border-t ${dk ? 'border-neutral-800' : 'border-neutral-100'}`}>
                            {/* Suggestions (Fixed Greeting Only) */}
                            <AnimatePresence>
                                {!isLoading && messages.length < 3 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="px-3 pb-3 flex flex-wrap gap-2">
                                        {getSuggestions().map((s, i) => (
                                            <button key={i} onClick={() => handleSuggestion(s)}
                                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all hover:scale-105 active:scale-95 ${dk ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                                    }`}>
                                                {s}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={`relative rounded-xl border transition-all duration-200 ${dk ? 'border-neutral-800 bg-neutral-900 focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/10' : 'border-neutral-200 bg-neutral-50 focus-within:border-indigo-400 focus-within:shadow-sm'
                                } ${input.length > 500 || (input.trim() && input.trim().split(/\s+/).length > 50) ? 'border-red-500/50 ring-1 ring-red-500/20 bg-red-50/5' : ''}`}>
                                <div className="flex items-end">
                                    <textarea ref={inputRef} value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => {
                                            const wordCount = input.trim().split(/\s+/).length;
                                            if (e.key === 'Enter' && !e.shiftKey && input.trim() && input.length <= 500 && wordCount <= 50) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder={t('Ask me anything...', 'Tanya apa saja...')}
                                        rows={1} disabled={isLoading}
                                        className={`w-full resize-none bg-transparent pl-3 pr-2 py-2.5 text-[13px] leading-5 outline-none scrollbar-hide ${dk ? 'text-white placeholder:text-neutral-600' : 'text-neutral-900 placeholder:text-neutral-400'
                                            }`}
                                        style={{ minHeight: '38px', maxHeight: '100px' }}
                                    />
                                    <button onClick={() => handleSend()} disabled={!input.trim() || input.length > 500 || input.trim().split(/\s+/).length > 50 || isLoading}
                                        className={`shrink-0 m-1.5 flex items-center justify-center h-8 w-8 rounded-lg transition-all ${input.trim() && input.length <= 500 && input.trim().split(/\s+/).length <= 50 && !isLoading
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-500/20'
                                                : dk ? 'bg-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed' : 'bg-neutral-200 text-neutral-400 opacity-50 cursor-not-allowed'
                                            }`}>
                                        <Send size={14} />
                                    </button>
                                </div>

                                {/* Status bar inside the box */}
                                <div className={`px-3 py-1 flex items-center justify-between border-t transition-colors ${dk ? 'border-neutral-800/50' : 'border-neutral-200/50'
                                    }`}>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-medium transition-colors ${input.length > 500 ? 'text-red-500 font-bold animate-pulse' : input.length > 400 ? 'text-amber-500' : dk ? 'text-neutral-600' : 'text-neutral-400'
                                            }`}>
                                            {input.length}/500 {t('chars', 'karakter')}
                                        </span>
                                        <span className={`text-[8px] ${dk ? 'text-neutral-800' : 'text-neutral-200'}`}>•</span>
                                        <span className={`text-[9px] font-medium transition-colors ${(input.trim() && input.trim().split(/\s+/).length > 50) ? 'text-red-500 font-bold animate-pulse' : (input.trim() && input.trim().split(/\s+/).length > 40) ? 'text-amber-500' : dk ? 'text-neutral-600' : 'text-neutral-400'
                                            }`}>
                                            {input.trim() ? input.trim().split(/\s+/).length : 0}/50 {t('words', 'kata')}
                                        </span>
                                    </div>

                                    {isLoading && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex gap-0.5">
                                                <span className="w-0.5 h-0.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-0.5 h-0.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-0.5 h-0.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-[9px] text-indigo-500 font-medium italic">AI is typing...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Connection Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <p className="text-[10px] text-red-600 font-medium">
                                            {t('Connection lost. Please try again.', 'Koneksi terputus. Silakan coba lagi.')}
                                        </p>
                                        <button onClick={() => handleSend()} className="ml-auto text-[9px] text-red-500 font-bold hover:underline">
                                            {t('Retry', 'Coba lagi')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Powered by AI footer */}
                            <p className={`text-center text-[9px] mt-1.5 select-none ${dk ? 'text-neutral-700' : 'text-neutral-400'}`}>
                                Powered by AI · {t('Answers may vary', 'Jawaban dapat bervariasi')}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Welcome Bubble ═══ */}
            <AnimatePresence>
                {!isOpen && showWelcome && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className={`absolute bottom-[68px] right-0 mb-2 w-52 p-3 rounded-xl rounded-br-sm border cursor-pointer ${dk ? 'bg-neutral-900 border-neutral-800 shadow-xl' : 'bg-white border-neutral-200 shadow-lg'
                            }`}
                        onClick={toggleOpen}
                    >
                        <button onClick={e => { e.stopPropagation(); setShowWelcome(false); }}
                            className={`absolute top-1.5 right-1.5 p-0.5 rounded-md ${dk ? 'hover:bg-neutral-800 text-neutral-600' : 'hover:bg-neutral-100 text-neutral-400'}`}>
                            <X size={11} />
                        </button>
                        <p className={`text-[11px] leading-relaxed pr-4 ${dk ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            {lang === 'id' ? '👋 Punya pertanyaan tentang portofolio ini? Tanya saya!' : '👋 Have questions about this portfolio? Ask me!'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Floating Button — Clean & Professional ═══ */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
                className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors duration-200 ${isOpen
                        ? dk ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                        : dk ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                style={{ boxShadow: isOpen ? undefined : '0 6px 20px -4px rgba(79, 70, 229, 0.4)' }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="x" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }}>
                            <X size={22} />
                        </motion.div>
                    ) : (
                        <motion.div key="msg" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }}>
                            <MessageSquareText size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Small AI dot indicator */}
                {!isOpen && (
                    <span className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-bold text-white ring-2 ${dk ? 'ring-[#121212]' : 'ring-white'}`}>
                        AI
                    </span>
                )}
            </motion.button>
        </div>
    );
}
