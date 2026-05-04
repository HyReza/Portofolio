import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Reply, Trash2, MessageCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';

interface Message {
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
    message: string;
    is_reply: boolean;
    reply_to: string | null;
    is_show: boolean;
    created_at: string;
}

interface Props {
    messages: Message[];
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function ChatPage({ messages: initialMessages }: Props) {
    const { theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [name, setName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('chat_name') || '' : '');
    const [isSending, setIsSending] = useState(false);
    const [replyTo, setReplyTo] = useState<{ name: string; email: string } | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const AUTHOR_EMAIL = 'admin@example.com';

    // Polling for new messages every 5s
    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !name.trim() || isSending) return;
        setIsSending(true);

        localStorage.setItem('chat_name', name);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
                body: JSON.stringify({
                    name: name.trim(),
                    message: input.trim(),
                    is_reply: !!replyTo,
                    reply_to: replyTo?.name || null,
                }),
            });
            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => [...prev, newMsg]);
                setInput('');
                setReplyTo(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    return (
        <PublicLayout>
            <Head title={t('Chat Room', 'Ruang Chat')} />

            <section className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <MessageCircle className="h-6 w-6" /> {t('Chat Room', 'Ruang Chat')}
                    </h1>
                    <p className={`text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {t('Leave a message, say hi, or just hang out!', 'Tinggalkan pesan, sapa, atau sekedar nongkrong!')}
                    </p>
                </div>

                {/* Chat container */}
                <div className={`overflow-hidden rounded-xl border ${dk ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-white'}`}>

                    {/* Messages list */}
                    <div ref={listRef} className="h-[26rem] space-y-4 overflow-y-auto px-4 py-4 lg:px-6">
                        {messages.length === 0 && (
                            <div className={`flex h-full items-center justify-center text-sm ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {t('No messages yet. Be the first!', 'Belum ada pesan. Jadi yang pertama!')}
                            </div>
                        )}
                        <AnimatePresence>
                            {messages.map((msg) => {
                                const isAuthor = msg.email === AUTHOR_EMAIL;
                                return (
                                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-start gap-3 ${isAuthor ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${dk ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                                            {msg.avatar ? <img src={msg.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : msg.name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Bubble */}
                                        <div className={`max-w-[75%] space-y-1 ${isAuthor ? 'items-end text-right' : ''}`}>
                                            <div className={`flex items-center gap-2 ${isAuthor ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-sm font-medium ${dk ? 'text-neutral-200' : 'text-neutral-800'}`}>{msg.name}</span>
                                                {isAuthor && (
                                                    <span className="rounded-full border border-teal-500 bg-teal-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300">Author</span>
                                                )}
                                                <span className={`text-xs ${dk ? 'text-neutral-600' : 'text-neutral-400'}`}>{timeAgo(msg.created_at)}</span>
                                            </div>
                                            <div className="group flex items-center gap-2">
                                                <div className={`inline-block px-4 py-2.5 text-sm ${isAuthor ? `chat-bubble-author ${dk ? 'bg-teal-800 text-teal-50' : 'bg-teal-500 text-white'}` : `chat-bubble ${dk ? 'bg-neutral-800 text-neutral-100' : 'bg-neutral-100 text-neutral-800'}`}`}>
                                                    {msg.is_reply && msg.reply_to && (
                                                        <span className={`mr-1 font-semibold ${isAuthor ? 'text-teal-200' : 'text-teal-500'}`}>@{msg.reply_to} </span>
                                                    )}
                                                    {msg.message}
                                                </div>
                                                <button onClick={() => setReplyTo({ name: msg.name, email: msg.email || '' })}
                                                    className="hidden text-neutral-400 transition-all hover:text-teal-400 group-hover:inline-block">
                                                    <Reply className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Input area */}
                    <div className={`border-t px-4 py-3 ${dk ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        {/* Reply indicator */}
                        {replyTo && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`mb-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                <Reply className="h-3 w-3" />
                                <span>{t('Replying to', 'Membalas')} <strong>{replyTo.name}</strong></span>
                                <button onClick={() => setReplyTo(null)} className="ml-auto text-neutral-400 hover:text-red-400">✕</button>
                            </motion.div>
                        )}

                        {/* Name input (if not set) */}
                        {!name && (
                            <div className="mb-2">
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder={t('Your name...', 'Nama kamu...')}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${dk ? 'border-neutral-700 bg-neutral-800 text-white' : 'border-neutral-200 bg-white text-neutral-900'}`}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {name && (
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${dk ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={name ? t('Type a message...', 'Ketik pesan...') : t('Enter your name first', 'Masukkan nama dulu')}
                                disabled={!name || isSending}
                                className={`flex-grow rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${dk ? 'border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus:border-teal-600' : 'border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-teal-400'}`}
                            />
                            <button onClick={handleSend} disabled={!input.trim() || !name.trim() || isSending}
                                className={`rounded-lg p-2.5 transition-all duration-200 active:scale-90 ${input.trim() && name.trim() ? (dk ? 'bg-teal-700 text-white hover:bg-teal-600' : 'bg-teal-500 text-white hover:bg-teal-400') : (dk ? 'cursor-not-allowed bg-neutral-800 text-neutral-600' : 'cursor-not-allowed bg-neutral-100 text-neutral-300')}`}>
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        {name && (
                            <p className={`mt-1.5 text-xs ${dk ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                {t('Chatting as', 'Chat sebagai')} <strong>{name}</strong> ·{' '}
                                <button onClick={() => { setName(''); localStorage.removeItem('chat_name'); }} className="underline hover:text-teal-400">
                                    {t('Change', 'Ganti')}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
