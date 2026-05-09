import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { SeoHead } from '@/components/SeoHead';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Github, Search, Filter } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp, ImageReveal, MagneticButton } from '@/components/animations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Project { id: number; title_id: string; title_en: string; slug: string; thumbnail: string | null; problem_en: string | null; problem_id: string | null; solution_en: string | null; solution_id: string | null; excerpt_en: string | null; excerpt_id: string | null; tech_stack: string[] | null; demo_url: string | null; repo_url: string | null; }

export default function Projects({ projects }: { projects: Project[] }) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    /* Helper to strip HTML and truncate */
    const truncate = (html: string | null, limit: number = 120) => {
        if (!html) return '';
        const text = html.replace(/<[^>]*>?/gm, '');
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTech, setSelectedTech] = useState<string>('All');

    // Extract unique tech stacks
    const allTechs = useMemo(() => {
        const techSet = new Set<string>();
        projects.forEach(project => {
            if (project.tech_stack) {
                project.tech_stack.forEach(tech => techSet.add(tech));
            }
        });
        return ['All', ...Array.from(techSet).sort()];
    }, [projects]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const title = (lang === 'id' ? (project.title_id || project.title_en) : (project.title_en || project.title_id)).toLowerCase();
            const prob = ((lang === 'id' ? project.problem_id : project.problem_en) || '').toLowerCase();
            const sol = ((lang === 'id' ? project.solution_id : project.solution_en) || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesSearch = title.includes(query) || prob.includes(query) || sol.includes(query);
            
            const matchesTech = selectedTech === 'All' || (project.tech_stack && project.tech_stack.includes(selectedTech));

            return matchesSearch && matchesTech;
        });
    }, [projects, searchQuery, selectedTech, lang]);

    return (
        <PublicLayout>
            <SeoHead 
                title={t('Projects', 'Proyek')} 
                description={t('My portfolio of software engineering projects, applications, and experiments.', 'Portofolio proyek software engineering, aplikasi, dan eksperimen saya.')}
            />
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <FadeUp><p className={`text-xs font-bold uppercase tracking-[0.25em] ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>Portfolio</p></FadeUp>
                    <TextReveal className="mt-3 text-4xl font-black sm:text-5xl">{t('All Projects', 'Semua Proyek')}</TextReveal>

                    {/* Search & Filter Section */}
                    {projects.length > 0 && (
                        <FadeUp delay={0.4} className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
                            <div className="relative w-full max-w-md">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${dk ? 'text-white/30' : 'text-gray-400'}`} />
                                <input 
                                    type="text" 
                                    placeholder={t('Search projects...', 'Cari proyek...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full rounded-2xl pl-12 pr-4 py-3 outline-none transition-all ${dk ? 'bg-white/5 focus:bg-white/10 text-white placeholder:text-white/30 border border-white/5 focus:border-indigo-500/30' : 'bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm'}`}
                                />
                            </div>
                            
                            {/* Tech Stack Dropdown Filter */}
                            <div className="w-full sm:w-48 shrink-0">
                                <Select value={selectedTech} onValueChange={setSelectedTech}>
                                    <SelectTrigger className={`w-full rounded-2xl h-[46px] border px-4 transition-all ${dk ? 'bg-white/5 border-white/5 text-white focus:ring-indigo-500/30 hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-900 focus:ring-indigo-500 hover:bg-gray-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Filter className="w-4 h-4 opacity-50" />
                                            <SelectValue placeholder="Filter Tech" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className={`rounded-xl border ${dk ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
                                        {allTechs.map(tech => (
                                            <SelectItem key={tech} value={tech} className="rounded-lg cursor-pointer">
                                                {tech === 'All' ? t('All Tech Stack', 'Semua Teknologi') : tech}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </FadeUp>
                    )}

                    {filteredProjects.length === 0 ? (
                        <FadeUp delay={0.5}>
                            <div className={`mt-20 flex flex-col items-center justify-center rounded-3xl p-12 text-center ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                                    className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600 shadow-inner'}`}
                                >
                                    <motion.div
                                        animate={{ 
                                            y: [0, -10, 0],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Search className="h-14 w-14 opacity-40" />
                                    </motion.div>
                                </motion.div>
                                <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{t('No projects found', 'Tidak ada proyek yang ditemukan')}</h3>
                                <p className={`mt-2 max-w-sm text-sm ${dk ? 'text-white/40' : 'text-gray-500'}`}>
                                    {t("We couldn't find any projects matching your search criteria. Try adjusting your filters.", "Kami tidak dapat menemukan proyek yang cocok dengan pencarian Anda. Coba sesuaikan filter Anda.")}
                                </p>
                                {(searchQuery || selectedTech !== 'All') && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setSelectedTech('All'); }}
                                        className={`mt-6 rounded-full px-6 py-2.5 text-sm font-medium transition-all ${dk ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                                    >
                                        {t('Clear Filters', 'Hapus Filter')}
                                    </button>
                                )}
                            </div>
                        </FadeUp>
                    ) : (
                        <div className="mt-20 space-y-32">
                            {filteredProjects.map((p, i) => (
                                <div key={p.id} className={`grid items-start gap-12 lg:grid-cols-2 ${i % 2 !== 0 ? 'lg:[direction:rtl]' : ''}`}>
                                    <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.25,0.4,0.25,1] }}>
                                        <div className={`overflow-hidden rounded-3xl lg:[direction:ltr] ${dk ? 'bg-white/[0.03]' : 'bg-white shadow-xl'}`}>
                                            {p.thumbnail ? <ImageReveal src={`/storage/${p.thumbnail}`} alt={p.title_en || ''} className="aspect-video" /> :
                                            <div className="flex aspect-video items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))' }}><span className="text-8xl font-black opacity-5">{(p.title_en || p.title_id).charAt(0)}</span></div>}
                                        </div>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? 60 : -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.25,0.4,0.25,1] }}
                                        className="lg:[direction:ltr]">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>{t('Project', 'Proyek')} {String(i + 1).padStart(2, '0')}</span>
                                        <Link href={`/projects/${p.slug}`}>
                                            <h2 className="mt-2 text-2xl font-black sm:text-3xl hover:text-indigo-500 transition-colors cursor-pointer">{lang === 'id' ? (p.title_id || p.title_en) : (p.title_en || p.title_id)}</h2>
                                        </Link>
                                        
                                        {/* Simplified Project Info */}
                                        <div className="mt-6 space-y-4">
                                            {(p.excerpt_en || p.excerpt_id || p.problem_en || p.problem_id) && (
                                                <p className={`line-clamp-3 text-sm leading-relaxed ${dk ? 'text-neutral-400' : 'text-gray-600'}`}>
                                                    {truncate(lang === 'id' ? (p.excerpt_id || p.problem_id) : (p.excerpt_en || p.problem_en), 200)}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {p.tech_stack?.map((t2, j) => (
                                                    <span key={j} className={`rounded-xl border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${dk ? 'border-white/5 bg-white/5 text-neutral-500' : 'border-neutral-100 bg-neutral-50 text-neutral-400'}`}>
                                                        {t2}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-10 flex flex-wrap items-center gap-4">
                                            <Link href={`/projects/${p.slug}`}>
                                                <button className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-all hover:scale-105 active:scale-95 ${dk ? 'bg-white text-black hover:bg-neutral-200' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10'}`}>
                                                    {t('Read More', 'Lihat Selengkapnya')} <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </Link>
                                            
                                            <div className="flex items-center gap-3">
                                                {p.demo_url && (
                                                    <a href={p.demo_url} target="_blank" rel="noopener" 
                                                       className={`group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-6 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20`}
                                                       style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                                        {t('Live Link', 'Link Proyek')} <ArrowUpRight className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {p.repo_url && (
                                                    <a href={p.repo_url} target="_blank" rel="noopener" 
                                                       className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-90 ${dk ? 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm'}`}
                                                       title="Source Code">
                                                        <Github className="h-5 w-5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
