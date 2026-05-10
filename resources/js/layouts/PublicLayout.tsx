import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { SpotlightSearch } from '@/components/landing/SpotlightSearch';
import { useKonami, KonamiOverlay, useAchievements, useAutoAchievements, AchievementToast, AchievementProvider } from '@/hooks/useGimmicks';

/* react-icons — EXACT same icons codebayu uses */
import { BiHomeSmile, BiLeaf, BiEditAlt, BiArchive, BiPaperPlane, BiMessageDetail, BiTrophy } from 'react-icons/bi';
import { BsCloudSun, BsCloudMoon, BsLinkedin, BsInstagram } from 'react-icons/bs';
import { PiChatTeardropDotsBold, PiCertificate } from 'react-icons/pi';
import { MdVerified } from 'react-icons/md';
import { PanelLeft, PanelTop } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import AiChatWidget from '@/components/ai/AiChatWidget';
import ScrollToTop from '@/components/ui/ScrollToTop';

/* ─── PREMIUM TOGGLE COMPONENT ─── */
function PremiumToggle({ isActive, onClick, iconLeft, iconRight, textLeft, textRight, dk, tooltipText, forceShowTooltip, side = "bottom" }: any) {
    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <button 
                    onClick={onClick}
                    className={`relative flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border p-1 transition-all duration-300 ${dk ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-white'}`}
                >
                    <motion.div 
                        layout
                        className={`z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-lg ${dk ? 'bg-amber-400 text-black' : 'bg-indigo-600 text-white'}`}
                        initial={false}
                        animate={{ x: isActive ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                        {isActive ? (iconRight || <span className="text-[10px] font-bold">{textRight}</span>) : (iconLeft || <span className="text-[10px] font-bold">{textLeft}</span>)}
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold text-neutral-400">
                        <span className={!isActive ? 'opacity-0' : 'opacity-100'}>{iconLeft || textLeft}</span>
                        <span className={isActive ? 'opacity-0' : 'opacity-100'}>{iconRight || textRight}</span>
                    </div>
                </button>
            </TooltipTrigger>
            {tooltipText && (
                <TooltipContent side={side} className="z-[100] bg-neutral-900 text-white border-neutral-800 text-[10px]">
                    {tooltipText}
                </TooltipContent>
            )}
        </Tooltip>
    );
}

const MENU_ITEMS = [
    { title: 'Home', titleId: 'Beranda', href: '/', icon: <BiHomeSmile />, isShow: true },
    { title: 'About', titleId: 'Tentang', href: '/about', icon: <BiLeaf />, isShow: true },
    { title: 'LinkedIn', titleId: 'LinkedIn', href: '/linkedin', icon: <BsLinkedin />, isShow: true },
    { title: 'Instagram', titleId: 'Instagram', href: '/instagram', icon: <BsInstagram />, isShow: true },
    { title: 'Blog', titleId: 'Blog', href: '/blog', icon: <BiEditAlt />, isShow: true },
    { title: 'Projects', titleId: 'Proyek', href: '/projects', icon: <BiArchive />, isShow: true },
    { title: 'Certificates', titleId: 'Sertifikat', href: '/certificates', icon: <PiCertificate />, isShow: true },
    { title: 'Testimonials', titleId: 'Testimoni', href: '/testimonials', icon: <BiMessageDetail />, isShow: true },
    { title: 'Chat Room', titleId: 'Ruang Chat', href: '/chat', icon: <PiChatTeardropDotsBold />, isShow: true },
    { title: 'Badges', titleId: 'Badge', href: '/badges', icon: <BiTrophy />, isShow: true },
    { title: 'Contact', titleId: 'Kontak', href: '/contact', icon: <BiPaperPlane />, isShow: true },
];

export function PublicLayout({ children }: { children: ReactNode }) {
    const { lang, setLang, theme: appTheme, setTheme, layout, setLayout, t } = useApp();
    const { url, props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [konamiActive, setKonamiActive] = useState(false);
    const { toast, dismissToast, unlock } = useAchievements();
    const dk = appTheme === 'dark';
    const pathname = url;
    useAutoAchievements(pathname);

    // Dynamic profile helper
    const sp = props.siteProfile || {};
    const pv = (key: string) => lang === 'id' ? (sp[key]?.value_id || sp[key]?.value_en || '') : (sp[key]?.value_en || sp[key]?.value_id || '');
    const profilePhoto = pv('profile_photo') || '/assets/img/profil.jpeg';
    const profileName = pv('name') || 'Reza Edi Saputra';
    const profileTitle = pv('title') || 'Software Engineer';
    const profileUsername = pv('username') || 'rezaedisaputra';
    const statusActive = pv('status_active') === '1' || pv('status_active') === ''; // default to active if not set
    const statusText = pv('status_text') || 'Hire me.';
    const aiAssistantEnabled = props.aiAssistantEnabled ?? true;

    useSmoothScroll();
    useKonami(() => { setKonamiActive(true); unlock('konami'); });
    
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [mobileOpen]);

    const toggleTheme = () => { setTheme(dk ? 'light' : 'dark'); unlock('shape_shifter'); };
    const toggleLang = () => { setLang(lang === 'en' ? 'id' : 'en'); unlock('polyglot'); };
    const toggleLayout = () => setLayout(layout === 'sidebar' ? 'topbar' : 'sidebar');
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const sidebarScrollRef = useRef<HTMLDivElement>(null);

    // Trap scroll events inside sidebar so page doesn't scroll
    const handleSidebarWheel = useCallback((e: React.WheelEvent) => {
        const el = sidebarScrollRef.current;
        if (!el) return;
        // Only prevent default if there's content to scroll
        const { scrollTop, scrollHeight, clientHeight } = el;
        const atTop = scrollTop === 0 && e.deltaY < 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
        if (!atTop && !atBottom) {
            e.stopPropagation();
        }
    }, []);

    const filteredMenu = MENU_ITEMS.filter(item => item.isShow);

    return (
        <TooltipProvider delayDuration={0}>
            <div className={`relative flex h-full min-h-screen w-full flex-col font-sans overflow-x-hidden ${dk ? 'dark' : ''}`}>
                <SpotlightSearch />
                <KonamiOverlay active={konamiActive} onClose={() => setKonamiActive(false)} />
                <AchievementToast achievement={toast} onDismiss={dismissToast} />

                <div className="relative flex min-h-screen w-full flex-col bg-white transition-colors duration-500 dark:bg-[#121212]">
                    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                    <AnimatePresence>
                        {layout === 'topbar' && (
                            <motion.header 
                                initial={{ y: -100 }}
                                animate={{ y: 0 }}
                                exit={{ y: -100 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`fixed left-0 right-0 top-0 z-40 hidden w-full items-center justify-between border-b px-8 py-3 backdrop-blur-xl lg:flex ${dk ? 'border-neutral-800 bg-[#121212]/80' : 'border-neutral-200 bg-white/80'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 overflow-hidden rounded-full border-2 ${dk ? 'border-neutral-700' : 'border-white shadow-sm'}`}>
                                        <img src={profilePhoto} alt="profile" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h2 className="font-bold text-sm leading-tight text-neutral-900 dark:text-white">{profileName}</h2>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                                            <MdVerified className="text-blue-500" />
                                            <span>{profileTitle}</span>
                                        </div>
                                    </div>
                                </div>

                                <nav className="flex items-center gap-1">
                                    {filteredMenu.map((item) => {
                                        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                        return (
                                            <Tooltip key={item.href}>
                                                <TooltipTrigger asChild>
                                                    <Link 
                                                        href={item.href}
                                                        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 ${isActive ? (dk ? 'bg-neutral-800 text-neutral-100' : 'bg-neutral-100 text-neutral-900') : (dk ? 'text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900')}`}
                                                    >
                                                        <span className="text-xl">{item.icon}</span>
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="bg-neutral-900 text-white border-neutral-800 text-[10px]">
                                                    {lang === 'id' ? item.titleId : item.title}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </nav>

                                <div className="flex items-center gap-3">
                                    <PremiumToggle dk={dk} isActive={dk} onClick={toggleTheme} iconLeft={<BsCloudSun size={14}/>} iconRight={<BsCloudMoon size={14}/>} tooltipText={t('Toggle Theme', 'Ganti Tema')} />
                                    <PremiumToggle dk={dk} isActive={lang === 'id'} onClick={toggleLang} textLeft="EN" textRight="ID" tooltipText={t('Switch Language', 'Ganti Bahasa')} />
                                    <PremiumToggle dk={dk} isActive={layout === 'topbar'} onClick={toggleLayout} iconLeft={<PanelLeft size={14}/>} iconRight={<PanelTop size={14}/>} tooltipText={t('Layout Style', 'Gaya Tata Letak')} />
                                </div>
                            </motion.header>
                        )}
                    </AnimatePresence>

                    <div className="relative z-10 flex w-full flex-col lg:flex-row">
                        
                        <div className={`fixed left-0 right-0 top-0 z-40 flex w-full flex-col border-b px-4 py-3 backdrop-blur-xl transition-all duration-300 lg:hidden ${dk ? 'border-neutral-800 bg-[#121212]/80' : 'border-neutral-200 bg-white/80'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 overflow-hidden rounded-full border-2 ${dk ? 'border-neutral-700' : 'border-white shadow-sm'}`}>
                                        <img src={profilePhoto} alt="profile" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h2 className="truncate font-bold text-sm leading-tight text-neutral-900 dark:text-white">{profileName}</h2>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                                            <MdVerified className="text-blue-500" />
                                            <span>{profileTitle}</span>
                                        </div>
                                        {statusActive && (
                                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2 py-1 w-fit">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">{statusText}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setMobileOpen(!mobileOpen)} 
                                        className={`relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${dk ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'}`}
                                    >
                                        <motion.span animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block h-[2px] w-5 bg-current rounded-full" />
                                        <motion.span animate={mobileOpen ? { opacity: 0, x: 5 } : { opacity: 1, x: 0 }} className="block h-[2px] w-5 bg-current rounded-full" />
                                        <motion.span animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block h-[2px] w-5 bg-current rounded-full" />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {mobileOpen && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <nav className="mt-4 flex flex-col gap-1 pb-2">
                                            {filteredMenu.map((item) => {
                                                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                                return (
                                                    <Link 
                                                        key={item.href} 
                                                        href={item.href} 
                                                        onClick={() => setMobileOpen(false)}
                                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors duration-200 ${isActive ? (dk ? 'bg-neutral-800 text-neutral-100 font-medium' : 'bg-neutral-100 text-neutral-900 font-medium') : (dk ? 'text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900')}`}
                                                    >
                                                        <span className="text-xl">{item.icon}</span>
                                                        {lang === 'id' ? item.titleId : item.title}
                                                    </Link>
                                                );
                                            })}
                                            
                                            <div className="mt-4 flex items-center justify-between rounded-xl p-3 border dark:border-neutral-800 border-neutral-200">
                                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('Settings', 'Pengaturan')}</span>
                                                <div className="flex gap-2">
                                                    <PremiumToggle dk={dk} isActive={dk} onClick={toggleTheme} iconLeft={<BsCloudSun size={14}/>} iconRight={<BsCloudMoon size={14}/>} />
                                                    <PremiumToggle dk={dk} isActive={lang === 'id'} onClick={toggleLang} textLeft="EN" textRight="ID" />
                                                </div>
                                            </div>
                                        </nav>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <aside 
                            onMouseEnter={() => { setMobileOpen(false); setIsSidebarHovered(true); }} 
                            onMouseLeave={() => setIsSidebarHovered(false)}
                            onWheel={handleSidebarWheel}
                            className={`group fixed bottom-0 left-0 top-0 z-50 hidden flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex ${layout === 'sidebar' ? 'w-[88px] hover:w-64 translate-x-0' : 'w-0 opacity-0 pointer-events-none -translate-x-full'} ${dk ? 'bg-[#0f0f0f]/95 backdrop-blur-md border-r border-white/5 shadow-[10px_0_40px_rgba(0,0,0,0.4)]' : 'bg-white/95 backdrop-blur-md border-r border-neutral-100 shadow-[10px_0_40px_rgba(0,0,0,0.03)]'}`}
                        >
                            <div ref={sidebarScrollRef} className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden p-5 overscroll-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {/* Profile Section */}
                                <div className="flex flex-col items-center mb-8 shrink-0">
                                    <div className="relative w-full flex flex-col items-center">
                                        {statusActive && (
                                            <div className={`absolute -top-1 -left-1 z-20 transition-all duration-500 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 ${dk ? 'bg-[#0f0f0f]' : 'bg-white'} pb-2 pr-2 rounded-br-2xl`}>
                                                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">{statusText}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className={`w-full overflow-hidden rounded-2xl transition-all duration-500 ${dk ? 'bg-neutral-800/50' : 'bg-neutral-50'} h-0 opacity-0 group-hover:h-28 group-hover:opacity-100`}>
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent" />
                                        </div>

                                        <div className="z-10 -mt-0 group-hover:-mt-12 rounded-full p-1.5 border-4 border-transparent bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 transition-all duration-500 group-hover:scale-110 shadow-xl shadow-indigo-500/10">
                                            <img src={profilePhoto} alt="profile" className="h-12 w-12 group-hover:h-20 group-hover:w-20 rounded-full object-cover ring-2 ring-white dark:ring-[#0f0f0f]" />
                                        </div>

                                        <div className="flex flex-col items-center text-center mt-3 w-full transition-all duration-500">
                                            <div className="opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto transition-all duration-500 overflow-hidden px-2">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <h2 className="font-sora text-[15px] font-extrabold text-neutral-900 dark:text-white truncate">{profileName}</h2>
                                                    <MdVerified className="text-blue-500 shrink-0" size={16} />
                                                </div>
                                                <p className="font-medium text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 mb-6">@{profileUsername}</p>
                                            </div>

                                            <div className="flex flex-col group-hover:flex-row items-center gap-2.5 w-full justify-center py-2">
                                                <PremiumToggle dk={dk} isActive={dk} onClick={toggleTheme} iconLeft={<BsCloudSun size={14}/>} iconRight={<BsCloudMoon size={14}/>} tooltipText={t('Toggle Theme', 'Ganti Tema')} side="right" />
                                                
                                                <div className="flex flex-col group-hover:flex-row items-center gap-2.5 opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto overflow-hidden transition-all duration-500">
                                                    <PremiumToggle dk={dk} isActive={lang === 'id'} onClick={toggleLang} textLeft="EN" textRight="ID" tooltipText={t('Switch Language', 'Ganti Bahasa')} side="right" />
                                                    <PremiumToggle dk={dk} isActive={layout === 'topbar'} onClick={toggleLayout} iconLeft={<PanelLeft size={14}/>} iconRight={<PanelTop size={14}/>} tooltipText={t('Layout Style', 'Gaya Tata Letak')} side="right" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Section */}
                                <nav className="flex flex-col gap-1.5 flex-1 border-t border-neutral-100 dark:border-neutral-800/50 pt-6">
                                    {filteredMenu.map((item) => {
                                        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                        return (
                                            <Link 
                                                key={item.href}
                                                href={item.href}
                                                className={`relative flex items-center rounded-xl transition-all duration-300 px-3 py-3.5 gap-5 group/item ${isActive ? (dk ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-600 font-bold') : (dk ? 'text-neutral-500 hover:bg-neutral-800/60 hover:text-neutral-300' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900')}`}
                                            >
                                                <div className={`relative flex items-center justify-center transition-transform duration-300 group-hover/item:scale-110 ${isActive ? 'scale-110' : ''}`}>
                                                    <span className="text-2xl">{item.icon}</span>
                                                    {isActive && <motion.span layoutId="active-dot" className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />}
                                                </div>
                                                <span className="text-[13px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 overflow-hidden">
                                                    {lang === 'id' ? item.titleId : item.title}
                                                </span>
                                                
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="sidebar-active-line"
                                                        className="absolute right-0 w-1 h-6 bg-indigo-500 rounded-l-full"
                                                    />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Footer Copyright */}
                                <div className="mt-auto pt-6 shrink-0 transition-all duration-500 group-hover:opacity-100 opacity-0 h-0 group-hover:h-auto overflow-hidden">
                                    <div className="text-center w-full pb-4">
                                        <p className="text-[9px] font-bold text-neutral-400 dark:text-neutral-600 whitespace-nowrap uppercase tracking-widest opacity-50">© {new Date().getFullYear()} REZA EDI SAPUTRA</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <main className={`relative flex-1 transition-all duration-500 pt-20 ${layout === 'sidebar' ? 'lg:ml-[88px] lg:pt-0' : 'lg:pt-24'}`}>
                            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-12 lg:py-16">
                                <motion.div 
                                    key={url} 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    {children}
                                </motion.div>
                            </div>
                        </main>
                    </div>

                    {/* AI Chat Widget */}
                    {aiAssistantEnabled && (
                        <div className="z-50">
                            <AiChatWidget />
                        </div>
                    )}

                    {/* Scroll to Top */}
                    <ScrollToTop />
                </div>
            </div>
        </TooltipProvider>
    );
}
