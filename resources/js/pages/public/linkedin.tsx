import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Linkedin, ExternalLink, ThumbsUp, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';

interface LinkedinPost {
    id: number;
    post_url: string;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    likes_count: number;
    comments_count: number;
    published_at: string | null;
}

interface Props {
    posts: LinkedinPost[];
    li_stats?: Record<string, string>;
}

const reveal = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

export default function LinkedinPage({ posts, li_stats = {} }: Props) {
    const { theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    // Format linkedin username safely for URL
    const liUsername = li_stats.li_username ? li_stats.li_username.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '') : 'bfreza';

    return (
        <PublicLayout>
            <Head title="LinkedIn" />

            <section className="space-y-6 pb-12">
                {/* Profile Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center py-4">
                    <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
                        {/* LinkedIn Icon */}
                        <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg ${dk ? 'bg-[#0A66C2] shadow-[#0A66C2]/20' : 'bg-[#0A66C2] shadow-[#0A66C2]/20'}`}>
                            <Linkedin className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <h1 className="text-2xl font-bold">LinkedIn</h1>
                            <p className={`text-sm text-center md:text-left ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {li_stats.li_bio || t('My professional posts and thoughts on LinkedIn', 'Postingan profesional saya di LinkedIn')}
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-lg font-bold ${dk ? 'text-white' : 'text-neutral-900'}`}>{posts.length}</span>
                                    <span className={`text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{t('Posts', 'Postingan')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-2 md:ml-auto md:mt-0 md:items-end">
                        <a href={`https://linkedin.com/in/${liUsername}`} target="_blank" rel="noopener noreferrer"
                            className="rounded-xl bg-[#0A66C2] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0A66C2]/25 transition-all duration-300 hover:scale-105 hover:bg-[#004182] hover:shadow-xl hover:shadow-[#0A66C2]/40">
                            {t('Open LinkedIn', 'Buka LinkedIn')}
                        </a>
                    </div>
                </div>

                <hr className={`${dk ? 'border-neutral-800' : 'border-neutral-200'}`} />

                {/* Posts grid */}
                {posts.length === 0 ? (
                    <div className={`flex min-h-[200px] items-center justify-center rounded-xl border text-sm ${dk ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'}`}>
                        {t('No LinkedIn posts yet. Check back later!', 'Belum ada postingan LinkedIn. Cek lagi nanti!')}
                    </div>
                ) : (
                    <motion.div initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2">
                        {posts.map((post, i) => {
                            // Try to extract activity ID for embedding
                            const activityMatch = post.post_url.match(/activity[:-](\d+)/);
                            const embedUrl = activityMatch
                                ? `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`
                                : null;

                            return (
                            <motion.div key={post.id} variants={reveal} custom={i}
                                className={`group overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg ${dk ? 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                                {/* Embedded LinkedIn Post */}
                                {embedUrl ? (
                                    <div className="w-full">
                                        <iframe
                                            src={embedUrl}
                                            height="500"
                                            width="100%"
                                            frameBorder="0"
                                            allowFullScreen
                                            title={post.title || 'LinkedIn Post'}
                                            className="w-full rounded-t-xl"
                                            style={{ minHeight: '400px' }}
                                        />
                                    </div>
                                ) : post.thumbnail ? (
                                    <a href={post.post_url} target="_blank" rel="noopener" className="block">
                                        <div className="aspect-video overflow-hidden">
                                            <img src={post.thumbnail.startsWith('http') ? post.thumbnail : `/storage/${post.thumbnail}`} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        </div>
                                    </a>
                                ) : null}
                                <div className="p-4">
                                    {post.title && (
                                        <h3 className={`mb-1 font-medium line-clamp-2 ${dk ? 'text-neutral-100' : 'text-neutral-800'}`}>{post.title}</h3>
                                    )}
                                    {post.description && (
                                        <p className={`mb-3 text-sm line-clamp-2 ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{post.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex items-center gap-1 text-xs ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                <ThumbsUp className="h-3.5 w-3.5" /> {post.likes_count}
                                            </span>
                                            <span className={`flex items-center gap-1 text-xs ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                <MessageSquare className="h-3.5 w-3.5" /> {post.comments_count}
                                            </span>
                                        </div>
                                        <a href={post.post_url} target="_blank" rel="noopener" className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#0A66C2] ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            <ExternalLink className="h-3 w-3" /> {t('View on LinkedIn', 'Lihat di LinkedIn')}
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </section>
        </PublicLayout>
    );
}
