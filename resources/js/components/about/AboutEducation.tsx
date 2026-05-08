import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { FadeUp, FadeRight } from '@/components/animations';
import { ChevronDown, Award, GraduationCap } from 'lucide-react';

interface Education {
    id: number;
    institution: string;
    institution_en: string | null;
    degree: string | null;
    degree_en: string | null;
    field: string | null;
    field_en: string | null;
    gpa: string | null;
    start_date: string;
    end_date: string | null;
    description_id: string | null;
    description_en: string | null;
    activities_id: string | null;
    activities_en: string | null;
    logo: string | null;
    type: string;
}

interface Props {
    educations: Education[];
}

export function AboutEducation({ educations }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const bi = (id: string | null, en: string | null) => lang === 'id' ? (id || en || '') : (en || id || '');

    const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' });

    if (educations.length === 0) return null;

    return (
        <section className="py-20">
            <div className="mx-auto max-w-4xl px-5 sm:px-8">
                <FadeUp>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <GraduationCap size={22} />
                        </div>
                        <h2 className="text-3xl font-black">{t('Education', 'Pendidikan')}</h2>
                    </div>
                    <p className={`ml-[52px] text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                        {t('My academic journey and learning path', 'Perjalanan akademik dan jalur pembelajaran saya')}
                    </p>
                </FadeUp>

                <div className="relative mt-10">
                    {/* Timeline line */}
                    <div className={`absolute left-5 top-0 h-full w-0.5 rounded-full sm:left-8 ${dk ? 'bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent' : 'bg-gradient-to-b from-indigo-200 via-purple-100 to-transparent'}`} />

                    {educations.map((edu, i) => {
                        const institution = bi(edu.institution, edu.institution_en);
                        const degree = bi(edu.degree, edu.degree_en);
                        const field = bi(edu.field, edu.field_en);
                        const desc = bi(edu.description_id, edu.description_en);
                        const activities = bi(edu.activities_id, edu.activities_en);
                        const isExpanded = expandedId === edu.id;
                        const hasDetail = !!(desc || activities);

                        return (
                            <FadeRight key={edu.id} delay={i * 0.12}>
                                <div className="group relative mb-10 pl-14 sm:pl-20">
                                    {/* Timeline dot */}
                                    <motion.div
                                        whileHover={{ scale: 1.5 }}
                                        className={`absolute left-3 top-3 h-4 w-4 rounded-full border-[3px] sm:left-6 ${dk ? 'border-indigo-400 bg-[#050816]' : 'border-indigo-400 bg-white'}`}
                                        style={{ boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}
                                    />

                                    {/* Card */}
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        transition={{ duration: 0.3 }}
                                        className={`rounded-2xl p-5 sm:p-6 cursor-pointer transition-all ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/20' : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'}`}
                                        onClick={() => hasDetail && setExpandedId(isExpanded ? null : edu.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Logo */}
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${dk ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                                {edu.logo ? (
                                                    <img src={`/storage/${edu.logo}`} alt="" className="h-full w-full object-contain p-1.5" />
                                                ) : (
                                                    <span className={`text-lg font-black ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                        {institution.charAt(0)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-base font-bold sm:text-lg">{institution}</h3>
                                                        <p className={`mt-0.5 text-sm ${dk ? 'text-white/40' : 'text-gray-500'}`}>
                                                            {degree}{field ? ` — ${field}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {edu.gpa && (
                                                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${dk ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                                                <Award size={12} />
                                                                {edu.gpa}
                                                            </span>
                                                        )}
                                                        {hasDetail && (
                                                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                                <ChevronDown size={16} className={dk ? 'text-white/20' : 'text-gray-300'} />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className={`mt-2 text-xs font-medium ${dk ? 'text-indigo-400/60' : 'text-indigo-400'}`}>
                                                    {fmtDate(edu.start_date)} → {edu.end_date ? fmtDate(edu.end_date) : t('Present', 'Sekarang')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Expandable detail */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className={`mt-4 pt-4 space-y-3 ${dk ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
                                                        {desc && (
                                                            <p className={`text-sm leading-relaxed ${dk ? 'text-white/40' : 'text-gray-500'}`}>{desc}</p>
                                                        )}
                                                        {activities && (
                                                            <div>
                                                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${dk ? 'text-white/20' : 'text-gray-300'}`}>
                                                                    {t('Activities', 'Kegiatan')}
                                                                </p>
                                                                <p className={`text-sm leading-relaxed ${dk ? 'text-white/35' : 'text-gray-400'}`}>{activities}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            </FadeRight>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
