import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Github, Calendar, Eye, Clock } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAchievements, trackProjectView } from '@/hooks/useGimmicks';
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

interface Project {
    id: number;
    slug: string;
    title_id: string;
    title_en: string;
    excerpt_id: string | null;
    excerpt_en: string | null;
    problem_id: string | null;
    problem_en: string | null;
    solution_id: string | null;
    solution_en: string | null;
    content_id: string | null;
    content_en: string | null;
    thumbnail: string | null;
    images: string[] | null;
    tech_stack: string[] | null;
    demo_url: string | null;
    repo_url: string | null;
    is_featured: boolean;
    published_at: string | null;
    seo_meta?: SeoMeta | null;
}

interface Related {
    id: number;
    slug: string;
    title_id: string;
    title_en: string;
    thumbnail: string | null;
    tech_stack: string[] | null;
}

interface Props {
    project: Project;
    related: Related[];
}

const reveal = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }
    })
};

export default function ProjectShow({ project, related = [] }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const { unlock } = useAchievements();
    const { props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const sp = props.siteProfile || {};
    const authorName = (lang === 'id' ? (sp['name']?.value_id || sp['name']?.value_en) : (sp['name']?.value_en || sp['name']?.value_id)) || 'Reza Edi Saputra';
    const dk = appTheme === 'dark';

    // Track project view for achievements
    useEffect(() => {
        if (project?.slug) {
            unlock('recruiter');
            const views = trackProjectView(project.slug);
            if (views.length >= 3) unlock('art_critic');
        }
    }, [project?.slug, unlock]);

    // Fallback if project is missing (should not happen with standard Inertia/Laravel binding)
    if (!project) return null;

    const title = lang === 'id' ? (project.title_id || project.title_en) : (project.title_en || project.title_id);
    const excerpt = lang === 'id' ? (project.excerpt_id || project.excerpt_en) : (project.excerpt_en || project.excerpt_id);
    const problem = lang === 'id' ? (project.problem_id || project.problem_en) : (project.problem_en || project.problem_id);
    const solution = lang === 'id' ? (project.solution_id || project.solution_en) : (project.solution_en || project.solution_id);
    const content = lang === 'id' ? (project.content_id || project.content_en) : (project.content_en || project.content_id);

    const schemaMarkup = project.seo_meta?.schema_markup || {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: title,
        description: excerpt || '',
        image: project.thumbnail ? `${window.location.origin}/storage/${project.thumbnail}` : undefined,
        url: project.demo_url || (typeof window !== 'undefined' ? window.location.href : ''),
        author: { '@type': 'Person', name: authorName }
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
            setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ── Code Copy Button ── */
    useEffect(() => {
        const injectButtons = (container: HTMLElement) => {
            const preBlocks = container.querySelectorAll('pre');
            preBlocks.forEach((pre) => {
                if (pre.querySelector('.copy-btn')) return;
                
                pre.style.position = 'relative';
                pre.classList.add('group');
                
                const btn = document.createElement('button');
                btn.className = 'copy-btn absolute top-3 right-3 p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer shadow-lg backdrop-blur-md';
                btn.setAttribute('aria-label', 'Copy code');
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
                
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const code = pre.querySelector('code');
                    if (code) {
                        navigator.clipboard.writeText(code.innerText).then(() => {
                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>';
                            setTimeout(() => {
                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
                            }, 2000);
                        });
                    }
                };
                pre.appendChild(btn);
            });
        };

        if (articleRef.current) {
            injectButtons(articleRef.current);
            const observer = new MutationObserver(() => articleRef.current && injectButtons(articleRef.current));
            observer.observe(articleRef.current, { childList: true, subtree: true });
            return () => observer.disconnect();
        }
    }, [content, problem, solution]);

    const isEmptyHtml = (html: string | null) => {
        if (!html) return true;
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text.length === 0 && !html.includes('<img') && !html.includes('<iframe');
    };

    const hasProblem = !isEmptyHtml(problem);
    const hasSolution = !isEmptyHtml(solution);
    const hasContent = !isEmptyHtml(content);

    return (
        <PublicLayout>
            <SeoHead 
                title={title} 
                description={excerpt || ''} 
                image={project.thumbnail ? `/storage/${project.thumbnail}` : null}
                seoMeta={project.seo_meta}
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

            <motion.div ref={articleRef} initial="hidden" animate="visible" className="space-y-12 pb-24">
                <div className="grid gap-12 lg:grid-cols-12">
                    
                    {/* LEFT CONTENT: Case Study */}
                    <div className="lg:col-span-8">
                        <div className="space-y-10">
                            {/* Header */}
                            <motion.header variants={reveal} custom={0} className="space-y-6">
                                <Link href="/projects" className={`group inline-flex items-center gap-2 text-xs font-bold transition-all ${dk ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-900'}`}>
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    {t('Back to Projects', 'Kembali ke Proyek')}
                                </Link>
                                
                                {project.tech_stack && project.tech_stack.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {project.tech_stack.map(tech => (
                                            <span key={tech} className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${dk ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                    {title}
                                </h1>

                                <div className={`flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 opacity-50" />
                                        {project.published_at ? new Date(project.published_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long' }) : '---'}
                                    </span>
                                    {project.is_featured && <span className="text-amber-500">★ {t('Featured', 'Unggulan')}</span>}
                                </div>
                            </motion.header>

                            {/* Main Thumbnail */}
                            {project.thumbnail && (
                                <motion.div variants={reveal} custom={1} className="overflow-hidden rounded-[2.5rem] border dark:border-neutral-800">
                                    <img src={`/storage/${project.thumbnail}`} alt={title} className="w-full object-cover" />
                                </motion.div>
                            )}

                            {/* Overview / Excerpt - Redesigned to be more premium */}
                            {excerpt && (
                                <motion.div 
                                    variants={reveal} 
                                    custom={2} 
                                    className={`relative overflow-hidden rounded-[2rem] p-8 sm:p-10 ${dk ? 'bg-neutral-900/40 border border-neutral-800' : 'bg-indigo-50/50 border border-indigo-100'}`}
                                >
                                    {/* Decorative Quote Icon */}
                                    <div className={`absolute -right-4 -top-4 opacity-10 ${dk ? 'text-white' : 'text-indigo-600'}`}>
                                        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C15.4647 8 15.017 8.44772 15.017 9V12C15.017 12.5523 14.5693 13 14.017 13H12.017V9C12.017 6.79086 13.8079 5 16.017 5H19.017C21.2261 5 23.017 6.79086 23.017 9V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16H6.017C6.56928 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56928 8 6.017 8H3.017C2.46472 8 2.017 8.44772 2.017 9V12C2.017 12.5523 1.56928 13 1.017 13H-0.983V9C-0.983 6.79086 0.80786 5 3.017 5H6.017C8.22614 5 10.017 6.79086 10.017 9V15C10.017 18.3137 7.33071 21 4.017 21H1.017Z" />
                                        </svg>
                                    </div>

                                    <div className="relative space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-px w-8 ${dk ? 'bg-indigo-500/50' : 'bg-indigo-300'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                {t('Project Overview', 'Ringkasan Proyek')}
                                            </span>
                                        </div>
                                        <p className={`text-xl font-bold leading-relaxed sm:text-2xl ${dk ? 'text-white' : 'text-neutral-900'}`}>
                                            {excerpt}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* THE CONTENT (Storyline) */}
                            {(hasProblem || hasSolution || hasContent) && (
                                <motion.div variants={reveal} custom={3} className="space-y-16">
                                    {/* Problem */}
                                    {hasProblem && (
                                        <section className="space-y-6">
                                            <h2 className="text-2xl font-black tracking-tight">{t('The Challenge', 'Tantangan')}</h2>
                                            <div className={`prose prose-base max-w-none leading-relaxed sm:prose-lg ${dk ? 'prose-invert text-neutral-300' : 'text-neutral-600'}`} dangerouslySetInnerHTML={{ __html: problem || '' }} />
                                        </section>
                                    )}

                                    {/* Solution */}
                                    {hasSolution && (
                                        <section className="space-y-6">
                                            <h2 className="text-2xl font-black tracking-tight">{t('The Solution', 'Solusi')}</h2>
                                            <div className={`prose prose-base max-w-none leading-relaxed sm:prose-lg ${dk ? 'prose-invert text-neutral-300' : 'text-neutral-600'}`} dangerouslySetInnerHTML={{ __html: solution || '' }} />
                                        </section>
                                    )}

                                    {/* Full Process */}
                                    {hasContent && (
                                        <section className={`space-y-6 ${hasProblem || hasSolution ? 'pt-12 border-t dark:border-neutral-800' : ''}`}>
                                            <h2 className="text-2xl font-black tracking-tight">{t('Detail', 'Detail')}</h2>
                                            <article 
                                                className={`prose prose-base max-w-none leading-relaxed sm:prose-lg
                                                    ${dk ? 'prose-invert' : 'prose-neutral'}
                                                    prose-headings:font-black prose-headings:tracking-tight
                                                    prose-p:text-neutral-700 dark:prose-p:text-neutral-300
                                                    prose-pre:rounded-2xl prose-pre:bg-neutral-900 prose-pre:relative
                                                    prose-img:rounded-3xl
                                                `}
                                                dangerouslySetInnerHTML={{ __html: content || '' }} 
                                            />
                                        </section>
                                    )}
                                </motion.div>
                            )}

                            {/* Gallery */}
                            {project.images && project.images.length > 0 && (
                                <motion.section variants={reveal} custom={4} className="space-y-8 pt-12 border-t dark:border-neutral-800">
                                    <h2 className="text-2xl font-black tracking-tight">{t('Project Gallery', 'Galeri Proyek')}</h2>
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {project.images.map((img, i) => (
                                            <div key={i} className="overflow-hidden rounded-3xl border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                                                <img src={`/storage/${img}`} alt="" className="w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.section>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR: Links & Stats */}
                    <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-8">
                        <motion.div variants={reveal} custom={5} className={`rounded-[2rem] border p-8 space-y-8 ${dk ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-100 bg-white shadow-xl shadow-neutral-500/5'}`}>
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{t('Project Links', 'Tautan Proyek')}</h3>
                                <div className="space-y-3">
                                    {project.demo_url && (
                                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between group rounded-2xl px-6 py-4 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${dk ? 'bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5' : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/20'}`}>
                                            {t('Live Preview', 'Lihat Proyek')} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                        </a>
                                    )}
                                    {project.repo_url && (
                                        <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between rounded-2xl border px-6 py-4 text-sm font-bold transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${dk ? 'border-neutral-700 text-white' : 'border-neutral-200 text-neutral-900'}`}>
                                            Github <Github className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{t('Project Information', 'Informasi Proyek')}</h3>
                                <div className="space-y-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{t('Year', 'Tahun')}</span>
                                        <span className={`text-sm font-bold ${dk ? 'text-white' : 'text-neutral-900'}`}>{project.published_at ? new Date(project.published_at).getFullYear() : '2024'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{t('Tech Stack', 'Teknologi')}</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {project.tech_stack?.map(t => (
                                                <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-bold ${dk ? 'bg-white/5 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </motion.div>

                        {/* Related / Next */}
                        {related && related.length > 0 && (
                            <motion.div variants={reveal} custom={6} className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">{t('Other Projects', 'Proyek Lainnya')}</h3>
                                <div className="space-y-4">
                                    {related.map(r => (
                                        <Link key={r.id} href={`/projects/${r.slug}`} className="flex items-center gap-4 group">
                                            <div className="h-16 w-24 overflow-hidden rounded-xl border dark:border-neutral-800 bg-neutral-100">
                                                {r.thumbnail && <img src={`/storage/${r.thumbnail}`} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />}
                                            </div>
                                            <span className={`text-sm font-bold transition-colors ${dk ? 'text-neutral-400 group-hover:text-white' : 'text-neutral-500 group-hover:text-neutral-900'}`}>
                                                {lang === 'id' ? (r.title_id || r.title_en) : (r.title_en || r.title_id)}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </aside>

                </div>
            </motion.div>
        </PublicLayout>
    );
}
