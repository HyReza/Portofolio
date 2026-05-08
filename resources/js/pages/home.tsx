import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Code2, Newspaper, Wrench, ChevronDown, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { OnboardingScreen } from '@/components/landing/OnboardingScreen';
import { SeoHead } from '@/components/SeoHead';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ImageReveal } from '@/components/animations';

interface Profile { key: string; value_id: string | null; value_en: string | null; }
interface Skill { id: number; name_id: string; name_en: string; description_id: string | null; description_en: string | null; icon: string | null; }
interface SkillCategory { id: number; name_en: string; name_id: string; skills: Skill[]; }
interface Project { id: number; title_id: string; title_en: string; slug: string; thumbnail: string | null; tech_stack: string[] | null; demo_url: string | null; }
interface BlogPost { id: number; title_id: string; title_en: string; slug: string; thumbnail: string | null; published_at: string | null; tags: { id: number; name: string; }[]; }
interface Testimonial { id: number; client_name: string; company: string | null; company_en: string | null; position: string | null; position_en: string | null; relation: string | null; relation_en: string | null; content_id: string; content_en: string | null; image: string | null; }
interface Props { profiles: Record<string, Profile>; skillCategories: SkillCategory[]; projects: Project[]; blogs: BlogPost[]; testimonials: Testimonial[]; }

import { ReactIconRender } from '@/components/ReactIconRender';

/* Brand Style Mapper for Backgrounds (Fallback) */
const getBrandStyle = (name: string, dk: boolean) => {
    const s = name.toLowerCase();

    // Grouped by color/brand
    if (s.includes('html')) return { text: 'text-[#E34F26]', bg: 'bg-[#E34F26]/10', border: 'border-[#E34F26]/20' };
    if (s.includes('css')) return { text: 'text-[#1572B6]', bg: 'bg-[#1572B6]/10', border: 'border-[#1572B6]/20' };
    if (s.includes('javascript') || s.includes('js')) return { text: 'text-[#F7DF1E]', bg: 'bg-[#F7DF1E]/10', border: 'border-[#F7DF1E]/20' };
    if (s.includes('typescript') || s.includes('ts')) return { text: 'text-[#3178C6]', bg: 'bg-[#3178C6]/10', border: 'border-[#3178C6]/20' };
    if (s.includes('react')) return { text: 'text-[#61DAFB]', bg: 'bg-[#61DAFB]/10', border: 'border-[#61DAFB]/20' };
    if (s.includes('next')) return { text: dk ? 'text-white' : 'text-black', bg: dk ? 'bg-white/10' : 'bg-black/5', border: dk ? 'border-white/20' : 'border-black/10' };
    if (s.includes('tailwind')) return { text: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20' };
    if (s.includes('node')) return { text: 'text-[#339933]', bg: 'bg-[#339933]/10', border: 'border-[#339933]/20' };
    if (s.includes('laravel')) return { text: 'text-[#FF2D20]', bg: 'bg-[#FF2D20]/10', border: 'border-[#FF2D20]/20' };
    if (s.includes('php')) return { text: 'text-[#777BB4]', bg: 'bg-[#777BB4]/10', border: 'border-[#777BB4]/20' };
    if (s.includes('python')) return { text: 'text-[#3776AB]', bg: 'bg-[#3776AB]/10', border: 'border-[#3776AB]/20' };
    if (s.includes('java')) return { text: 'text-[#5382A1]', bg: 'bg-[#5382A1]/10', border: 'border-[#5382A1]/20' };
    if (s.includes('go')) return { text: 'text-[#00ADD8]', bg: 'bg-[#00ADD8]/10', border: 'border-[#00ADD8]/20' };
    if (s.includes('mysql')) return { text: 'text-[#4479A1]', bg: 'bg-[#4479A1]/10', border: 'border-[#4479A1]/20' };
    if (s.includes('postgres')) return { text: 'text-[#4169E1]', bg: 'bg-[#4169E1]/10', border: 'border-[#4169E1]/20' };
    if (s.includes('firebase')) return { text: 'text-[#FFCA28]', bg: 'bg-[#FFCA28]/10', border: 'border-[#FFCA28]/20' };
    if (s.includes('docker')) return { text: 'text-[#2496ED]', bg: 'bg-[#2496ED]/10', border: 'border-[#2496ED]/20' };
    if (s.includes('git')) return { text: 'text-[#F05032]', bg: 'bg-[#F05032]/10', border: 'border-[#F05032]/20' };
    if (s.includes('github')) return { text: dk ? 'text-white' : 'text-black', bg: dk ? 'bg-white/10' : 'bg-black/5', border: dk ? 'border-white/20' : 'border-black/10' };
    if (s.includes('figma')) return { text: 'text-[#F24E1E]', bg: 'bg-[#F24E1E]/10', border: 'border-[#F24E1E]/20' };
    if (s.includes('framer motion')) return { text: 'text-[#0055FF]', bg: 'bg-[#0055FF]/10', border: 'border-[#0055FF]/20' };
    if (s.includes('bootstrap')) return { text: 'text-[#7952B3]', bg: 'bg-[#7952B3]/10', border: 'border-[#7952B3]/20' };

    // Dynamic Hash Color for anything not mapped
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);

    return {
        text: `text-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]`,
        bg: `bg-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]/10`,
        border: `border-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]/20`
    };
};

/* TypeWriter — smooth like codebayu */
function TypeWriter({ texts }: { texts: string[] }) {
    const [idx, setIdx] = useState(0); const [text, setText] = useState(''); const [del, setDel] = useState(false);
    useEffect(() => {
        const target = texts[idx]; let timer: ReturnType<typeof setTimeout>;
        if (!del) {
            if (text.length < target.length) timer = setTimeout(() => setText(target.slice(0, text.length + 1)), 50);
            else timer = setTimeout(() => setDel(true), 3000);
        } else {
            if (text.length > 0) timer = setTimeout(() => setText(text.slice(0, -1)), 30);
            else { setDel(false); setIdx((idx + 1) % texts.length); }
        }
        return () => clearTimeout(timer);
    }, [text, del, idx, texts]);
    return <>{text}<span className="animate-pulse">|</span></>;
}

/* Smooth reveal */
const reveal = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } }) };

export default function Home({ profiles, skillCategories, projects, blogs, testimonials }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const pv = (k: string) => lang === 'id' ? (profiles[k]?.value_id || profiles[k]?.value_en || '') : (profiles[k]?.value_en || profiles[k]?.value_id || '');
    const dk = appTheme === 'dark';
    const [onboardingDone, setOnboardingDone] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem('onboarding_done') === '1');
    const [activeSkillFilter, setActiveSkillFilter] = useState('All');

    const cardBase = `rounded-xl border shadow-sm transition-all duration-300 lg:hover:shadow-md ${dk ? 'border-neutral-700' : 'border-neutral-200'}`;

    // Gradient colors for article card placeholders
    const gradients = [
        'from-purple-500 via-pink-500 to-orange-400',
        'from-cyan-500 via-blue-500 to-purple-500',
        'from-emerald-500 via-teal-500 to-cyan-500',
        'from-orange-500 via-red-500 to-pink-500',
    ];

    return (
        <>
            {!onboardingDone && <OnboardingScreen name={pv('name') || 'Reza Edi Saputra'} onComplete={() => setOnboardingDone(true)} />}
            <PublicLayout>
                <SeoHead
                    title={pv('meta_site_title') || pv('name') || 'Portfolio'}
                    description={pv('meta_site_description') || pv('bio') || t('Software Engineer Portfolio', 'Portofolio Software Engineer')}
                    keywords={pv('meta_keywords')}
                    author={pv('meta_author')}
                    url={pv('meta_og_url')}
                    type={pv('meta_og_type')}
                    schemaMarkup={{
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: pv('name') || 'Reza Edi Saputra',
                        jobTitle: pv('title') || 'Software Engineer',
                        description: pv('bio') || '',
                        url: pv('meta_og_url') || (typeof window !== 'undefined' ? window.location.origin : ''),
                        sameAs: [
                            pv('github_url'),
                            pv('linkedin_url'),
                            pv('instagram_url'),
                            pv('twitter_url'),
                        ].filter(Boolean),
                    }}
                />

                {/* ═══ INTRODUCTION ═══ */}
                <motion.section initial="hidden" animate="visible" className="space-y-3">
                    <motion.div variants={reveal} custom={0} className="flex items-center justify-between">
                        <div className="text-2xl font-bold lg:text-3xl">
                            <TypeWriter texts={pv('typewriter_texts') ? pv('typewriter_texts').split('\n').filter(Boolean) : [
                                t(`Hi, I'm ${pv('name') || 'Reza Edi Saputra'}`, `Halo, saya ${pv('name') || 'Reza Edi Saputra'}`),
                                t(`Hi, I'm a ${pv('title') || 'Software Engineer'}`, `Halo, saya ${pv('title') || 'Software Engineer'}`),
                            ]} />
                        </div>
                    </motion.div>
                    <motion.ul variants={reveal} custom={1} className={`ml-5 flex list-disc flex-col gap-1 lg:flex-row lg:gap-8 ${dk ? 'text-neutral-400' : 'text-neutral-700'}`}>
                        {pv('hero_bullets') ? (
                            pv('hero_bullets').split('\n').filter(Boolean).map((bullet: string, i: number) => (
                                <li key={i}>{bullet}</li>
                            ))
                        ) : (
                            <>
                                <li>{t('Remote Worker', 'Pekerja Remote')}</li>
                                <li>{t('Based in Indonesia', 'Berbasis di Indonesia')} 🇮🇩</li>
                            </>
                        )}
                    </motion.ul>
                    <motion.p variants={reveal} custom={2} className={`leading-[1.8] md:leading-loose ${dk ? 'text-neutral-300' : 'text-neutral-800'}`}>
                        {pv('bio') || t('Passionate and seasoned Software Engineer with a strong focus on full-stack development. Proficient in modern web technologies and dedicated to delivering efficient, scalable, and visually appealing web applications.', 'Software Engineer yang passionate dengan fokus pada full-stack development. Mahir dalam teknologi web modern dan berdedikasi menghasilkan aplikasi web yang efisien, scalable, dan menarik.')}
                    </motion.p>
                    <motion.div variants={reveal} custom={3} className="flex flex-wrap items-center gap-3 pt-2">
                        <Dialog>
                            <DialogTrigger className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${dk ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'}`}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                {t('Download CV', 'Unduh CV')}
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white dark:bg-[#121212] border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold font-sora">{t('Download CV', 'Unduh CV')}</DialogTitle>
                                    <DialogDescription className="text-neutral-500 dark:text-neutral-400 mt-1">
                                        {t('Please select the language version you prefer.', 'Silakan pilih versi bahasa yang Anda inginkan.')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                                    <a href="/cv/en" target="_blank" rel="noopener" className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all group">
                                        <span className="text-4xl mb-3 transition-transform group-hover:scale-110">🇺🇸</span>
                                        <span className="font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">English</span>
                                        <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">International</span>
                                    </a>
                                    <a href="/cv/id" target="_blank" rel="noopener" className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all group">
                                        <span className="text-4xl mb-3 transition-transform group-hover:scale-110">🇮🇩</span>
                                        <span className="font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Indonesia</span>
                                        <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Bahasa</span>
                                    </a>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </motion.div>
                </motion.section>

                <hr className={`my-8 ${dk ? 'border-neutral-800' : 'border-neutral-200'}`} />



                {/* ═══ SKILLS (Satria Bahari Style) ═══ */}
                {skillCategories.length > 0 && <>
                    <section>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xl font-bold">
                                <Wrench className="h-5 w-5 text-amber-500" />
                                <h2>{t('Professional Skills', 'Keahlian Profesional')}</h2>
                            </div>
                            <p className={`text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{t('My technical stack and tools.', 'Teknologi dan alat yang saya gunakan.')}</p>
                        </div>

                        {/* Category Filters (Pill Style) */}
                        <div className="mt-8 flex flex-wrap gap-2.5">
                            <button
                                onClick={() => setActiveSkillFilter('All')}
                                className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeSkillFilter === 'All' ? (dk ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20') : (dk ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}`}
                            >
                                {t('All', 'Semua')}
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] ${activeSkillFilter === 'All' ? 'bg-black/10' : (dk ? 'bg-neutral-900' : 'bg-white')}`}>
                                    {skillCategories.reduce((acc, cat) => acc + cat.skills.length, 0)}
                                </span>
                            </button>
                            {skillCategories.map(cat => {
                                const catName = lang === 'id' ? (cat.name_id || cat.name_en) : cat.name_en;
                                const isActive = activeSkillFilter === catName;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveSkillFilter(catName)}
                                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? (dk ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20') : (dk ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}`}
                                    >
                                        {catName}
                                        <span className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[9px] ${isActive ? 'bg-black/10' : (dk ? 'bg-neutral-900' : 'bg-white')}`}>
                                            {cat.skills.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Skill Grid (Satria Bahari Icons Style) */}
                        <motion.div layout className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            <AnimatePresence mode="popLayout">
                                {skillCategories
                                    .filter(cat => activeSkillFilter === 'All' || (lang === 'id' ? (cat.name_id || cat.name_en) : cat.name_en) === activeSkillFilter)
                                    .flatMap(cat => cat.skills)
                                    .map((skill, index) => {
                                        const skillName = lang === 'id' ? (skill.name_id || skill.name_en) : (skill.name_en || skill.name_id);
                                        const skillDesc = lang === 'id' ? (skill.description_id || skill.description_en) : (skill.description_en || skill.description_id);
                                        const style = getBrandStyle(skillName, dk);

                                        const card = (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.03 }}
                                                key={skill.id}
                                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                                className={`group flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300 ${dk ? 'bg-neutral-900/50 hover:bg-neutral-800/80' : 'bg-white hover:bg-neutral-50 shadow-sm hover:shadow-md'} ${style.border} ${skillDesc ? 'shadow-[0_0_15px_rgba(0,0,0,0.05)] ' + (dk ? 'hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'hover:border-indigo-400/50 hover:shadow-indigo-400/10') : ''}`}
                                            >
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${style.bg} ${style.text}`}>
                                                    {skill.icon ? (
                                                        <ReactIconRender name={skill.icon} className="h-6 w-6" />
                                                    ) : (
                                                        <Code2 className="h-6 w-6 opacity-50" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`truncate text-xs font-bold tracking-tight ${dk ? 'text-neutral-200' : 'text-neutral-800'}`}>{skillName}</p>
                                                    <p className={`text-[10px] font-medium text-neutral-500`}>{t('Advanced', 'Lanjut')}</p>
                                                </div>
                                            </motion.div>
                                        );

                                        if (skillDesc) {
                                            return (
                                                <Tooltip.Provider key={skill.id} delayDuration={100}>
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            {card}
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Portal>
                                                            <Tooltip.Content
                                                                sideOffset={5}
                                                                className={`z-50 max-w-xs rounded-xl border p-3 text-xs leading-relaxed shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-200 ${dk ? 'border-neutral-700/50 bg-neutral-900/90 text-neutral-200' : 'border-neutral-200/50 bg-white/90 text-neutral-700'}`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1.5 font-bold">
                                                                    <div className={`flex h-5 w-5 items-center justify-center rounded-md ${style.bg} ${style.text}`}>
                                                                        {skill.icon && <ReactIconRender name={skill.icon} className="h-3 w-3" />}
                                                                    </div>
                                                                    {skillName}
                                                                </div>
                                                                <p className="opacity-90">{skillDesc}</p>
                                                                <Tooltip.Arrow className={dk ? 'fill-neutral-900/90' : 'fill-white/90'} />
                                                            </Tooltip.Content>
                                                        </Tooltip.Portal>
                                                    </Tooltip.Root>
                                                </Tooltip.Provider>
                                            );
                                        }

                                        return card;
                                    })}
                            </AnimatePresence>
                        </motion.div>
                    </section>
                    <hr className={`my-12 ${dk ? 'border-neutral-800' : 'border-neutral-200'}`} />
                </>}

                {/* ═══ TESTIMONIALS SUMMARY ═══ */}
                {testimonials.length > 0 && <>
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-xl font-bold"><MessageSquare className="h-5 w-5" /> {t('Client Feedback', 'Umpan Balik Klien')}</h2>
                            <Link href="/testimonials" className={`flex items-center gap-1 text-sm transition-colors ${dk ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                {t('View All', 'Lihat Semua')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {testimonials.slice(0, 3).map((testi, i) => (
                                <motion.div key={testi.id} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}>
                                    <div className={`group relative flex h-full flex-col gap-4 overflow-hidden p-5 ${cardBase} ${dk ? 'bg-transparent hover:bg-white/[0.02]' : 'bg-white hover:bg-neutral-50'}`}>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border ${dk ? 'border-neutral-800 bg-neutral-800 text-neutral-300' : 'border-neutral-200 bg-neutral-100 text-neutral-600'}`}>
                                                {testi.image ? (
                                                    <img src={`/storage/${testi.image}`} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <span className="text-lg font-black">{testi.client_name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className={`truncate font-bold text-base leading-tight transition-colors ${dk ? 'text-neutral-200 group-hover:text-indigo-400' : 'text-neutral-800 group-hover:text-indigo-600'}`}>
                                                    {testi.client_name}
                                                </h3>
                                                <p className={`truncate text-xs mt-0.5 ${dk ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                                    {[lang === 'id' ? testi.position : (testi.position_en || testi.position), lang === 'id' ? testi.company : (testi.company_en || testi.company)].filter(Boolean).join(' at ')}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`relative z-10 text-sm italic leading-relaxed line-clamp-4 ${dk ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                            "{lang === 'id' ? (testi.content_id || testi.content_en) : (testi.content_en || testi.content_id)}"
                                        </p>
                                        <MessageSquare className={`absolute right-4 top-4 h-12 w-12 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-10 group-hover:-rotate-12 ${dk ? 'text-white' : 'text-indigo-900'}`} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                    <hr className={`my-12 ${dk ? 'border-neutral-800' : 'border-neutral-200'}`} />
                </>}

                {/* ═══ PROJECTS ═══ */}
                {projects.length > 0 && <>
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-xl font-bold"><Code2 className="h-5 w-5" /> {t('Projects', 'Proyek')}</h2>
                            <Link href="/projects" className={`flex items-center gap-1 text-sm transition-colors ${dk ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                {t('View All', 'Lihat Semua')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((p, i) => (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}>
                                    <Link href={`/projects/${p.slug}`}
                                        className={`group block overflow-hidden p-4 md:p-6 ${cardBase} ${dk ? 'bg-transparent' : 'bg-white'}`}>
                                        <div className={`mb-4 aspect-video overflow-hidden rounded-lg ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                            {p.thumbnail ? <ImageReveal src={`/storage/${p.thumbnail}`} alt={p.title_en || ''} className="h-full w-full" /> :
                                                <div className={`flex h-full items-center justify-center bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                                                    <span className="text-5xl font-black text-white/20">{(p.title_en || p.title_id).charAt(0)}</span>
                                                </div>}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`rounded-lg border bg-opacity-40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${dk ? 'border-teal-700 bg-teal-900 text-teal-200' : 'border-neutral-200 bg-neutral-100 text-neutral-500'}`}>
                                                {t('Project', 'Proyek')}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <h3 className={`text-xl font-bold transition-colors ${dk ? 'group-hover:text-indigo-400' : 'group-hover:text-indigo-600'}`}>
                                                {lang === 'id' ? (p.title_id || p.title_en) : (p.title_en || p.title_id)}
                                            </h3>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1.5">
                                                {p.tech_stack?.slice(0, 3)?.map(tech => <span key={tech} className={`rounded-md px-2 py-1 text-[10px] font-medium ${dk ? 'bg-white/5 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>{tech}</span>)}
                                            </div>
                                            <span className={`text-xs font-bold ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                {t('View Detail', 'Lihat Detail')} &rarr;
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                    <hr className={`my-12 ${dk ? 'border-neutral-800' : 'border-neutral-200'}`} />
                </>}

                {/* ═══ LATEST ARTICLES ═══ */}
                {blogs.length > 0 && <>
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-xl font-bold"><Newspaper className="h-5 w-5" /> {t('Latest Articles', 'Artikel Terbaru')}</h2>
                            <Link href="/blog" className={`flex items-center gap-1 text-sm transition-colors ${dk ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                {t('View All', 'Lihat Semua')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <p className={`-mt-2 text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{t('Latest articles from blog', 'Artikel terbaru dari blog')}</p>

                        {/* Horizontal scroll on mobile, grid on desktop */}
                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
                            {blogs.map((b, i) => (
                                <motion.div key={b.id} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                    className="min-w-[220px] sm:min-w-0">
                                    <Link href={`/blog/${b.slug}`} className={`group block overflow-hidden ${cardBase} ${dk ? 'bg-transparent' : 'bg-white'}`}>
                                        <div className="aspect-[16/10] overflow-hidden">
                                            {b.thumbnail ? (
                                                <img src={`/storage/${b.thumbnail}`} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                                                    <span className="text-4xl font-black text-white/30">{(b.title_en || b.title_id).charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className={`text-base font-bold line-clamp-2 ${dk ? 'text-neutral-200 group-hover:text-indigo-400' : 'text-neutral-800 group-hover:text-indigo-600'} transition-colors`}>{lang === 'id' ? (b.title_id || b.title_en) : (b.title_en || b.title_id)}</h3>
                                            {(b.excerpt_en || b.excerpt_id) && <p className={`mt-2 line-clamp-2 text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{lang === 'id' ? (b.excerpt_id || b.excerpt_en) : (b.excerpt_en || b.excerpt_id)}</p>}
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className={`text-xs font-medium uppercase tracking-wider ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                    {b.published_at ? new Date(b.published_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                </p>
                                                <span className={`text-xs font-bold ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>Read &rarr;</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </>}
            </PublicLayout>
        </>
    );
}
