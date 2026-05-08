import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { FadeUp, FadeRight } from '@/components/animations';
import { ChevronDown, Briefcase } from 'lucide-react';

interface Career {
    id: number;
    company: string;
    company_en: string | null;
    position_id: string | null;
    position_en: string | null;
    start_date: string;
    end_date: string | null;
    description_en: string | null;
    description_id: string | null;
    logo: string | null;
    is_current: boolean;
    children: Career[];
}

interface Props {
    careers: Career[];
}

export function AboutCareer({ careers }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const bi = (id: string | null, en: string | null) => lang === 'id' ? (id || en || '') : (en || id || '');
    const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' });

    if (careers.length === 0) return null;

    const renderCareer = (c: Career, i: number, isChild = false) => {
        const pos = bi(c.position_id, c.position_en);
        const company = bi(c.company, c.company_en);
        const desc = bi(c.description_id, c.description_en);
        const isExpanded = expandedId === c.id;

        return (
            <FadeRight key={c.id} delay={i * 0.12}>
                <div className={`group relative mb-10 ${isChild ? 'pl-20 sm:pl-28' : 'pl-14 sm:pl-20'}`}>
                    {/* Timeline dot */}
                    <motion.div
                        whileHover={{ scale: 1.5 }}
                        className={`absolute ${isChild ? 'left-9 sm:left-14' : 'left-3 sm:left-6'} top-3 h-4 w-4 rounded-full border-[3px] ${
                            c.is_current
                                ? (dk ? 'border-emerald-400 bg-[#050816]' : 'border-emerald-400 bg-white')
                                : (dk ? 'border-indigo-400 bg-[#050816]' : 'border-indigo-400 bg-white')
                        }`}
                        style={{ boxShadow: c.is_current ? '0 0 15px rgba(52,211,153,0.4)' : '0 0 15px rgba(99,102,241,0.4)' }}
                    />

                    {/* Child connector */}
                    {isChild && (
                        <div className={`absolute left-12 sm:left-[68px] top-0 h-5 w-4 ${dk ? 'border-l border-b border-white/10' : 'border-l border-b border-gray-200'} rounded-bl-lg`} />
                    )}

                    <motion.div
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-2xl p-5 sm:p-6 cursor-pointer transition-all ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/20' : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'}`}
                        onClick={() => desc && setExpandedId(isExpanded ? null : c.id)}
                    >
                        <div className="flex items-start gap-4">
                            {/* Logo */}
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${dk ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                {c.logo ? (
                                    <img src={`/storage/${c.logo}`} alt="" className="h-full w-full object-contain p-1.5" />
                                ) : (
                                    <span className={`text-lg font-black ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        {(c.company || '').charAt(0)}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base font-bold sm:text-lg">{pos}</h3>
                                            {c.is_current && (
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${dk ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                                    {t('Current', 'Saat ini')}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`mt-0.5 text-sm font-medium ${dk ? 'text-indigo-400/60' : 'text-indigo-500'}`}>
                                            @ {company}
                                        </p>
                                    </div>
                                    {desc && (
                                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown size={16} className={dk ? 'text-white/20' : 'text-gray-300'} />
                                        </motion.div>
                                    )}
                                </div>
                                <p className={`mt-2 text-xs ${dk ? 'text-white/20' : 'text-gray-400'}`}>
                                    {fmtDate(c.start_date)} → {c.end_date ? fmtDate(c.end_date) : t('Present', 'Sekarang')}
                                </p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && desc && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <p className={`mt-4 pt-4 text-sm leading-relaxed ${dk ? 'text-white/35 border-t border-white/5' : 'text-gray-500 border-t border-gray-100'}`}>
                                        {desc}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
                {/* Children */}
                {c.children?.map((child, ci) => renderCareer(child, ci, true))}
            </FadeRight>
        );
    };

    return (
        <section className={`py-20 ${dk ? 'bg-white/[0.01]' : 'bg-gray-50/50'}`}>
            <div className="mx-auto max-w-4xl px-5 sm:px-8">
                <FadeUp>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Briefcase size={22} />
                        </div>
                        <h2 className="text-3xl font-black">{t('Career', 'Karir')}</h2>
                    </div>
                    <p className={`ml-[52px] text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                        {t('Professional experience and growth', 'Pengalaman dan pertumbuhan profesional')}
                    </p>
                </FadeUp>

                <div className="relative mt-10">
                    <div className={`absolute left-5 top-0 h-full w-0.5 rounded-full sm:left-8 ${dk ? 'bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent' : 'bg-gradient-to-b from-indigo-200 via-purple-100 to-transparent'}`} />
                    {careers.map((c, i) => renderCareer(c, i))}
                </div>
            </div>
        </section>
    );
}
