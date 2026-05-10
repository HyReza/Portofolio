import { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Reply, Trash2, Edit2, MoreVertical, SmilePlus, Shield } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

// Types
interface User { id: number; name: string; email: string; avatar: string | null; role?: string; }
interface Reaction { id: number; chat_message_id: string; user_id: number; reaction: string; user: { id: number; name: string }; }
export interface Message {
    id: string; user_id: number; name: string; email: string | null; avatar: string | null;
    message: string; is_reply: boolean; parent_id: string | null; is_show: boolean;
    created_at: string; reactions: Reaction[]; user?: User;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

// Markdown parser
function parseMarkdown(text: string) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
    // Markdown Links [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="underline text-indigo-500 hover:text-indigo-400">$1</a>');
    // Bare URLs
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
    const isMine = user?.id === msg.user_id;
    const isAdmin = user?.role === 'admin';
    const isOwnBubble = isMine && !isAuthor;

    // Reactions
    const rxGroups: Record<string, { count: number; me: boolean }> = {};
    msg.reactions?.forEach((r: Reaction) => {
        if (!rxGroups[r.reaction]) rxGroups[r.reaction] = { count: 0, me: false };
        rxGroups[r.reaction].count++;
        if (user && r.user_id === user.id) rxGroups[r.reaction].me = true;
    });

    const replies = allMessages.filter((m) => m.parent_id === msg.id);
    const [repliesExpanded, setRepliesExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);

    const avatarSrc = isAuthor
        ? adminPhoto
        : (msg.user?.avatar || msg.avatar);
    const displayName = isAuthor
        ? adminName
        : (msg.user?.name || msg.name);
    const initial = displayName.charAt(0).toUpperCase();

    const bubbleAlign = isOwnBubble ? 'flex-row-reverse' : '';

    // Bubble color
    const bubbleColor = isAuthor
        ? (dk ? 'bg-gradient-to-br from-teal-900/50 to-teal-800/30 border border-teal-700/30' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100')
        : isOwnBubble
            ? (dk ? 'bg-gradient-to-br from-indigo-900/40 to-violet-900/30 border border-indigo-700/20' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100')
            : (dk ? 'bg-neutral-800/60 border border-neutral-700/40' : 'bg-white border border-neutral-200/80');

    // Bubble tail
    const tailRound = isOwnBubble
        ? 'rounded-2xl rounded-tr-md'
        : 'rounded-2xl rounded-tl-md';

    const togglePicker = useCallback(() => setPickerOpenId(pickerOpenId === msg.id ? null : msg.id), [pickerOpenId, msg.id]);
    const toggleMenu = useCallback(() => setMenuOpenId(menuOpenId === msg.id ? null : msg.id), [menuOpenId, msg.id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`group flex gap-2.5 w-full ${bubbleAlign} ${isChild ? 'mt-2.5' : 'mb-4'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); }}
        >
            {/* Avatar */}
            <div className={`shrink-0 overflow-hidden rounded-full shadow-md ${isChild ? 'h-7 w-7' : 'h-9 w-9'} ${isAuthor ? 'ring-2 ring-teal-500/40' : (dk ? 'ring-1 ring-neutral-700' : 'ring-1 ring-neutral-200')}`}>
                {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <div className={`h-full w-full flex items-center justify-center text-xs font-bold ${dk ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}>
                        {initial}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`max-w-[75%] min-w-0 ${isOwnBubble ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Name + Badge + Time */}
                <div className={`flex items-center gap-1.5 mb-1 px-1 ${isOwnBubble ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-xs font-semibold truncate max-w-[120px] ${isAuthor ? (dk ? 'text-teal-400' : 'text-teal-600') : (dk ? 'text-neutral-300' : 'text-neutral-700')}`}>
                        {displayName}
                    </span>
                    {isAuthor && (
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider ${dk ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-teal-500/10 text-teal-600 border border-teal-500/25'}`}>
                            <Shield className="w-2.5 h-2.5" />
                            {t('Author', 'Penulis')}
                        </span>
                    )}
                    <span className={`text-[10px] ${dk ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {timeAgo(msg.created_at, lang)}
                        {msg.updated_at !== msg.created_at && (
                            <span className="ml-1 opacity-70">({t('edited', 'diedit')})</span>
                        )}
                    </span>
                </div>

                {/* Bubble */}
                <div className={`relative ${tailRound} ${bubbleColor} px-3.5 py-2.5 shadow-sm`}>
                    {/* Message */}
                    <div className={`text-[13px] leading-relaxed break-words whitespace-pre-wrap ${dk ? 'text-neutral-200' : 'text-neutral-800'}`}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.message) }} />

                    {/* Hover Actions - Always visible "More" for mobile/owner/admin */}
                    {user && (
                        <div className={`absolute ${isOwnBubble ? 'left-0 -translate-x-full pl-0 pr-1' : 'right-0 translate-x-full pr-0 pl-1'} top-0 flex items-center gap-0.5 z-10 ${hovered ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100 transition-opacity'}`}>
                            <ActionBtn dk={dk} onClick={togglePicker} title="React"><SmilePlus className="w-3 h-3" /></ActionBtn>
                            <ActionBtn dk={dk} onClick={onReply} title="Reply"><Reply className="w-3 h-3" /></ActionBtn>
                            {(isMine || isAdmin) && (
                                <ActionBtn dk={dk} onClick={toggleMenu} title="More"><MoreVertical className="w-3 h-3" /></ActionBtn>
                            )}
                        </div>
                    )}

                    {/* Mobile/Always visible toggle for touch devices or if not hovered */}
                    {user && !hovered && (isMine || isAdmin) && (
                        <div className={`lg:hidden absolute ${isOwnBubble ? 'left-1' : 'right-1'} top-1 z-10`}>
                             <button onClick={toggleMenu} className={`p-1 rounded-full ${dk ? 'bg-black/20 text-neutral-400' : 'bg-white/40 text-neutral-500'}`}>
                                <MoreVertical className="w-3 h-3" />
                             </button>
                        </div>
                    )}

                    {/* Emoji Picker */}
                    {pickerOpenId === msg.id && (
                        <div className={`absolute ${isOwnBubble ? 'right-0' : 'left-0'} -bottom-10 z-20 flex gap-0.5 rounded-xl p-1.5 shadow-xl border backdrop-blur-md ${dk ? 'bg-neutral-900/95 border-neutral-700' : 'bg-white/95 border-neutral-200'}`}>
                            {EMOJI_LIST.map(em => (
                                <button key={em} onClick={() => onReact(msg.id, em)} className="p-1 hover:bg-neutral-500/20 rounded-lg text-base transition-transform hover:scale-125 active:scale-95">{em}</button>
                            ))}
                        </div>
                    )}

                    {/* Context Menu */}
                    {menuOpenId === msg.id && (
                        <div className={`absolute ${isOwnBubble ? 'right-0' : 'left-0'} top-full mt-1 z-20 flex flex-col w-28 rounded-xl shadow-xl border py-1 backdrop-blur-md ${dk ? 'bg-neutral-900/95 border-neutral-700' : 'bg-white/95 border-neutral-200'}`}>
                            {isMine && (
                                <button onClick={() => { onEdit(msg); setMenuOpenId(null); }} className={`flex items-center gap-2 px-3 py-1.5 text-xs ${dk ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'}`}>
                                    <Edit2 className="w-3 h-3" /> {t('Edit', 'Edit')}
                                </button>
                            )}
                            <button onClick={() => onDelete(msg.id)} className={`flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 ${dk ? 'hover:bg-neutral-800' : 'hover:bg-red-50'}`}>
                                <Trash2 className="w-3 h-3" /> {t('Delete', 'Hapus')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Reactions */}
                {Object.keys(rxGroups).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwnBubble ? 'justify-end' : ''}`}>
                        {Object.entries(rxGroups).map(([em, data]) => (
                            <button key={em} onClick={() => user && onReact(msg.id, em)} disabled={!user}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border transition-all hover:scale-105 active:scale-95 ${data.me
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
                    <button onClick={() => setRepliesExpanded(true)} className={`flex items-center gap-1.5 text-[11px] font-semibold mt-1.5 px-1 hover:underline ${dk ? 'text-teal-400' : 'text-teal-600'}`}>
                        <Reply className="w-3 h-3 rotate-180" /> {replies.length} {t('replies', 'balasan')}
                    </button>
                )}

                {/* Expanded Replies */}
                {!isChild && repliesExpanded && replies.length > 0 && (
                    <div className={`mt-2 pl-3 relative ${dk ? 'border-l-2 border-neutral-700/50' : 'border-l-2 border-neutral-200'}`}>
                        {replies.map(reply => (
                            <ChatBubbleInner key={reply.id} msg={reply} allMessages={allMessages} user={user}
                                adminPhoto={adminPhoto} adminName={adminName} dk={dk} isChild={true}
                                onReply={onReply} onEdit={onEdit} onDelete={onDelete} onReact={onReact}
                                pickerOpenId={pickerOpenId} setPickerOpenId={setPickerOpenId}
                                menuOpenId={menuOpenId} setMenuOpenId={setMenuOpenId}
                            />
                        ))}
                        <button onClick={() => setRepliesExpanded(false)} className={`text-[11px] font-semibold hover:underline mt-2 ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
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
