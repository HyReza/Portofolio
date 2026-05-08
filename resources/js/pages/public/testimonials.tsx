import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useApp } from '@/hooks/useApp';
import { Quote, ExternalLink, Star, Users } from 'lucide-react';
import { TextReveal, FadeUp } from '@/components/animations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    const [selectedTesti, setSelectedTesti] = useState<Testimonial | null>(null);

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
                                    className="h-full cursor-pointer"
                                    onMouseEnter={() => setHoveredId(testi.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => setSelectedTesti(testi)}
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

            {/* ── POPUP DIALOG FOR FULL TESTIMONIAL ── */}
            <Dialog open={!!selectedTesti} onOpenChange={(open) => !open && setSelectedTesti(null)}>
                <DialogContent className={`sm:max-w-2xl border ${dk ? 'bg-[#121212] border-neutral-800' : 'bg-white border-neutral-200'} rounded-3xl p-0 overflow-hidden shadow-2xl`}>
                    {selectedTesti && (() => {
                        const color = avatarColors[testimonials.findIndex(t => t.id === selectedTesti.id) % avatarColors.length];
                        return (
                            <>
                                {/* Dialog Header / Author Background */}
                                <div className={`relative px-8 pt-8 pb-6 ${dk ? 'bg-neutral-900/50' : 'bg-neutral-50/50'}`}>
                                    <DialogHeader>
                                        <DialogTitle className="sr-only">Testimonial Details</DialogTitle>
                                        <DialogDescription className="sr-only">Full review details</DialogDescription>
                                    </DialogHeader>

                                    {/* Quote watermark */}
                                    <Quote className={`absolute right-6 top-6 h-24 w-24 opacity-[0.03] -rotate-12 ${dk ? 'text-white' : 'text-indigo-900'}`} />

                                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-md h-20 w-20 text-2xl font-bold ${selectedTesti.image ? '' : `${color.bg} ${color.text}`}`}>
                                            {selectedTesti.image
                                                ? <img src={`/storage/${selectedTesti.image}`} alt={selectedTesti.client_name} className="h-full w-full object-cover" />
                                                : selectedTesti.client_name.charAt(0)}
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedTesti.client_name}</h3>
                                            <div className={`text-sm mt-1 font-medium ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                {[getPosition(selectedTesti), getCompany(selectedTesti)].filter(Boolean).join(' · ')}
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                {getRelation(selectedTesti) && (
                                                    <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {getRelation(selectedTesti)}
                                                    </span>
                                                )}
                                                {selectedTesti.project_url && (
                                                    <a
                                                        href={selectedTesti.project_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${dk ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'}`}
                                                    >
                                                        <ExternalLink className="h-3 w-3" /> Project
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Content */}
                                <div className={`px-8 py-8 ${dk ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                        <Quote className="h-5 w-5" />
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        {getContent(selectedTesti)?.split('\n').map((paragraph, i) => (
                                            paragraph.trim() && <p key={i} className="leading-relaxed text-base">{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

        </PublicLayout>
    );
}
