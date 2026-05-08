import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useApp } from '@/hooks/useApp';
import { Quote, ExternalLink, Star, Users } from 'lucide-react';
import { TextReveal, FadeUp } from '@/components/animations';

interface Testimonial {
    id: number;
    client_name: string;
    company: string | null;
    company_en: string | null;
    position: string | null;
    position_en: string | null;
    relation: string | null;
    relation_en: string | null;
    content_id: string;
    content_en: string | null;
    image: string | null;
    project_url: string | null;
}

/* Stagger reveal for cards */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
};
const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const getContent = (testi: Testimonial) =>
        lang === 'id' ? (testi.content_id || testi.content_en) : (testi.content_en || testi.content_id);
    const getPosition = (testi: Testimonial) =>
        lang === 'id' ? (testi.position || testi.position_en) : (testi.position_en || testi.position);
    const getCompany = (testi: Testimonial) =>
        lang === 'id' ? (testi.company || testi.company_en) : (testi.company_en || testi.company);
    const getRelation = (testi: Testimonial) =>
        lang === 'id' ? (testi.relation || testi.relation_en) : (testi.relation_en || testi.relation);

    /* Color palette for avatar fallbacks */
    const avatarColors = [
        { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-white' },
        { bg: 'bg-gradient-to-br from-cyan-500 to-blue-600', text: 'text-white' },
        { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-white' },
        { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white' },
        { bg: 'bg-gradient-to-br from-rose-500 to-pink-600', text: 'text-white' },
        { bg: 'bg-gradient-to-br from-indigo-500 to-blue-700', text: 'text-white' },
    ];

    return (
        <PublicLayout>
            <Head title={`${t('Testimonials', 'Testimoni')} | Portfolio`}>
                <meta name="description" content={t('Client feedback and recommendations.', 'Umpan balik dan rekomendasi klien.')} />
            </Head>

            <div className="space-y-10 pb-20">
                {/* ── HEADER ── */}
                <div className="max-w-2xl space-y-3">
                    <FadeUp>
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Users className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                {t('Testimonials', 'Testimoni')}
                            </h1>
                        </div>
                    </FadeUp>
                    <FadeUp delay={0.15}>
                        <p className={`text-sm leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {t(
                                'What people say about my work, dedication, and professional relationships.',
                                'Apa yang orang katakan tentang pekerjaan, dedikasi, dan hubungan profesional saya.'
                            )}
                        </p>
                    </FadeUp>

                    {/* Stats bar */}
                    {testimonials.length > 0 && (
                        <FadeUp delay={0.25}>
                            <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs font-semibold ${dk ? 'bg-neutral-800/80 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                                <div className="flex -space-x-2">
                                    {testimonials.slice(0, 4).map((t, i) => (
                                        <div key={t.id} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold overflow-hidden ${dk ? 'border-neutral-900' : 'border-white'} ${avatarColors[i % avatarColors.length].bg} ${avatarColors[i % avatarColors.length].text}`}>
                                            {t.image
                                                ? <img src={`/storage/${t.image}`} alt="" className="h-full w-full object-cover" />
                                                : t.client_name.charAt(0)}
                                        </div>
                                    ))}
                                    {testimonials.length > 4 && (
                                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold ${dk ? 'border-neutral-900 bg-neutral-700 text-neutral-300' : 'border-white bg-neutral-200 text-neutral-600'}`}>
                                            +{testimonials.length - 4}
                                        </div>
                                    )}
                                </div>
                                <span>{testimonials.length} {t('reviews', 'ulasan')}</span>
                                <div className="flex items-center gap-0.5 text-amber-500">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                                </div>
                            </div>
                        </FadeUp>
                    )}
                </div>

                {/* ── UNIFORM GRID ── */}
                {testimonials.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {testimonials.map((testi, idx) => {
                            const color = avatarColors[idx % avatarColors.length];
                            const isHovered = hoveredId === testi.id;

                            return (
                                <motion.div
                                    key={testi.id}
                                    variants={cardVariants}
                                    className="h-full"
                                    onMouseEnter={() => setHoveredId(testi.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <div className={`relative h-full overflow-hidden rounded-2xl border p-6 transition-all duration-500 flex flex-col ${dk
                                        ? `bg-[#121212] border-neutral-800 ${isHovered ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5 -translate-y-1' : 'hover:border-neutral-700'}`
                                        : `bg-white border-neutral-200 ${isHovered ? 'border-indigo-300 shadow-xl shadow-indigo-500/5 -translate-y-1' : 'hover:border-neutral-300 hover:shadow-sm'}`
                                    }`}>
                                        
                                        {/* Mouse Spotlight Gimmick */}
                                        <div className={`absolute -inset-px opacity-0 transition duration-300 ${isHovered ? 'opacity-100' : ''}`}
                                             style={{
                                                 background: `radial-gradient(600px circle at 50% 50%, ${dk ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)'}, transparent 40%)`
                                             }}
                                        />

                                        {/* Decorative Background Icon */}
                                        <Quote className={`absolute -bottom-4 -right-2 h-32 w-32 opacity-[0.03] transition-transform duration-700 ${isHovered ? 'scale-110 -rotate-6' : 'scale-100'} ${dk ? 'text-white' : 'text-indigo-900'}`} />

                                        <div className="relative z-10 flex flex-col h-full">
                                            
                                            <div className="flex-1 mb-6">
                                                <div className="flex items-center gap-4 mb-5">
                                                    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold shadow-sm h-12 w-12 ${testi.image ? '' : `${color.bg} ${color.text}`}`}>
                                                        {testi.image
                                                            ? <img src={`/storage/${testi.image}`} alt={testi.client_name} className="h-full w-full object-cover" />
                                                            : testi.client_name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{testi.client_name}</h3>
                                                        <div className={`text-[11px] mt-0.5 truncate ${dk ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                                            {[getPosition(testi), getCompany(testi)].filter(Boolean).join(' · ')}
                                                        </div>
                                                    </div>
                                                    {testi.project_url && (
                                                        <a
                                                            href={testi.project_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${dk ? 'bg-neutral-800/50 text-neutral-400 hover:bg-indigo-500/20 hover:text-indigo-400' : 'bg-neutral-50 text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </a>
                                                    )}
                                                </div>

                                                <p className={`text-sm leading-[1.8] italic ${dk ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    "{getContent(testi)}"
                                                </p>
                                            </div>

                                            {getRelation(testi) && (
                                                <div className={`pt-4 border-t ${dk ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                                    <span className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {getRelation(testi)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <FadeUp>
                        <div className={`flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed ${dk ? 'border-neutral-800 text-neutral-600' : 'border-neutral-200 text-neutral-400'}`}>
                            <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${dk ? 'bg-neutral-800/50' : 'bg-neutral-100'}`}>
                                <Quote className="h-7 w-7 opacity-50" />
                            </div>
                            <p className="font-medium">{t('No testimonials available yet.', 'Belum ada testimoni tersedia.')}</p>
                            <p className="mt-1 text-xs opacity-60">{t('Check back later!', 'Cek kembali nanti!')}</p>
                        </div>
                    </FadeUp>
                )}
            </div>
        </PublicLayout>
    );
}
