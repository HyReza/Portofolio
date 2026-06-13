import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { SeoHead } from '@/components/SeoHead';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Github, Search } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp, ImageReveal, MagneticButton } from '@/components/animations';
import { SearchableFilter } from '@/components/ui/searchable-filter';

interface ProjectType { id: number; name_id: string; name_en: string | null; slug: string; }
interface ProjectCategory { id: number; name_id: string; name_en: string | null; slug: string; }

interface Project { id: number; title_id: string; title_en: string; slug: string; thumbnail: string | null; problem_en: string | null; problem_id: string | null; solution_en: string | null; solution_id: string | null; excerpt_en: string | null; excerpt_id: string | null; tech_stack: string[] | null; demo_url: string | null; repo_url: string | null; types?: ProjectType[]; categories?: ProjectCategory[]; }

export default function Projects({ projects, allTypes, allCategories }: { projects: Project[], allTypes?: ProjectType[], allCategories?: ProjectCategory[] }) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const pv = (idStr: string | null | undefined, enStr: string | null | undefined) => lang === 'id' ? (idStr || enStr || '') : (enStr || idStr || '');

    /* Helper to strip HTML and truncate */
    const truncate = (html: string | null, limit: number = 120) => {
        if (!html) return '';
        const text = html.replace(/<[^>]*>?/gm, '');
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTech, setSelectedTech] = useState<string>('All');
    const [selectedType, setSelectedType] = useState<string>('All');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

    const projectTypes = useMemo(() => {
        const types = new Set<string>();
        if (allTypes && allTypes.length > 0) {
            allTypes.forEach(t => { const n = pv(t.name_id, t.name_en); if (n) types.add(n); });
        } else {
            projects.forEach(p => {
                if (p.types) p.types.forEach(t => { const n = pv(t.name_id, t.name_en); if (n) types.add(n); });
            });
        }
        return ['All', ...Array.from(types).sort()];
    }, [projects, allTypes, lang]);

    const projectCategories = useMemo(() => {
        const cats = new Set<string>();
        if (allCategories && allCategories.length > 0) {
            allCategories.forEach(c => { const n = pv(c.name_id, c.name_en); if (n) cats.add(n); });
        } else {
            projects.forEach(p => {
                if (p.categories) p.categories.forEach(c => { const n = pv(c.name_id, c.name_en); if (n) cats.add(n); });
            });
        }
        return ['All', ...Array.from(cats).sort()];
    }, [projects, allCategories, lang]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const title = (lang === 'id' ? (project.title_id || project.title_en) : (project.title_en || project.title_id)).toLowerCase();
            const prob = ((lang === 'id' ? project.problem_id : project.problem_en) || '').toLowerCase();
            const sol = ((lang === 'id' ? project.solution_id : project.solution_en) || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesSearch = title.includes(query) || prob.includes(query) || sol.includes(query);
            const pTypes = project.types ? project.types.map(t => pv(t.name_id, t.name_en)) : [];
            const pCats = project.categories ? project.categories.map(c => pv(c.name_id, c.name_en)) : [];

            const matchesTech = selectedTech === 'All' || (project.tech_stack && project.tech_stack.includes(selectedTech));
            const matchesType = selectedType === 'All' || pTypes.includes(selectedType);
            const matchesCat = selectedCategory === 'All' || pCats.includes(selectedCategory);

            return matchesSearch && matchesTech && matchesType && matchesCat;
        });
    }, [projects, searchQuery, selectedTech, selectedType, selectedCategory, lang]);

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
                        <FadeUp delay={0.4} className="mt-12 space-y-6">
                            {/* Search Bar - Full Width */}
                            <div className="relative w-full max-w-2xl">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${dk ? 'text-white/30' : 'text-gray-400'}`} />
                                <input 
                                    type="text" 
                                    placeholder={t('Search projects...', 'Cari proyek...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-base sm:text-lg ${dk ? 'bg-white/5 focus:bg-white/10 text-white placeholder:text-white/30 border border-white/5 focus:border-indigo-500/30' : 'bg-white focus:bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm'}`}
                                />
                            </div>
                            
                            {/* Filters Row */}
                            <div className="flex flex-wrap items-center gap-3 w-full">
                                {/* Type Filter */}
                                <div className="w-full sm:w-auto min-w-[180px]">
                                    <SearchableFilter
                                        value={selectedType}
                                        onValueChange={setSelectedType}
                                        items={projectTypes}
                                        allLabel={t('All Types', 'Semua Tipe')}
                                        searchPlaceholder={t('Search type...', 'Cari tipe...')}
                                        dark={dk}
                                    />
                                </div>

                                {/* Category Filter */}
                                <div className="w-full sm:w-auto min-w-[180px]">
                                    <SearchableFilter
                                        value={selectedCategory}
                                        onValueChange={setSelectedCategory}
                                        items={projectCategories}
                                        allLabel={t('All Categories', 'Semua Kategori')}
                                        searchPlaceholder={t('Search category...', 'Cari kategori...')}
                                        dark={dk}
                                    />
                                </div>

                                {/* Tech Stack Filter */}
                                <div className="w-full sm:w-auto min-w-[180px]">
                                    <SearchableFilter
                                        value={selectedTech}
                                        onValueChange={setSelectedTech}
                                        items={allTechs}
                                        allLabel={t('All Tech Stack', 'Semua Teknologi')}
                                        searchPlaceholder={t('Search tech...', 'Cari teknologi...')}
                                        dark={dk}
                                    />
                                </div>
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
                                {(searchQuery || selectedTech !== 'All' || selectedType !== 'All' || selectedCategory !== 'All') && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setSelectedTech('All'); setSelectedType('All'); setSelectedCategory('All'); }}
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
                                        <div className={`overflow-hidden rounded-3xl lg:[direction:ltr] aspect-video relative ${dk ? 'bg-white/[0.03]' : 'bg-white shadow-xl'}`}>
                                            {p.thumbnail ? <ImageReveal src={`/storage/${p.thumbnail}`} alt={p.title_en || ''} className="absolute inset-0 h-full w-full" /> :
                                            <div className="flex absolute inset-0 h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))' }}><span className="text-8xl font-black opacity-5">{(p.title_en || p.title_id).charAt(0)}</span></div>}
                                        </div>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? 60 : -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.25,0.4,0.25,1] }}
                                        className="lg:[direction:ltr]">
                                        
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {p.types && p.types.length > 0 && p.types.map(t2 => (
                                                <span key={t2.id} className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${dk ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {pv(t2.name_id, t2.name_en)}
                                                </span>
                                            ))}
                                            {p.categories && p.categories.length > 0 && p.categories.map(c => (
                                                <span key={c.id} className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${dk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {pv(c.name_id, c.name_en)}
                                                </span>
                                            ))}
                                        </div>

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
