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
        <section className="relative py-20 lg:py-32 overflow-hidden">
            {/* Background decorative blob */}
            <div className={`absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 ${dk ? 'bg-indigo-500/20' : 'bg-indigo-100'}`} />
            
            <div className="mx-auto max-w-7xl px-6 sm:px-10">
                <div className="grid items-center gap-12 lg:gap-20 lg:grid-cols-12">
                    {/* Text Content */}
                    <div className="lg:col-span-7 space-y-8 order-2 lg:order-1 text-center lg:text-left">
                        <div className="space-y-4">
                            <FadeUp>
                                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10">
                                    <Sparkles className="h-3 w-3 text-indigo-500" />
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        {t('About Me', 'Tentang Saya')}
                                    </span>
                                </div>
                            </FadeUp>
                            <TextReveal className="text-4xl font-black leading-[1.1] sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight" delay={0.2}>
                                {heroTitle}
                            </TextReveal>
                        </div>

                        <div className="space-y-6">
                            <FadeUp delay={0.5}>
                                <p className={`text-lg lg:text-xl font-bold tracking-tight ${dk ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                    {heroSubtitle}
                                </p>
                            </FadeUp>
                            <FadeUp delay={0.7}>
                                <p className={`text-base leading-relaxed sm:text-lg lg:max-w-2xl ${dk ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    {heroBio}
                                </p>
                            </FadeUp>
                        </div>

                        <FadeUp delay={0.9}>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                                <Dialog>
                                    <DialogTrigger className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold transition-all duration-300 bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 active:scale-95`}>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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

                    {/* Profile Photo Area */}
                    <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center perspective-[1200px]">
                        <FadeLeft delay={0.4} className="w-full max-w-sm sm:max-w-md">
                            <motion.div 
                                className="relative group mx-auto"
                                whileHover={{ rotateY: -8, rotateX: 5, scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Decorative elements */}
                                <div className={`absolute -inset-4 rounded-[40px] border-2 border-dashed opacity-20 ${dk ? 'border-indigo-500' : 'border-indigo-300'} animate-[spin_20s_linear_infinite]`} />
                                <div className={`absolute -inset-8 rounded-full border border-indigo-500/10 opacity-30 animate-[spin_30s_linear_infinite_reverse]`} />
                                
                                {/* Photo Container */}
                                <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-[32px] border-4 ${dk ? 'border-neutral-800 bg-neutral-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]' : 'border-white bg-white shadow-[0_32px_64px_-16px_rgba(79,70,229,0.2)]'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 via-transparent to-transparent z-10 opacity-60" />
                                    <img
                                        src={profilePhoto}
                                        alt={pv('name') || 'Profile'}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/profil.jpeg'; }}
                                    />
                                    <div className={`absolute inset-0 ${dk ? 'bg-gradient-to-t from-neutral-950 via-transparent to-transparent' : 'bg-gradient-to-t from-white/40 via-transparent to-transparent'} z-10`} />
                                </div>

                                {/* Floating Glass Cards */}
                                <motion.div
                                    initial={{ scale: 0, x: 30 }}
                                    animate={{ scale: 1, x: 0 }}
                                    transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                                    className={`absolute -bottom-6 -right-4 sm:-right-8 z-20 flex items-center gap-3 rounded-2xl backdrop-blur-xl px-5 py-4 shadow-2xl ring-1 ${dk ? 'bg-neutral-900/80 ring-white/10' : 'bg-white/80 ring-black/5'}`}
                                    style={{ transform: 'translateZ(50px)' }}
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                                        <Code2 size={22} />
                                    </div>
                                    <div className="pr-2">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>{t('Developer', 'Pengembang')}</p>
                                        <p className={`text-base font-black ${dk ? 'text-white' : 'text-neutral-900'}`}>Full-Stack</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0, x: -30 }}
                                    animate={{ scale: 1, x: 0, y: [0, -10, 0] }}
                                    transition={{ 
                                        scale: { delay: 1.2 },
                                        y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } 
                                    }}
                                    className={`absolute top-10 -left-6 sm:-left-12 z-20 flex items-center justify-center rounded-2xl backdrop-blur-xl h-14 w-14 shadow-2xl ring-1 ${dk ? 'bg-indigo-500/20 ring-indigo-500/30 text-indigo-400' : 'bg-white/90 ring-black/5 text-indigo-600'}`}
                                    style={{ transform: 'translateZ(60px)' }}
                                >
                                    <Terminal size={24} />
                                </motion.div>

                                <div className="absolute -top-4 -right-4 z-20 text-amber-400 animate-pulse">
                                    <Sparkles size={32} />
                                </div>
                            </motion.div>
                        </FadeLeft>
                    </div>
                </div>
            </div>
        </section>
    );
}
