import { motion } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { TextReveal, FadeUp, FadeLeft } from '@/components/animations';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Code2, Sparkles, Terminal } from 'lucide-react';

interface Profile { key: string; value_id: string | null; value_en: string | null; }

interface Props {
    profiles: Record<string, Profile>;
}

export function AboutHero({ profiles }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const pv = (key: string) => lang === 'id' ? (profiles[key]?.value_id || profiles[key]?.value_en || '') : (profiles[key]?.value_en || profiles[key]?.value_id || '');
    const dk = appTheme === 'dark';

    const heroTitle = pv('about_page_title') || t('Crafting Digital Experiences', 'Menciptakan Pengalaman Digital');
    const heroSubtitle = pv('about_page_subtitle') || pv('title') || t('Software Engineer', 'Software Engineer');
    const heroBio = pv('about_page_bio') || pv('bio') || t('Passionate developer building modern web experiences.', 'Developer passionate membangun pengalaman web modern.');
    const profilePhoto = pv('about_page_photo') || pv('profile_photo') || '/assets/img/profil.jpeg';

    return (
        <section className="py-20 sm:py-28 overflow-hidden">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-5">
                    {/* Text Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <FadeUp>
                            <p className={`text-xs font-bold uppercase tracking-[0.3em] ${dk ? 'text-indigo-400/60' : 'text-indigo-500'}`}>
                                {t('About Me', 'Tentang Saya')}
                            </p>
                        </FadeUp>
                        <TextReveal className="text-4xl font-black leading-[1.1] sm:text-5xl lg:text-[3.2rem]" delay={0.2}>
                            {heroTitle}
                        </TextReveal>
                        <FadeUp delay={0.5}>
                            <p className={`text-lg font-semibold ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                {heroSubtitle}
                            </p>
                        </FadeUp>
                        <FadeUp delay={0.7}>
                            <p className={`text-base leading-relaxed sm:text-lg ${dk ? 'text-white/45' : 'text-gray-500'}`}>
                                {heroBio}
                            </p>
                        </FadeUp>
                        <FadeUp delay={0.9}>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Dialog>
                                    <DialogTrigger className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5`}>
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

                    {/* Profile Photo with Modern Gimmicks */}
                    <FadeLeft delay={0.4}>
                        <div className="lg:col-span-2 flex justify-center perspective-[1000px] py-8 lg:py-0">
                            <motion.div 
                                className="relative group cursor-pointer"
                                whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Decorative tech circles — hidden on mobile to prevent overflow */}
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className={`absolute -inset-10 rounded-full border border-dashed hidden sm:block ${dk ? 'border-indigo-500/20' : 'border-indigo-200'} opacity-50`} />
                                <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }} className={`absolute -inset-16 rounded-full border hidden sm:block ${dk ? 'border-purple-500/10' : 'border-purple-100'} opacity-30`} />
                                
                                {/* Photo Container */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                                    className={`relative h-56 w-56 overflow-hidden rounded-3xl sm:h-80 sm:w-80 ${dk ? 'bg-[#121212] ring-1 ring-white/10 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : 'bg-white ring-1 ring-neutral-200 shadow-2xl shadow-indigo-500/10'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-purple-500/20 mix-blend-overlay z-10 opacity-60 transition-opacity group-hover:opacity-100" />
                                    <img
                                        src={profilePhoto}
                                        alt={pv('name') || 'Profile'}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/profil.jpeg'; }}
                                    />
                                    <div className={`absolute inset-0 ${dk ? 'bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent' : 'bg-gradient-to-t from-white/80 via-transparent to-transparent'} z-10`} />
                                </motion.div>

                                {/* Floating Glassmorphism Cards — repositioned for mobile */}
                                <motion.div
                                    initial={{ scale: 0, x: 20 }}
                                    animate={{ scale: 1, x: 0 }}
                                    transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                                    className={`absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-6 z-20 flex items-center gap-2 sm:gap-3 rounded-2xl backdrop-blur-md px-3 py-2 sm:px-5 sm:py-3 shadow-xl ring-1 ${dk ? 'bg-white/10 ring-white/20' : 'bg-white/70 ring-neutral-200'}`}
                                    style={{ transform: 'translateZ(30px)' }}
                                >
                                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-inner">
                                        <Code2 size={16} className="sm:hidden" />
                                        <Code2 size={20} className="hidden sm:block" />
                                    </div>
                                    <div>
                                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-indigo-300' : 'text-indigo-600'}`}>{t('Developer', 'Pengembang')}</p>
                                        <p className={`text-xs sm:text-sm font-black ${dk ? 'text-white' : 'text-neutral-900'}`}>Full-Stack</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0, x: -20 }}
                                    animate={{ scale: 1, x: 0, y: [-5, 5, -5] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                    className={`absolute top-4 -left-2 sm:top-6 sm:-left-8 z-20 flex items-center justify-center rounded-2xl backdrop-blur-md h-10 w-10 sm:h-12 sm:w-12 shadow-xl ring-1 ${dk ? 'bg-indigo-500/20 ring-indigo-500/30 text-indigo-400' : 'bg-white/70 ring-neutral-200 text-indigo-600'}`}
                                    style={{ transform: 'translateZ(40px)' }}
                                >
                                    <Terminal size={18} />
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                                    className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 z-20 text-amber-400"
                                    style={{ transform: 'translateZ(20px)' }}
                                >
                                    <Sparkles size={22} className="sm:hidden" />
                                    <Sparkles size={28} className="hidden sm:block" />
                                </motion.div>
                            </motion.div>
                        </div>
                    </FadeLeft>
                </div>
            </div>
        </section>
    );
}
