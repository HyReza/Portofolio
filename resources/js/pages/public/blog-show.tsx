import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Calendar, Clock, Eye, Tag, Bookmark, MessageSquare, 
    Share2, Send, Reply, Trash2, LogOut, Lock, Copy, Check, Sparkles, Heart, Pin
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/hooks/useApp';
import { useAchievements, trackBlogRead } from '@/hooks/useGimmicks';
import { PublicLayout } from '@/layouts/PublicLayout';
import { SeoHead } from '@/components/SeoHead';

interface SeoMeta {
    meta_title_id?: string | null;
    meta_title_en?: string | null;
    meta_description_id?: string | null;
    meta_description_en?: string | null;
    og_image?: string | null;
    schema_markup?: Record<string, any> | null;
}

interface BlogTag { id: number; name_id: string; name_en: string; slug: string; }
interface Blog {
    id: number; slug: string;
    title_id: string; title_en: string;
    content_id: string | null; content_en: string | null;
    excerpt_id: string | null; excerpt_en: string | null;
    thumbnail: string | null;
    reading_time: number | null;
    view_count: number;
    published_at: string | null;
    tags: BlogTag[];
    seo_meta?: SeoMeta | null;
    comments_count?: number;
    bookmarks_count?: number;
    likes_count?: number;
}
interface Related {
    id: number; slug: string;
    title_id: string; title_en: string;
    thumbnail: string | null;
    published_at: string | null;
    tags: BlogTag[];
    comments_count?: number;
    bookmarks_count?: number;
    likes_count?: number;
    view_count: number;
}
interface Props { blog: Blog; related: Related[]; isBookmarked: boolean; isLiked: boolean; }

interface Comment {
    id: number;
    user_id: number;
    blog_id: number;
    parent_id: number | null;
    content: string;
    created_at: string;
    is_pinned?: boolean;
    likes_count?: number;
    likes?: { id: number; user_id: number; blog_comment_id: number; }[];
    user: {
        id: number;
        name: string;
        avatar: string | null;
        role?: string;
    };
}

const reveal = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } }) };
const gradients = ['from-purple-500 via-pink-500 to-orange-400', 'from-cyan-500 via-blue-500 to-purple-500', 'from-emerald-500 via-teal-500 to-cyan-500'];

export default function BlogShow({ blog, related, isBookmarked: initialIsBookmarked, isLiked: initialIsLiked }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const { unlock } = useAchievements();
    const { props } = usePage<any>();
    
    const auth = props.auth as { user: { id: number; name: string; email: string; avatar: string | null; role?: string } | null };
    const user = auth?.user;
    
    const sp = props.siteProfile || {};
    const authorName = (lang === 'id' ? (sp['name']?.value_id || sp['name']?.value_en) : (sp['name']?.value_en || sp['name']?.value_id)) || 'Reza Edi Saputra';
    const dk = appTheme === 'dark';
    const title = lang === 'id' ? (blog.title_id || blog.title_en) : (blog.title_en || blog.title_id);
    const content = lang === 'id' ? (blog.content_id || blog.content_en) : (blog.content_en || blog.content_id);
    const excerpt = lang === 'id' ? (blog.excerpt_id || blog.excerpt_en) : (blog.excerpt_en || blog.excerpt_id);

    /* ── Bookmarks & Likes State ── */
    const [bookmarked, setBookmarked] = useState(initialIsBookmarked);
    const [bookmarksCount, setBookmarksCount] = useState(blog.bookmarks_count || 0);
    const [isBookmarking, setIsBookmarking] = useState(false);

    const [liked, setLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(blog.likes_count || 0);
    const [isLiking, setIsLiking] = useState(false);

    /* ── Comments State ── */
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [commentInput, setCommentInput] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyInput, setReplyInput] = useState('');
    const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
    const [copiedShare, setCopiedShare] = useState(false);

    const commentsSectionRef = useRef<HTMLDivElement>(null);
    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    /* ── Fetch comments ── */
    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/blogs/${blog.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (e) {
            console.error('Failed to load comments:', e);
        } finally {
            setIsLoadingComments(false);
        }
    }, [blog.id]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    /* ── Toggle Like ── */
    const handleLikeToggle = async () => {
        if (!user) {
            toast.error(t('Please login with Google to like articles.', 'Silakan login dengan Google untuk menyukai artikel.'));
            return;
        }
        if (isLiking) return;
        setIsLiking(true);
        try {
            const res = await fetch(`/api/blogs/${blog.id}/like`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf() },
            });
            if (res.ok) {
                const data = await res.json();
                setLiked(data.liked);
                setLikesCount(data.likes_count);
                toast.success(
                    data.liked 
                        ? t('Post liked!', 'Artikel disukai!') 
                        : t('Post unliked.', 'Batal menyukai artikel.')
                );
            }
        } catch {
            toast.error(t('An error occurred. Please try again.', 'Terjadi kesalahan. Silakan coba lagi.'));
        } finally {
            setIsLiking(false);
        }
    };

    /* ── Toggle Bookmark ── */
    const handleBookmarkToggle = async () => {
        if (!user) {
            toast.error(t('Please login with Google to bookmark articles.', 'Silakan login dengan Google untuk menyimpan artikel.'));
            return;
        }
        if (isBookmarking) return;
        setIsBookmarking(true);
        try {
            const res = await fetch(`/api/blogs/${blog.id}/bookmark`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf() },
            });
            if (res.ok) {
                const data = await res.json();
                setBookmarked(data.bookmarked);
                setBookmarksCount(data.bookmarks_count);
                toast.success(
                    data.bookmarked 
                        ? t('Article added to bookmarks!', 'Artikel disimpan ke bookmark!') 
                        : t('Article removed from bookmarks.', 'Artikel dihapus dari bookmark.')
                );
            }
        } catch {
            toast.error(t('An error occurred. Please try again.', 'Terjadi kesalahan. Silakan coba lagi.'));
        } finally {
            setIsBookmarking(false);
        }
    };

    /* ── Post a Comment ── */
    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim() || submittingComment || !user) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/blogs/${blog.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf()
                },
                body: JSON.stringify({ content: commentInput.trim() }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setCommentInput('');
                toast.success(t('Comment posted successfully!', 'Komentar berhasil dikirim!'));
                unlock('socializer');
            }
        } catch {
            toast.error(t('Failed to post comment. Please try again.', 'Gagal mengirim komentar. Silakan coba lagi.'));
        } finally {
            setSubmittingComment(false);
        }
    };

    /* ── Post a Reply ── */
    const handlePostReply = async (parentId: number) => {
        if (!replyInput.trim() || submittingComment || !user) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/blogs/${blog.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf()
                },
                body: JSON.stringify({ 
                    content: replyInput.trim(),
                    parent_id: parentId
                }),
            });
            if (res.ok) {
                const newReply = await res.json();
                setComments(prev => [...prev, newReply]);
                setReplyInput('');
                setReplyingToId(null);
                toast.success(t('Reply posted successfully!', 'Balasan berhasil dikirim!'));
                unlock('socializer');
            }
        } catch {
            toast.error(t('Failed to post reply. Please try again.', 'Gagal mengirim balasan. Silakan coba lagi.'));
        } finally {
            setSubmittingComment(false);
        }
    };

    /* ── Confirm Delete Comment ── */
    const handleDeleteComment = async () => {
        if (!deletingCommentId) return;
        const id = deletingCommentId;
        setDeletingCommentId(null);
        try {
            const res = await fetch(`/api/blogs/comments/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrf() }
            });
            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
                toast.success(t('Comment deleted.', 'Komentar dihapus.'));
            }
        } catch {
            toast.error(t('Failed to delete comment.', 'Gagal menghapus komentar.'));
        }
    };

    /* ── Like Comment ── */
    const handleLikeComment = async (commentId: number) => {
        if (!user) {
            toast.error(t('Please login with Google to like comments.', 'Silakan login dengan Google untuk menyukai komentar.'));
            return;
        }
        try {
            const res = await fetch(`/api/blogs/comments/${commentId}/like`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf() }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            likes_count: data.likes_count,
                            likes: data.liked 
                                ? [...(c.likes || []), { id: 0, user_id: user.id, blog_comment_id: commentId }]
                                : (c.likes || []).filter(l => l.user_id !== user.id)
                        };
                    }
                    return c;
                }));
            }
        } catch {
            toast.error(t('Failed to toggle like.', 'Gagal menyukai komentar.'));
        }
    };

    /* ── Pin Comment (Admin Only) ── */
    const handlePinComment = async (commentId: number) => {
        try {
            const res = await fetch(`/api/blogs/comments/${commentId}/pin`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf() }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(prev => {
                    const updated = prev.map(c => c.id === commentId ? { ...c, is_pinned: data.is_pinned } : c);
                    // Re-sort comments so pinned ones are placed first
                    return [...updated].sort((a, b) => {
                        if (a.is_pinned && !b.is_pinned) return -1;
                        if (!a.is_pinned && b.is_pinned) return 1;
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    });
                });
                toast.success(
                    data.is_pinned 
                        ? t('Comment pinned to top!', 'Komentar disematkan ke atas!') 
                        : t('Comment unpinned.', 'Sematkan komentar dilepas.')
                );
            }
        } catch {
            toast.error(t('Failed to toggle pin.', 'Gagal menyematkan komentar.'));
        }
    };

    /* ── Copy share link ── */
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        toast.success(t('Link copied to clipboard!', 'Tautan disalin ke papan klip!'));
        setTimeout(() => setCopiedShare(false), 2000);
    };

    /* ── Social Share Links ── */
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = title || '';
    const shareLinks = {
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };

    /* ── Reading progress bar ── */
    const [progress, setProgress] = useState(0);
    const articleRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onScroll = () => {
            if (!articleRef.current) return;
            const el = articleRef.current;
            const rect = el.getBoundingClientRect();
            const scrolled = Math.max(0, -rect.top);
            const total = el.scrollHeight - window.innerHeight;
            const p = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
            setProgress(p);
            // Bookworm: read >80%
            if (p > 80) {
                unlock('bookworm');
                const reads = trackBlogRead(blog.slug);
                if (reads.length >= 3) unlock('scholar');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [blog.slug]);

    const schemaMarkup = blog.seo_meta?.schema_markup || {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: excerpt || '',
        image: blog.thumbnail ? `${window.location.origin}/storage/${blog.thumbnail}` : undefined,
        datePublished: blog.published_at || undefined,
        author: {
            '@type': 'Person',
            name: authorName
        }
    };

    /* ── Code Copy Button ── */
    useEffect(() => {
        const timer = setTimeout(() => {
            const preBlocks = document.querySelectorAll('pre');
            preBlocks.forEach((pre) => {
                if (pre.querySelector('.copy-btn')) return;
                
                pre.style.position = 'relative';
                pre.classList.add('group');
                
                const btn = document.createElement('button');
                btn.className = 'copy-btn absolute top-3 right-3 p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10';
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
                
                btn.onclick = () => {
                    const code = pre.querySelector('code');
                    if (code) {
                        navigator.clipboard.writeText(code.innerText);
                        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>';
                        setTimeout(() => {
                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
                        }, 2000);
                    }
                };
                
                pre.appendChild(btn);
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [content]);

    // Group comments into root comments & child replies
    const rootComments = comments.filter(c => !c.parent_id);

    return (
        <PublicLayout>
            <SeoHead 
                title={title} 
                description={excerpt || ''} 
                image={blog.thumbnail ? `/storage/${blog.thumbnail}` : null}
                seoMeta={blog.seo_meta}
                schemaMarkup={schemaMarkup}
            />

            {/* Reading progress bar */}
            <div className="fixed left-0 right-0 top-0 z-50 h-1">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                />
            </div>

            <motion.div ref={articleRef} initial="hidden" animate="visible" className="space-y-12 pb-12">
                <div className="grid gap-12 lg:grid-cols-12">
                    {/* LEFT CONTENT: Article */}
                    <div className="lg:col-span-8">
                        <div className="space-y-10">
                            {/* Header */}
                            <motion.header variants={reveal} custom={0} className="space-y-6">
                                <Link href="/blog" className={`group inline-flex items-center gap-2 text-xs font-bold transition-all ${dk ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-900'}`}>
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    {t('Back to Blog', 'Kembali ke Blog')}
                                </Link>
                                
                                {blog.tags && blog.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {blog.tags.map(tag => {
                                            const tagName = lang === 'id' ? (tag.name_id || tag.name_en) : (tag.name_en || tag.name_id);
                                            return (
                                                <span key={tag.id} className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dk ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                                    {tagName}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                                    {title}
                                </h1>

                                <div className={`flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {blog.published_at && (
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 opacity-50" />
                                            {new Date(blog.published_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    )}
                                    {blog.reading_time && (
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 opacity-50" /> {blog.reading_time}m
                                        </span>
                                    )}
                                    <span className="flex items-center gap-2">
                                        <Eye className="h-3 w-3 opacity-50" /> {blog.view_count.toLocaleString()}
                                    </span>
                                </div>
                            </motion.header>

                            {/* Thumbnail */}
                            {blog.thumbnail && (
                                <motion.div variants={reveal} custom={1} className="overflow-hidden rounded-3xl">
                                    <img src={`/storage/${blog.thumbnail}`} alt={title} className="max-h-[400px] w-full object-cover" />
                                </motion.div>
                            )}

                            {/* ARTICLE CONTENT */}
                            <motion.article
                                variants={reveal} custom={2}
                                className={`prose prose-base max-w-none leading-relaxed sm:prose-lg 
                                    ${dk ? 'prose-invert' : 'prose-neutral'} 
                                    prose-headings:font-black prose-headings:tracking-tight 
                                    prose-p:text-neutral-700 dark:prose-p:text-neutral-300
                                    prose-a:text-indigo-600 dark:prose-a:text-indigo-400
                                    prose-pre:rounded-2xl prose-pre:bg-neutral-900
                                    prose-img:rounded-2xl
                                `}
                                dangerouslySetInnerHTML={{ __html: content || '<p>No content available.</p>' }}
                            />
                            
                            {/* Compact, Premium Engagement Action Bar */}
                            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 border-y ${dk ? 'border-neutral-800 bg-neutral-900/10' : 'border-neutral-200 bg-neutral-50/20'} rounded-3xl px-6`}>
                                {/* Compact likes, bookmarks & comments counts */}
                                <div className="flex items-center gap-4 sm:gap-6">
                                    {/* Like Button */}
                                    <button 
                                        onClick={handleLikeToggle} 
                                        disabled={isLiking}
                                        className={`group flex items-center gap-1.5 text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 ${
                                            liked 
                                                ? 'text-red-500' 
                                                : (dk ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900')
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl border transition-all ${
                                            liked 
                                                ? (dk ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-100')
                                                : (dk ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200')
                                        }`}>
                                            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                                        </div>
                                        <span>{likesCount}</span>
                                    </button>

                                    {/* Bookmark Button */}
                                    <button 
                                        onClick={handleBookmarkToggle} 
                                        disabled={isBookmarking}
                                        className={`group flex items-center gap-1.5 text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 ${
                                            bookmarked 
                                                ? 'text-indigo-500' 
                                                : (dk ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900')
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl border transition-all ${
                                            bookmarked 
                                                ? (dk ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100')
                                                : (dk ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200')
                                        }`}>
                                            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                                        </div>
                                        <span>{bookmarksCount}</span>
                                    </button>

                                    {/* Comments Count Button */}
                                    <button 
                                        onClick={() => commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                        className={`group flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                                            dk ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl border ${dk ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <span>{comments.length}</span>
                                    </button>
                                </div>

                                {/* Sharing Widget */}
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        {t('Share:', 'Bagikan:')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                                            className={`p-2 rounded-xl border flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 ${dk ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30' : 'bg-white border-neutral-200 text-neutral-600 hover:text-emerald-600 hover:border-emerald-300'}`}>
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.094-3.486c1.657.983 3.272 1.498 4.954 1.499 5.516.002 10.021-4.499 10.025-10.022a9.98 9.98 0 0 0-2.934-7.098c-1.897-1.902-4.417-2.95-7.09-2.952-5.525 0-10.029 4.502-10.033 10.027-.001 1.83.491 3.619 1.425 5.187l-.953 3.484 3.583-.939zm12.723-5.326c-.305-.152-1.8-.888-2.079-.989-.28-.102-.483-.152-.686.152-.203.304-.785.989-.963 1.192-.178.203-.355.228-.66.076-.304-.152-1.285-.474-2.448-1.512-.905-.807-1.516-1.804-1.694-2.108-.178-.304-.019-.468.133-.62.137-.136.305-.355.457-.532.152-.177.203-.304.305-.507.102-.203.051-.38-.025-.532-.076-.152-.686-1.653-.94-2.26-.247-.595-.499-.513-.686-.523-.178-.008-.381-.01-.584-.01s-.533.076-.813.38c-.28.304-1.067 1.039-1.067 2.535s1.092 2.94 1.244 3.143c.152.203 2.15 3.284 5.21 4.602.728.314 1.296.502 1.74.643.73.232 1.396.199 1.922.12.586-.088 1.8-.736 2.054-1.42.254-.683.254-1.267.178-1.39-.076-.123-.28-.203-.585-.355z"/>
                                            </svg>
                                        </a>
                                        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                                            className={`p-2 rounded-xl border flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 ${dk ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-blue-400 hover:border-blue-500/30' : 'bg-white border-neutral-200 text-neutral-600 hover:text-blue-600 hover:border-blue-300'}`}>
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                            </svg>
                                        </a>
                                        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" title="Twitter/X"
                                            className={`p-2 rounded-xl border flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 ${dk ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-sky-400 hover:border-sky-500/30' : 'bg-white border-neutral-200 text-neutral-600 hover:text-sky-600 hover:border-sky-300'}`}>
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                        </a>
                                        <button onClick={handleCopyLink} title={t('Copy Link', 'Salin Tautan')}
                                            className={`p-2 rounded-xl border flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 ${dk ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-indigo-400 hover:border-indigo-500/30' : 'bg-white border-neutral-200 text-neutral-600 hover:text-indigo-600 hover:border-indigo-300'}`}>
                                            {copiedShare ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── COMMENTS SECTION ── */}
                            <div ref={commentsSectionRef} className="pt-10 space-y-8">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2 rounded-xl ${dk ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
                                        <MessageSquare className="h-5 w-5 text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('Discussion', 'Diskusi')}</h3>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dk ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'}`}>
                                        {comments.length}
                                    </span>
                                </div>

                                {/* Write Comment Form / Google Sign In */}
                                {!user ? (
                                    /* Google Login Card */
                                    <div className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border text-center ${dk ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm`}>
                                        <div className={`p-3 rounded-2xl mb-4 ${dk ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                                            <Lock className={`h-6 w-6 ${dk ? 'text-neutral-400' : 'text-neutral-500'}`} />
                                        </div>
                                        <h4 className={`text-base font-bold ${dk ? 'text-white' : 'text-neutral-900'}`}>
                                            {t('Want to join the discussion?', 'Ingin bergabung dalam diskusi?')}
                                        </h4>
                                        <p className={`mt-2 text-xs sm:text-sm max-w-sm leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'} mb-6`}>
                                            {t(
                                                'Sign in with your Google account to post comments, write replies, and save this article.',
                                                'Masuk dengan akun Google Anda untuk menulis komentar, membalas komentar, dan menyimpan artikel.'
                                            )}
                                        </p>
                                        <a href={`/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`}
                                            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${dk ? 'bg-white text-neutral-800 hover:bg-neutral-100' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
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
                                    /* Write Comment Form */
                                    <form onSubmit={handlePostComment} className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className={`shrink-0 h-10 w-10 rounded-full overflow-hidden shadow-sm flex items-center justify-center ${dk ? 'ring-2 ring-neutral-700' : 'ring-2 ring-neutral-200'}`}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className={`h-full w-full flex items-center justify-center text-sm font-bold ${dk ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <textarea
                                                    value={commentInput}
                                                    onChange={(e) => setCommentInput(e.target.value)}
                                                    placeholder={t('Join the discussion, share your thoughts...', 'Bergabung dalam diskusi, bagikan pemikiran Anda...')}
                                                    rows={3}
                                                    required
                                                    disabled={submittingComment}
                                                    className={`w-full resize-none rounded-2xl border p-3 sm:p-4 text-sm outline-none transition-all focus:ring-2 ${dk
                                                        ? 'border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus:border-teal-500 focus:ring-teal-500/15'
                                                        : 'border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-teal-400 focus:ring-teal-400/15'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 items-center">
                                            <span className={`text-[10px] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                {t('Logged in as ', 'Masuk sebagai ')}<strong className={dk ? 'text-neutral-400' : 'text-neutral-600'}>{user.name}</strong>
                                            </span>
                                            <button 
                                                type="submit" 
                                                disabled={!commentInput.trim() || submittingComment}
                                                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95 ${
                                                    commentInput.trim() && !submittingComment
                                                        ? 'bg-teal-500 text-white hover:bg-teal-400'
                                                        : (dk ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed')
                                                }`}
                                            >
                                                <Send className="h-3.5 w-3.5" />
                                                {submittingComment ? t('Posting...', 'Mengirim...') : t('Comment', 'Komentar')}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Comments List */}
                                <div className="space-y-6">
                                    {isLoadingComments ? (
                                        /* Skeletons */
                                        <div className="space-y-4 py-4">
                                            {[1, 2].map(n => (
                                                <div key={n} className="flex gap-3 animate-pulse">
                                                    <div className={`h-10 w-10 rounded-full ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                                    <div className="flex-1 space-y-2">
                                                        <div className={`h-4 w-32 rounded-lg ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                                        <div className={`h-3 w-full rounded-lg ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                                        <div className={`h-3 w-3/4 rounded-lg ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className={`text-center py-10 rounded-3xl border border-dashed ${dk ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'}`}>
                                            <p className="text-sm">{t('No comments yet. Start the conversation!', 'Belum ada komentar. Mulai percakapan!')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <AnimatePresence initial={false}>
                                                {rootComments.map((comment) => {
                                                    const commentReplies = comments.filter(r => r.parent_id === comment.id);
                                                    const isReplying = replyingToId === comment.id;

                                                    return (
                                                        <motion.div 
                                                            key={comment.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 15 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -15 }}
                                                            className={`p-4 sm:p-5 rounded-2xl border ${dk ? 'bg-neutral-900/40 border-neutral-800/80' : 'bg-white border-neutral-100 shadow-sm'} space-y-4`}
                                                        >
                                                            {/* User Info & Header */}
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex gap-3">
                                                                    <div className={`h-9 w-9 rounded-full overflow-hidden flex items-center justify-center ${dk ? 'ring-1 ring-neutral-700' : 'ring-1 ring-neutral-200'}`}>
                                                                        {comment.user.avatar ? (
                                                                            <img src={comment.user.avatar} alt="" className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <div className={`h-full w-full flex items-center justify-center text-xs font-bold ${dk ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'}`}>
                                                                                {comment.user.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-sm font-bold">{comment.user.name}</span>
                                                                            {comment.user.role === 'admin' && (
                                                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${dk ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                                                                                    {t('Author', 'Penulis')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className={`text-[10px] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                                            {new Date(comment.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Deletion Option */}
                                                                {user && (user.id === comment.user_id || user.role === 'admin') && (
                                                                    <button 
                                                                        onClick={() => setDeletingCommentId(comment.id)}
                                                                        className={`p-1.5 rounded-lg transition-colors text-neutral-400 hover:text-red-400 ${dk ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                                                        title={t('Delete Comment', 'Hapus Komentar')}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Pinned Badge */}
                                                            {comment.is_pinned && (
                                                                <div className="flex items-center gap-1 text-[11px] font-extrabold text-teal-500 dark:text-teal-400 uppercase tracking-widest bg-teal-500/5 dark:bg-teal-500/10 py-1 px-3.5 rounded-xl border border-teal-500/10 w-fit">
                                                                    <Pin className="h-3 w-3 fill-current rotate-45" />
                                                                    <span>{t('Pinned by Admin', 'Disematkan')}</span>
                                                                </div>
                                                            )}

                                                            {/* Content */}
                                                            <p className={`text-sm leading-relaxed whitespace-pre-line ${dk ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                                {comment.content}
                                                            </p>

                                                            {/* Footer Actions (Reply, Like, Pin togglers) */}
                                                            <div className="flex items-center gap-4 pt-1">
                                                                {user && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setReplyingToId(isReplying ? null : comment.id);
                                                                            setReplyInput('');
                                                                        }}
                                                                        className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                                                                            isReplying 
                                                                                ? 'text-teal-500' 
                                                                                : (dk ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-600')
                                                                        }`}
                                                                    >
                                                                        <Reply className="h-3 w-3" />
                                                                        {isReplying ? t('Cancel', 'Batal') : t('Reply', 'Balas')}
                                                                    </button>
                                                                )}

                                                                {/* Like Comment */}
                                                                <button
                                                                    onClick={() => handleLikeComment(comment.id)}
                                                                    className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                                                        comment.likes?.some(l => l.user_id === user?.id)
                                                                            ? 'text-red-500'
                                                                            : (dk ? 'text-neutral-500 hover:text-red-400' : 'text-neutral-400 hover:text-red-500')
                                                                    }`}
                                                                >
                                                                    <Heart className={`h-3.5 w-3.5 ${comment.likes?.some(l => l.user_id === user?.id) ? 'fill-current' : ''}`} />
                                                                    <span>{comment.likes_count || 0}</span>
                                                                </button>

                                                                {/* Pin (Admin Only) */}
                                                                {user?.role === 'admin' && (
                                                                    <button
                                                                        onClick={() => handlePinComment(comment.id)}
                                                                        className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors ${
                                                                            comment.is_pinned
                                                                                ? 'text-teal-500'
                                                                                : (dk ? 'text-neutral-500 hover:text-teal-400' : 'text-neutral-400 hover:text-teal-500')
                                                                        }`}
                                                                    >
                                                                        <Pin className="h-3.5 w-3.5" />
                                                                        {comment.is_pinned ? t('Unpin', 'Lepas Sematan') : t('Pin', 'Sematkan')}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Reply Form */}
                                                            <AnimatePresence>
                                                                {isReplying && (
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, height: 0 }} 
                                                                        animate={{ opacity: 1, height: 'auto' }} 
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="overflow-hidden space-y-2.5 pt-2"
                                                                    >
                                                                        <div className="flex gap-2">
                                                                            <textarea
                                                                                value={replyInput}
                                                                                onChange={(e) => setReplyInput(e.target.value)}
                                                                                placeholder={t('Write a reply...', 'Tulis balasan...')}
                                                                                rows={2}
                                                                                required
                                                                                className={`flex-1 resize-none rounded-xl border p-2.5 text-xs outline-none transition-all ${dk
                                                                                    ? 'border-neutral-800 bg-neutral-800 text-white focus:border-teal-500'
                                                                                    : 'border-neutral-200 bg-white text-neutral-900 focus:border-teal-400'
                                                                                }`}
                                                                            />
                                                                        </div>
                                                                        <div className="flex justify-end gap-2">
                                                                            <button 
                                                                                onClick={() => handlePostReply(comment.id)}
                                                                                disabled={!replyInput.trim() || submittingComment}
                                                                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-semibold transition-all active:scale-95 ${
                                                                                    replyInput.trim() && !submittingComment
                                                                                        ? 'bg-teal-500 text-white hover:bg-teal-400'
                                                                                        : (dk ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed')
                                                                                }`}
                                                                            >
                                                                                <Send className="h-3 w-3" />
                                                                                {t('Send Reply', 'Kirim Balasan')}
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            {/* Child Replies */}
                                                            {commentReplies.length > 0 && (
                                                                <div className={`mt-4 pl-4 border-l-2 ${dk ? 'border-neutral-800' : 'border-neutral-100'} space-y-4`}>
                                                                    {commentReplies.map(reply => (
                                                                        <div key={reply.id} className="space-y-2 pt-2">
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex gap-2">
                                                                                    <div className={`h-7 w-7 rounded-full overflow-hidden flex items-center justify-center ${dk ? 'ring-1 ring-neutral-700' : 'ring-1 ring-neutral-200'}`}>
                                                                                        {reply.user.avatar ? (
                                                                                            <img src={reply.user.avatar} alt="" className="h-full w-full object-cover" />
                                                                                        ) : (
                                                                                            <div className={`h-full w-full flex items-center justify-center text-[10px] font-bold ${dk ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'}`}>
                                                                                                {reply.user.name.charAt(0).toUpperCase()}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-1">
                                                                                            <span className="text-xs font-bold">{reply.user.name}</span>
                                                                                            {reply.user.role === 'admin' && (
                                                                                                <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded-md ${dk ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                                                                                                    {t('Author', 'Penulis')}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className={`text-[9px] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                                                            {new Date(reply.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {/* Deletion Option */}
                                                                                {user && (user.id === reply.user_id || user.role === 'admin') && (
                                                                                    <button 
                                                                                        onClick={() => setDeletingCommentId(reply.id)}
                                                                                        className={`p-1 rounded-lg transition-colors text-neutral-400 hover:text-red-400 ${dk ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                                                                        title={t('Delete Reply', 'Hapus Balasan')}
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${dk ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                                                {reply.content}
                                                                            </p>
                                                                            
                                                                            <div className="flex items-center gap-4 pt-0.5">
                                                                                {/* Like Reply Button */}
                                                                                <button
                                                                                    onClick={() => handleLikeComment(reply.id)}
                                                                                    className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${
                                                                                        reply.likes?.some(l => l.user_id === user?.id)
                                                                                            ? 'text-red-500'
                                                                                            : (dk ? 'text-neutral-500 hover:text-red-400' : 'text-neutral-400 hover:text-red-500')
                                                                                    }`}
                                                                                >
                                                                                    <Heart className={`h-2.5 w-2.5 ${reply.likes?.some(l => l.user_id === user?.id) ? 'fill-current' : ''}`} />
                                                                                    <span>{reply.likes_count || 0}</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <div className={`h-[1px] flex-1 ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                <div className={`h-2 w-2 rounded-full ${dk ? 'bg-neutral-700' : 'bg-neutral-200'}`} />
                                <div className={`h-[1px] flex-1 ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT: Sidebar */}
                    <div className="space-y-12 lg:sticky lg:top-24 lg:h-fit lg:col-span-4">
                        {/* TAGS CLOUD */}
                        {blog.tags && blog.tags.length > 0 && (
                            <motion.div variants={reveal} custom={3} className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-indigo-500" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t('Tags', 'Topik')}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {blog.tags.map(tag => {
                                        const tagName = lang === 'id' ? (tag.name_id || tag.name_en) : (tag.name_en || tag.name_id);
                                        return (
                                            <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className={`rounded-xl px-4 py-2 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 ${dk ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-white/5' : 'bg-neutral-100 text-neutral-600 hover:bg-white hover:shadow-md hover:text-indigo-600 border border-neutral-200'}`}>
                                                {tagName || 'Topic'}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* RELATED ARTICLES */}
                        {related.length > 0 && (
                            <motion.div variants={reveal} custom={4} className="space-y-8">
                                <div className="flex items-center justify-between border-b pb-4 dark:border-neutral-800">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t('Related Posts', 'Artikel Terkait')}</h3>
                                    <Link href="/blog" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">{t('View All', 'Semua')}</Link>
                                </div>
                                <div className="space-y-6">
                                    {related.map((r, i) => (
                                        <Link key={r.id} href={`/blog/${r.slug}`} className="group flex items-start gap-4">
                                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                                {r.thumbnail ? (
                                                    <img src={`/storage/${r.thumbnail}`} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className={`flex h-full items-center justify-center bg-gradient-to-br ${gradients[i % gradients.length]} opacity-50`} />
                                                )}
                                                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className={`line-clamp-2 text-sm font-bold leading-snug transition-colors ${dk ? 'text-neutral-200 group-hover:text-indigo-400' : 'text-neutral-800 group-hover:text-indigo-600'}`}>
                                                    {lang === 'id' ? (r.title_id || r.title_en) : (r.title_en || r.title_id)}
                                                </h4>
                                                
                                                {/* Meta counts under related list title */}
                                                <div className={`flex items-center gap-3.5 text-[9px] font-bold ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {(r.view_count || 0).toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {r.likes_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" />
                                                        {r.comments_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingCommentId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeletingCommentId(null)}
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
                                    <Trash2 size={24} />
                                </div>
                                <h3 className={`mb-2 text-lg font-bold ${dk ? 'text-white' : 'text-neutral-900'}`}>
                                    {t('Delete Comment?', 'Hapus Komentar?')}
                                </h3>
                                <p className={`mb-6 text-sm leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {t(
                                        'Are you sure you want to delete this comment? Sub-replies will also be removed. This action cannot be undone.', 
                                        'Apakah Anda yakin ingin menghapus komentar ini? Balasan di dalamnya juga akan terhapus. Tindakan ini tidak dapat dibatalkan.'
                                    )}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setDeletingCommentId(null)}
                                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${dk ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'}`}
                                    >
                                        {t('Cancel', 'Batal')}
                                    </button>
                                    <button 
                                        onClick={handleDeleteComment}
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
