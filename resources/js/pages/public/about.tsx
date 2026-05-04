import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp, FadeLeft, FadeRight, ScaleIn, StaggerChildren, StaggerItem, Parallax } from '@/components/animations';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Profile { key: string; value_id: string | null; value_en: string | null; }
interface Education { id: number; institution: string; degree: string | null; field: string | null; start_date: string; end_date: string | null; description_id: string | null; description_en: string | null; type: string; }
interface Career { id: number; company: string; position_id: string | null; position_en: string | null; start_date: string; end_date: string | null; description_en: string | null; description_id: string | null; is_current: boolean; children: Career[]; }
interface Skill { id: number; name_id: string; name_en: string; icon: string | null; description_id?: string | null; description_en?: string | null; }
interface SkillCategory { id: number; name_en: string; name_id: string; skills: Skill[]; }
interface Achievement { id: number; title_en: string; title_id: string; description_en: string | null; description_id: string | null; date: string | null; type: string; }
interface Organization { id: number; name: string; role: string; start_date: string; end_date: string | null; description_id: string | null; description_en: string | null; is_current: boolean; }
interface Props { profiles: Record<string, Profile>; educations: Education[]; careers: Career[]; skillCategories: SkillCategory[]; achievements: Achievement[]; organizations: Organization[]; }
import { ReactIconRender } from '@/components/ReactIconRender';

const getBrandStyle = (name: string, dk: boolean) => {
    const s = name.toLowerCase();
    if (s.includes('html') || s.includes('laravel')) return { text: 'text-orange-500', pillBg: dk ? 'bg-orange-500/10' : 'bg-orange-50', border: dk ? 'border-orange-500/20' : 'border-orange-200' };
    if (s.includes('css') || s.includes('react') || s.includes('tailwind') || s.includes('go')) return { text: 'text-blue-500', pillBg: dk ? 'bg-blue-500/10' : 'bg-blue-50', border: dk ? 'border-blue-500/20' : 'border-blue-200' };
    if (s.includes('js') || s.includes('javascript') || s.includes('python')) return { text: 'text-yellow-500', pillBg: dk ? 'bg-yellow-500/10' : 'bg-yellow-50', border: dk ? 'border-yellow-500/20' : 'border-yellow-200' };
    if (s.includes('ts') || s.includes('typescript') || s.includes('problem') || s.includes('komunikasi')) return { text: 'text-blue-600', pillBg: dk ? 'bg-blue-600/10' : 'bg-blue-100', border: dk ? 'border-blue-600/20' : 'border-blue-300' };
    if (s.includes('node') || s.includes('vue')) return { text: 'text-green-500', pillBg: dk ? 'bg-green-500/10' : 'bg-green-50', border: dk ? 'border-green-500/20' : 'border-green-200' };
    if (s.includes('php') || s.includes('bootstrap')) return { text: 'text-indigo-500', pillBg: dk ? 'bg-indigo-500/10' : 'bg-indigo-50', border: dk ? 'border-indigo-500/20' : 'border-indigo-200' };
    if (s.includes('docker') || s.includes('mysql') || s.includes('postgres') || s.includes('sql')) return { text: 'text-sky-500', pillBg: dk ? 'bg-sky-500/10' : 'bg-sky-50', border: dk ? 'border-sky-500/20' : 'border-sky-200' };
    if (s.includes('git') || s.includes('github') || s.includes('next') || s.includes('bun')) return { text: dk ? 'text-white' : 'text-black', pillBg: dk ? 'bg-white/10' : 'bg-black/5', border: dk ? 'border-white/20' : 'border-gray-200' };

    // Dynamic Hash Color for anything not mapped
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);

    return {
        text: `text-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]`,
        pillBg: `bg-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]/10`,
        border: `border-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]/20`
    };
};

export default function About({ profiles, educations, careers, skillCategories, achievements, organizations }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const pv = (key: string) => lang === 'id' ? (profiles[key]?.value_id || profiles[key]?.value_en || '') : (profiles[key]?.value_en || profiles[key]?.value_id || '');
    const dk = appTheme === 'dark';

    // Generate JSON-LD Schema for Skills
    const skillsSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Skills & Expertise",
        "description": "Technical and non-technical professional skills.",
        "itemListElement": skillCategories.flatMap((cat, cIdx) =>
            cat.skills.map((s, sIdx) => ({
                "@type": "ListItem",
                "position": cIdx * 100 + sIdx + 1,
                "item": {
                    "@type": "DefinedTerm",
                    "name": s.name_en || s.name_id,
                    "inDefinedTermSet": cat.name_en || cat.name_id
                }
            }))
        )
    };

    return (
        <PublicLayout>
            <Head>
                <title>{t('About', 'Tentang')}</title>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(skillsSchema) }} />
            </Head>

            {/* Hero */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <div className="grid gap-16 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <FadeUp><p className={`text-xs font-bold uppercase tracking-[0.25em] ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>{t('About Me', 'Tentang Saya')}</p></FadeUp>
                            <TextReveal className="mt-3 text-4xl font-black leading-tight sm:text-5xl" delay={0.2}>{t('The person behind the pixels.', 'Orang di balik piksel.')}</TextReveal>
                            <FadeUp delay={0.6}><p className={`mt-8 text-lg leading-relaxed ${dk ? 'text-white/40' : 'text-gray-500'}`}>{pv('bio') || t('Passionate developer.', 'Developer passionate.')}</p></FadeUp>
                            <FadeUp delay={0.8}>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Dialog>
                                        <DialogTrigger className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${dk ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'} shadow-lg shadow-indigo-600/20`}>
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
                                </div>
                            </FadeUp>
                        </div>
                        <FadeLeft delay={0.4}>
                            <div className={`rounded-3xl p-8 lg:col-span-2 ${dk ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>{t('Quick Stats', 'Statistik')}</p>
                                {[{ v: educations.length, l: t('Degrees', 'Gelar') }, { v: careers.length, l: t('Positions', 'Posisi') }, { v: achievements.length, l: t('Awards', 'Penghargaan') }].map((s, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1 }} className="mt-4">
                                        <span className="text-3xl font-black bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>{s.v}</span>
                                        <span className={`ml-2 text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>{s.l}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </FadeLeft>
                    </div>
                </div>
            </section>

            {/* Skills */}
            <section className={`py-20 ${dk ? 'bg-white/[0.01]' : 'bg-gray-50/50'}`}>
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <FadeUp><h2 className="text-3xl font-black">{t('Skills & Tools', 'Keahlian')}</h2></FadeUp>
                    <StaggerChildren className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
                        {skillCategories.map((cat) => (
                            <StaggerItem key={cat.id}>
                                <motion.div whileHover={{ y: -5 }} className={`rounded-3xl p-7 transition-all ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/20' : 'bg-white border border-gray-100 hover:shadow-xl'}`}>
                                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-indigo-400">{lang === 'id' ? (cat.name_id || cat.name_en) : cat.name_en}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {cat.skills.map(s => {
                                            const sName = lang === 'id' ? (s.name_id || s.name_en) : (s.name_en || s.name_id);
                                            const style = getBrandStyle(sName, dk);

                                            return (
                                                <div key={s.id} className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${style.pillBg} ${style.border} ${style.text}`}>
                                                    <span className={`font-bold opacity-80 transition-opacity group-hover:opacity-100`}>
                                                        {s.icon ? (
                                                            <ReactIconRender name={s.icon} className="h-4 w-4" />
                                                        ) : (
                                                            <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-current/20 text-[9px]`}>
                                                                {sName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </span>
                                                    {sName}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerChildren>
                </div>
            </section>

            {/* Education */}
            <section className="py-20">
                <div className="mx-auto max-w-5xl px-5 sm:px-8">
                    <FadeUp><h2 className="text-3xl font-black">{t('Education', 'Pendidikan')}</h2></FadeUp>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        {educations.map((edu, i) => (
                            <motion.div key={edu.id} initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                                whileHover={{ y: -4 }}
                                className={`rounded-3xl p-7 ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/15' : 'bg-white border border-gray-100 hover:shadow-xl'}`}>
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{new Date(edu.start_date).getFullYear()}–{edu.end_date ? new Date(edu.end_date).getFullYear() : t('Now', 'Kini')}</p>
                                <h3 className="mt-2 text-lg font-bold">{edu.institution}</h3>
                                <p className={`mt-1 text-sm ${dk ? 'text-white/40' : 'text-gray-500'}`}>{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</p>
                                {(lang === 'id' ? edu.description_id : edu.description_en) && <p className={`mt-3 text-sm leading-relaxed ${dk ? 'text-white/35' : 'text-gray-400'}`}>{lang === 'id' ? (edu.description_id || edu.description_en) : (edu.description_en || edu.description_id)}</p>}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Career */}
            <section className={`py-20 ${dk ? 'bg-white/[0.01]' : 'bg-gray-50/50'}`}>
                <div className="mx-auto max-w-4xl px-5 sm:px-8">
                    <FadeUp><h2 className="text-3xl font-black">{t('Career', 'Karir')}</h2></FadeUp>
                    <div className="relative mt-10">
                        <div className={`absolute left-5 top-0 h-full w-0.5 rounded-full sm:left-8 ${dk ? 'bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent' : 'bg-gradient-to-b from-indigo-200 via-purple-100 to-transparent'}`} />
                        {careers.map((c, i) => {
                            const pos = lang === 'id' ? (c.position_id || c.position_en) : (c.position_en || c.position_id);
                            const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' });
                            return (
                                <FadeRight key={c.id} delay={i * 0.15}>
                                    <div className="group relative mb-12 pl-14 sm:pl-20">
                                        <motion.div whileHover={{ scale: 1.5 }}
                                            className={`absolute left-3 top-2 h-4 w-4 rounded-full border-[3px] sm:left-6 ${dk ? 'border-indigo-400 bg-[#050816]' : 'border-indigo-400 bg-white'}`}
                                            style={{ boxShadow: '0 0 15px rgba(99,102,241,0.4)' }} />
                                        <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.3 }}
                                            className={`rounded-3xl p-6 ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                            <div className="flex flex-wrap items-baseline gap-x-3"><h3 className="text-lg font-bold">{pos}</h3><span className="text-sm font-medium text-indigo-400">@ {c.company}</span></div>
                                            <p className={`mt-1 text-xs ${dk ? 'text-white/20' : 'text-gray-300'}`}>{fmtDate(c.start_date)} → {c.end_date ? fmtDate(c.end_date) : t('Present', 'Sekarang')}</p>
                                            {(lang === 'id' ? c.description_id : c.description_en) && <p className={`mt-3 text-sm leading-relaxed ${dk ? 'text-white/35' : 'text-gray-400'}`}>{lang === 'id' ? (c.description_id || c.description_en) : (c.description_en || c.description_id)}</p>}
                                        </motion.div>
                                    </div>
                                </FadeRight>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Organizations */}
            {organizations && organizations.length > 0 && (
                <section className="py-20">
                    <div className="mx-auto max-w-4xl px-5 sm:px-8">
                        <FadeUp><h2 className="text-3xl font-black">{t('Organizations & Community', 'Organisasi & Komunitas')}</h2></FadeUp>
                        <div className="relative mt-10">
                            <div className={`absolute left-5 top-0 h-full w-0.5 rounded-full sm:left-8 ${dk ? 'bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent' : 'bg-gradient-to-b from-indigo-200 via-purple-100 to-transparent'}`} />
                            {organizations.map((org, i) => {
                                const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' });
                                return (
                                    <FadeRight key={org.id} delay={i * 0.15}>
                                        <div className="group relative mb-12 pl-14 sm:pl-20">
                                            <motion.div whileHover={{ scale: 1.5 }}
                                                className={`absolute left-3 top-2 h-4 w-4 rounded-full border-[3px] sm:left-6 ${dk ? 'border-amber-400 bg-[#050816]' : 'border-amber-400 bg-white'}`}
                                                style={{ boxShadow: '0 0 15px rgba(251,191,36,0.4)' }} />
                                            <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.3 }}
                                                className={`rounded-3xl p-6 ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                                <div className="flex flex-wrap items-baseline gap-x-3"><h3 className="text-lg font-bold">{org.role}</h3><span className="text-sm font-medium text-amber-500">@ {org.name}</span></div>
                                                <p className={`mt-1 text-xs ${dk ? 'text-white/20' : 'text-gray-300'}`}>{fmtDate(org.start_date)} → {org.end_date ? fmtDate(org.end_date) : t('Present', 'Sekarang')}</p>
                                                {(lang === 'id' ? org.description_id : org.description_en) && <p className={`mt-3 text-sm leading-relaxed ${dk ? 'text-white/35' : 'text-gray-400'}`}>{lang === 'id' ? (org.description_id || org.description_en) : (org.description_en || org.description_id)}</p>}
                                            </motion.div>
                                        </div>
                                    </FadeRight>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-5 sm:px-8">
                        <FadeUp><h2 className="text-3xl font-black">{t('Achievements', 'Pencapaian')}</h2></FadeUp>
                        <StaggerChildren className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
                            {achievements.map((a) => (
                                <StaggerItem key={a.id}>
                                    <motion.div whileHover={{ y: -5, scale: 1.02 }} className={`rounded-3xl p-7 ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-white border border-gray-100 hover:shadow-xl'}`}>
                                        <div className="flex items-center justify-between"><span className="text-2xl">🏆</span><span className={`text-xs ${dk ? 'text-white/20' : 'text-gray-300'}`}>{a.date || ''}</span></div>
                                        <h3 className="mt-3 font-bold">{lang === 'id' ? (a.title_id || a.title_en) : (a.title_en || a.title_id)}</h3>
                                        {(lang === 'id' ? a.description_id : a.description_en) && <p className={`mt-2 text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>{lang === 'id' ? (a.description_id || a.description_en) : (a.description_en || a.description_id)}</p>}
                                    </motion.div>
                                </StaggerItem>
                            ))}
                        </StaggerChildren>
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}
