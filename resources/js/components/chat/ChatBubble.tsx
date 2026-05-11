import { useState, memo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Trash2, Edit2, MoreHorizontal, SmilePlus, Shield } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

// Types
interface User { id: number; name: string; email: string; avatar: string | null; role?: string; }
interface Reaction { id: number; chat_message_id: string; user_id: number; reaction: string; user: { id: number; name: string }; }
export interface Message {
    id: string; user_id: number; name: string; email: string | null; avatar: string | null;
    message: string; is_reply: boolean; parent_id: string | null; is_show: boolean;
    created_at: string; updated_at: string; reactions: Reaction[]; user?: User;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

// Markdown parser
function parseMarkdown(text: string) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-indigo-500 hover:text-indigo-400">$1</a>');
    html = html.replace(/(?<!href=")(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">$1</a>');
    return html;
}

// Time ago
function timeAgo(dateStr: string, lang: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (lang === 'en') {
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}mnt lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}jam lalu`;
    return `${Math.floor(hrs / 24)}hr lalu`;
}

interface ChatBubbleProps {
    msg: Message;
    allMessages: Message[];
    user: User | null;
    adminPhoto: string;
    adminName: string;
    dk: boolean;
    isChild?: boolean;
    onReply: () => void;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onReact: (id: string, emoji: string) => void;
    pickerOpenId: string | null;
    setPickerOpenId: (id: string | null) => void;
    menuOpenId: string | null;
    setMenuOpenId: (id: string | null) => void;
}

function ChatBubbleInner({ msg, allMessages, user, adminPhoto, adminName, dk, isChild = false, onReply, onEdit, onDelete, onReact, pickerOpenId, setPickerOpenId, menuOpenId, setMenuOpenId }: ChatBubbleProps) {
    const { t, lang } = useApp();
    const isAuthor = msg.user?.role === 'admin';
    const isMine = Number(user?.id) === Number(msg.user_id);
    const isAdmin = user?.role === 'admin';
    const isOwnBubble = isMine && !isAuthor;

    const menuRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Reactions grouped
    const rxGroups: Record<string, { count: number; me: boolean }> = {};
    msg.reactions?.forEach((r: Reaction) => {
        if (!rxGroups[r.reaction]) rxGroups[r.reaction] = { count: 0, me: false };
        rxGroups[r.reaction].count++;
        if (user && Number(r.user_id) === Number(user.id)) rxGroups[r.reaction].me = true;
    });

    const replies = allMessages.filter((m) => m.parent_id === msg.id);
    const [repliesExpanded, setRepliesExpanded] = useState(false);

    const avatarSrc = isAuthor ? adminPhoto : (msg.user?.avatar || msg.avatar);
    const displayName = isAuthor ? adminName : (msg.user?.name || msg.name);
    const initial = displayName.charAt(0).toUpperCase();
    const bubbleAlign = isOwnBubble ? 'flex-row-reverse' : '';

    const bubbleColor = isAuthor
        ? (dk ? 'bg-gradient-to-br from-teal-900/50 to-teal-800/30 border border-teal-700/30' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100')
        : isOwnBubble
            ? (dk ? 'bg-gradient-to-br from-indigo-900/40 to-violet-900/30 border border-indigo-700/20' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100')
            : (dk ? 'bg-neutral-800/60 border border-neutral-700/40' : 'bg-white border border-neutral-200/80');

    const tailRound = isOwnBubble ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md';

    const isMenuOpen = menuOpenId === msg.id;
    const isPickerOpen = pickerOpenId === msg.id;

    const toggleMenu = useCallback(() => setMenuOpenId(isMenuOpen ? null : msg.id), [isMenuOpen, msg.id]);
    const togglePicker = useCallback(() => setPickerOpenId(isPickerOpen ? null : msg.id), [isPickerOpen, msg.id]);

    // Close menus on outside click
    useEffect(() => {
        if (!isMenuOpen && !isPickerOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpenId(null);
            }
            if (isPickerOpen && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setPickerOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isMenuOpen, isPickerOpen]);

    // Determine which actions to show
    const canEdit = isMine;
    const canDelete = isMine || isAdmin;
    const showMoreBtn = canEdit || canDelete;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`group flex gap-2 sm:gap-2.5 w-full ${bubbleAlign} ${isChild ? 'mt-2' : 'mb-3 sm:mb-4'}`}
        >
            {/* Avatar */}
            <div className={`shrink-0 overflow-hidden rounded-full shadow-md ${isChild ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-8 w-8 sm:h-9 sm:w-9'} ${isAuthor ? 'ring-2 ring-teal-500/40' : (dk ? 'ring-1 ring-neutral-700' : 'ring-1 ring-neutral-200')}`}>
                {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <div className={`h-full w-full flex items-center justify-center text-xs font-bold ${dk ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}>
                        {initial}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`max-w-[80%] sm:max-w-[75%] min-w-0 ${isOwnBubble ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Name + Badge + Time */}
                <div className={`flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 px-1 ${isOwnBubble ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-[11px] sm:text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px] ${isAuthor ? (dk ? 'text-teal-400' : 'text-teal-600') : (dk ? 'text-neutral-300' : 'text-neutral-700')}`}>
                        {displayName}
                    </span>
                    {isAuthor && (
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-1 sm:px-1.5 py-[1px] text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${dk ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-teal-500/10 text-teal-600 border border-teal-500/25'}`}>
                            <Shield className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            {t('Author', 'Penulis')}
                        </span>
                    )}
                    <span className={`text-[9px] sm:text-[10px] ${dk ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {timeAgo(msg.created_at, lang)}
                        {msg.updated_at && msg.updated_at !== msg.created_at && (
                            <span className="ml-1 opacity-70">({t('edited', 'diedit')})</span>
                        )}
                    </span>
                </div>

                {/* Bubble */}
                <div className={`relative ${tailRound} ${bubbleColor} px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-sm`}>
                    {/* Message */}
                    <div className={`text-[12.5px] sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap ${dk ? 'text-neutral-200' : 'text-neutral-800'}`}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.message) }} />

                    {/* Action bar — desktop hover only */}
                    {user && (
                        <div className={`hidden lg:flex absolute ${isOwnBubble ? '-left-1 -translate-x-full' : '-right-1 translate-x-full'} top-0 items-center gap-0.5 z-10 transition-opacity duration-200 opacity-0 group-hover:opacity-100 ${isMenuOpen || isPickerOpen ? '!opacity-100' : ''}`}>
                            <ActionBtn dk={dk} onClick={togglePicker} title={t('React', 'Reaksi')}>
                                <SmilePlus className="w-3 h-3" />
                            </ActionBtn>
                            <ActionBtn dk={dk} onClick={onReply} title={t('Reply', 'Balas')}>
                                <Reply className="w-3 h-3" />
                            </ActionBtn>
                            {showMoreBtn && (
                                <ActionBtn dk={dk} onClick={toggleMenu} title={t('More', 'Lainnya')}>
                                    <MoreHorizontal className="w-3 h-3" />
                                </ActionBtn>
                            )}
                        </div>
                    )}

                    {/* Mobile "⋯" — inside bubble corner, tap to open context menu with all actions */}
                    {user && (
                        <button
                            onClick={toggleMenu}
                            className={`lg:hidden absolute ${isOwnBubble ? 'left-1.5' : 'right-1.5'} top-1.5 z-10 p-1 rounded-md transition-all active:scale-90 ${dk ? 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-black/5'}`}
                        >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Emoji Picker */}
                    <AnimatePresence>
                        {isPickerOpen && (
                            <motion.div
                                ref={pickerRef}
                                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                className={`absolute ${isOwnBubble ? 'right-0' : 'left-0'} -bottom-11 z-30 flex gap-0.5 rounded-xl p-1 sm:p-1.5 shadow-xl border backdrop-blur-md ${dk ? 'bg-neutral-900/95 border-neutral-700' : 'bg-white/95 border-neutral-200'}`}
                            >
                                {EMOJI_LIST.map(em => (
                                    <button key={em} onClick={() => onReact(msg.id, em)} className="p-0.5 sm:p-1 hover:bg-neutral-500/20 rounded-lg text-sm sm:text-base transition-transform hover:scale-125 active:scale-95">{em}</button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Context Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                className={`absolute ${isOwnBubble ? 'right-0' : 'left-0'} top-full mt-1 z-30 flex flex-col min-w-[120px] rounded-xl shadow-xl border py-1 backdrop-blur-md overflow-hidden ${dk ? 'bg-neutral-900/95 border-neutral-700' : 'bg-white/95 border-neutral-200'}`}
                            >
                                {/* React (mobile only — desktop has separate button) */}
                                <button onClick={() => { setMenuOpenId(null); togglePicker(); }} className={`lg:hidden flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${dk ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-50 text-neutral-700'}`}>
                                    <SmilePlus className="w-3.5 h-3.5" /> {t('React', 'Reaksi')}
                                </button>
                                {/* Reply (mobile only) */}
                                <button onClick={() => { setMenuOpenId(null); onReply(); }} className={`lg:hidden flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${dk ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-50 text-neutral-700'}`}>
                                    <Reply className="w-3.5 h-3.5" /> {t('Reply', 'Balas')}
                                </button>
                                {/* Divider for mobile */}
                                {(canEdit || canDelete) && (
                                    <div className={`lg:hidden border-t my-0.5 ${dk ? 'border-neutral-800' : 'border-neutral-100'}`} />
                                )}
                                {canEdit && (
                                    <button onClick={() => { onEdit(msg); setMenuOpenId(null); }} className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${dk ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-50 text-neutral-700'}`}>
                                        <Edit2 className="w-3.5 h-3.5 text-amber-500" /> {t('Edit', 'Edit')}
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={() => { onDelete(msg.id); setMenuOpenId(null); }} className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 ${dk ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
                                        <Trash2 className="w-3.5 h-3.5" /> {t('Delete', 'Hapus')}
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Reactions */}
                {Object.keys(rxGroups).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 sm:mt-1.5 ${isOwnBubble ? 'justify-end' : ''}`}>
                        {Object.entries(rxGroups).map(([em, data]) => (
                            <button key={em} onClick={() => user && onReact(msg.id, em)} disabled={!user}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border transition-all hover:scale-105 active:scale-95 ${data.me
                                    ? (dk ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700')
                                    : (dk ? 'bg-neutral-800/80 border-neutral-700 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600')
                                    }`}>
                                <span>{em}</span><span>{data.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Replies Toggle */}
                {!isChild && replies.length > 0 && !repliesExpanded && (
                    <button onClick={() => setRepliesExpanded(true)} className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold mt-1 sm:mt-1.5 px-1 hover:underline ${dk ? 'text-teal-400' : 'text-teal-600'}`}>
                        <Reply className="w-3 h-3 rotate-180" /> {replies.length} {t('replies', 'balasan')}
                    </button>
                )}

                {/* Expanded Replies */}
                {!isChild && repliesExpanded && replies.length > 0 && (
                    <div className={`mt-2 pl-2 sm:pl-3 relative ${dk ? 'border-l-2 border-neutral-700/50' : 'border-l-2 border-neutral-200'}`}>
                        {replies.map(reply => (
                            <ChatBubbleInner key={reply.id} msg={reply} allMessages={allMessages} user={user}
                                adminPhoto={adminPhoto} adminName={adminName} dk={dk} isChild={true}
                                onReply={onReply} onEdit={onEdit} onDelete={onDelete} onReact={onReact}
                                pickerOpenId={pickerOpenId} setPickerOpenId={setPickerOpenId}
                                menuOpenId={menuOpenId} setMenuOpenId={setMenuOpenId}
                            />
                        ))}
                        <button onClick={() => setRepliesExpanded(false)} className={`text-[10px] sm:text-[11px] font-semibold hover:underline mt-2 ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            {t('Hide replies', 'Sembunyikan balasan')}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Small action button
function ActionBtn({ dk, onClick, title, children }: { dk: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button onClick={onClick} title={title}
            className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm backdrop-blur-sm ${dk ? 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300' : 'bg-white/90 border border-neutral-100 hover:bg-neutral-50 text-neutral-500'}`}>
            {children}
        </button>
    );
}

const ChatBubble = memo(ChatBubbleInner);
export default ChatBubble;
export { EMOJI_LIST, parseMarkdown, timeAgo };
export type { User as ChatUser, Reaction as ChatReaction };
