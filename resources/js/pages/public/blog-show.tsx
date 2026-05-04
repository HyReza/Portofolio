import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Eye, Tag, Github, Linkedin, Instagram } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
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
}
interface Related {
    id: number; slug: string;
    title_id: string; title_en: string;
    thumbnail: string | null;
    published_at: string | null;
    tags: BlogTag[];
}
interface Props { blog: Blog; related: Related[]; }

const reveal = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } }) };
const gradients = ['from-purple-500 via-pink-500 to-orange-400', 'from-cyan-500 via-blue-500 to-purple-500', 'from-emerald-500 via-teal-500 to-cyan-500'];

export default function BlogShow({ blog, related }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const { props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const sp = props.siteProfile || {};
    const authorName = (lang === 'id' ? (sp['name']?.value_id || sp['name']?.value_en) : (sp['name']?.value_en || sp['name']?.value_id)) || 'Reza Edi Saputra';
    const dk = appTheme === 'dark';
    const title = lang === 'id' ? (blog.title_id || blog.title_en) : (blog.title_en || blog.title_id);
    const content = lang === 'id' ? (blog.content_id || blog.content_en) : (blog.content_en || blog.content_id);
    const excerpt = lang === 'id' ? (blog.excerpt_id || blog.excerpt_en) : (blog.excerpt_en || blog.excerpt_id);

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
            setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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
                                
                                {/* Categories/Tags floating above */}
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

                            {/* Compact Thumbnail */}
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
                            
                            <div className="flex items-center gap-4 pt-12">
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
                                                <p className={`text-[10px] font-medium ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                    {new Date(r.published_at!).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </PublicLayout>
    );
}
