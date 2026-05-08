import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { FadeUp, FadeRight } from '@/components/animations';
import { ChevronDown, Users } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    name_en: string | null;
    role: string;
    role_en: string | null;
    start_date: string;
    end_date: string | null;
    description_id: string | null;
    description_en: string | null;
    logo: string | null;
    is_current: boolean;
}

interface Props {
    organizations: Organization[];
}

export function AboutOrganizations({ organizations }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const bi = (id: string | null, en: string | null) => lang === 'id' ? (id || en || '') : (en || id || '');
    const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' });

    if (!organizations || organizations.length === 0) return null;

    return (
        <section className="py-20">
            <div className="mx-auto max-w-4xl px-5 sm:px-8">
                <FadeUp>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                            <Users size={22} />
                        </div>
                        <h2 className="text-3xl font-black">{t('Organizations & Community', 'Organisasi & Komunitas')}</h2>
                    </div>
                    <p className={`ml-[52px] text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                        {t('Community involvement and leadership', 'Keterlibatan komunitas dan kepemimpinan')}
                    </p>
                </FadeUp>

                <div className="relative mt-10">
                    <div className={`absolute left-5 top-0 h-full w-0.5 rounded-full sm:left-8 ${dk ? 'bg-gradient-to-b from-amber-500/30 via-orange-500/10 to-transparent' : 'bg-gradient-to-b from-amber-200 via-orange-100 to-transparent'}`} />

                    {organizations.map((org, i) => {
                        const name = bi(org.name, org.name_en);
                        const role = bi(org.role, org.role_en);
                        const desc = bi(org.description_id, org.description_en);
                        const isExpanded = expandedId === org.id;

                        return (
                            <FadeRight key={org.id} delay={i * 0.12}>
                                <div className="group relative mb-10 pl-14 sm:pl-20">
                                    <motion.div
                                        whileHover={{ scale: 1.5 }}
                                        className={`absolute left-3 top-3 h-4 w-4 rounded-full border-[3px] sm:left-6 ${dk ? 'border-amber-400 bg-[#050816]' : 'border-amber-400 bg-white'}`}
                                        style={{ boxShadow: '0 0 15px rgba(251,191,36,0.4)' }}
                                    />

                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        transition={{ duration: 0.3 }}
                                        className={`rounded-2xl p-5 sm:p-6 cursor-pointer transition-all ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-amber-500/20' : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'}`}
                                        onClick={() => desc && setExpandedId(isExpanded ? null : org.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Logo / Initial */}
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${dk ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                                {org.logo ? (
                                                    <img src={`/storage/${org.logo}`} alt="" className="h-full w-full object-contain p-1.5" />
                                                ) : (
                                                    <span className={`text-lg font-black ${dk ? 'text-amber-400' : 'text-amber-600'}`}>
                                                        {org.name?.charAt(0) || 'O'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-base font-bold sm:text-lg">{role}</h3>
                                                            {org.is_current && (
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${dk ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                                                    {t('Active', 'Aktif')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`mt-0.5 text-sm font-medium ${dk ? 'text-amber-400/60' : 'text-amber-500'}`}>
                                                            @ {name}
                                                        </p>
                                                    </div>
                                                    {desc && (
                                                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                            <ChevronDown size={16} className={dk ? 'text-white/20' : 'text-gray-300'} />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <p className={`mt-2 text-xs ${dk ? 'text-white/20' : 'text-gray-400'}`}>
                                                    {fmtDate(org.start_date)} → {org.end_date ? fmtDate(org.end_date) : t('Present', 'Sekarang')}
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
                            </FadeRight>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
