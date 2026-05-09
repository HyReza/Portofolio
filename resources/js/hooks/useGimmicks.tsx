import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════
   KONAMI CODE
   ═══════════════════════════════════════════ */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

export function useKonami(callback: () => void) {
    const [seq, setSeq] = useState<string[]>([]);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            setSeq(prev => {
                const next = [...prev, e.key].slice(-KONAMI.length);
                if (next.length === KONAMI.length && next.every((k, i) => k === KONAMI[i])) {
                    callback();
                    return [];
                }
                return next;
            });
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [callback]);
}

export function KonamiOverlay({ active, onClose }: { active: boolean; onClose: () => void }) {
    if (!active) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl" onClick={onClose}>
            <div className="text-center animate-[pulse_1s_ease-in-out_infinite]">
                <div className="text-8xl mb-6">🎮</div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 mb-4">
                    GOD MODE ACTIVATED
                </h2>
                <p className="text-white/40 text-lg">You found the secret! 🎉</p>
                <p className="text-white/20 text-sm mt-2">↑↑↓↓←→←→BA</p>
                <p className="text-white/10 text-xs mt-8">Click anywhere to close</p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ACHIEVEMENT DEFINITIONS
   ═══════════════════════════════════════════ */
export interface Achievement {
    id: string;
    title: string;
    titleId: string;
    description: string;
    descriptionId: string;
    category: 'exploration' | 'content' | 'interaction' | 'secret' | 'dedication';
    icon: string;     // emoji fallback
    image?: string;   // custom image path (if available)
    hint: string;
    hintId: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
    // ── EXPLORATION (7) ──
    { id: 'explorer', title: 'Explorer', titleId: 'Penjelajah', description: 'Visited 3 different pages', descriptionId: 'Mengunjungi 3 halaman berbeda', category: 'exploration', icon: '🧭', hint: 'Navigate around the site', hintId: 'Jelajahi situs ini', rarity: 'common' },
    { id: 'wanderer', title: 'Wanderer', titleId: 'Pengembara', description: 'Visited all pages', descriptionId: 'Mengunjungi semua halaman', category: 'exploration', icon: '🗺️', hint: 'Visit every single page', hintId: 'Kunjungi setiap halaman', rarity: 'uncommon' },
    { id: 'night_owl', title: 'Night Owl', titleId: 'Burung Hantu', description: 'Visited after midnight', descriptionId: 'Mengunjungi setelah tengah malam', category: 'exploration', icon: '🌙', hint: 'Come back when the moon is high', hintId: 'Kembali saat bulan tinggi', rarity: 'uncommon' },
    { id: 'early_bird', title: 'Early Bird', titleId: 'Si Rajin', description: 'Visited before 7 AM', descriptionId: 'Mengunjungi sebelum jam 7 pagi', category: 'exploration', icon: '☀️', hint: 'The early bird catches the badge', hintId: 'Bangun pagi berhadiah', rarity: 'uncommon' },
    { id: 'homecoming', title: 'Homecoming', titleId: 'Pulang Kampung', description: 'Returned to the homepage 5 times', descriptionId: 'Kembali ke beranda 5 kali', category: 'exploration', icon: '🏠', hint: 'There\'s no place like home', hintId: 'Rumahku surgaku', rarity: 'common' },
    { id: 'globe_trotter', title: 'Globe Trotter', titleId: 'Pelancong', description: 'Visited LinkedIn and Instagram pages', descriptionId: 'Mengunjungi halaman LinkedIn dan Instagram', category: 'exploration', icon: '🌍', hint: 'Check out social media pages', hintId: 'Lihat halaman media sosial', rarity: 'common' },
    { id: 'badge_hunter', title: 'Badge Hunter', titleId: 'Pemburu Badge', description: 'Visited the Badges page', descriptionId: 'Mengunjungi halaman Badges', category: 'exploration', icon: '🎯', hint: 'You\'re already looking for it', hintId: 'Kamu sudah mencarinya', rarity: 'common' },

    // ── CONTENT (6) ──
    { id: 'bookworm', title: 'Bookworm', titleId: 'Kutu Buku', description: 'Read a blog post to the end', descriptionId: 'Membaca blog sampai selesai', category: 'content', icon: '📖', hint: 'Read a full article', hintId: 'Baca artikel sampai habis', rarity: 'common' },
    { id: 'scholar', title: 'Scholar', titleId: 'Cendekiawan', description: 'Read 3 blog posts', descriptionId: 'Membaca 3 blog post', category: 'content', icon: '📚', hint: 'Knowledge is power', hintId: 'Ilmu adalah kekuatan', rarity: 'uncommon' },
    { id: 'detective', title: 'Detective', titleId: 'Detektif', description: 'Used Spotlight Search', descriptionId: 'Menggunakan Spotlight Search', category: 'content', icon: '🔍', hint: 'Search for something', hintId: 'Cari sesuatu', rarity: 'common' },
    { id: 'recruiter', title: 'Recruiter', titleId: 'Perekrut', description: 'Viewed a project in detail', descriptionId: 'Melihat detail proyek', category: 'content', icon: '💼', hint: 'Check out project details', hintId: 'Lihat detail proyek', rarity: 'common' },
    { id: 'certified', title: 'Certified', titleId: 'Tersertifikasi', description: 'Viewed certificates page', descriptionId: 'Melihat halaman sertifikat', category: 'content', icon: '📜', hint: 'Credentials matter', hintId: 'Sertifikat penting', rarity: 'common' },
    { id: 'art_critic', title: 'Art Critic', titleId: 'Kritikus Seni', description: 'Viewed 3 different projects', descriptionId: 'Melihat 3 proyek berbeda', category: 'content', icon: '🎨', hint: 'Explore multiple projects', hintId: 'Jelajahi beberapa proyek', rarity: 'uncommon' },

    // ── INTERACTION (6) ──
    { id: 'socializer', title: 'Socializer', titleId: 'Sosialita', description: 'Sent a message in Chat Room', descriptionId: 'Mengirim pesan di Chat Room', category: 'interaction', icon: '💬', hint: 'Say hello in the chat', hintId: 'Sapa di ruang chat', rarity: 'common' },
    { id: 'ai_whisperer', title: 'AI Whisperer', titleId: 'Pembisik AI', description: 'Asked AI Assistant 3 questions', descriptionId: 'Bertanya pada AI 3 kali', category: 'interaction', icon: '🤖', hint: 'Have a conversation with AI', hintId: 'Ngobrol dengan AI', rarity: 'uncommon' },
    { id: 'cv_collector', title: 'CV Collector', titleId: 'Kolektor CV', description: 'Downloaded a CV', descriptionId: 'Mengunduh CV', category: 'interaction', icon: '📥', hint: 'Download something useful', hintId: 'Unduh sesuatu yang berguna', rarity: 'common' },
    { id: 'connector', title: 'Connector', titleId: 'Penghubung', description: 'Visited the Contact page', descriptionId: 'Mengunjungi halaman Kontak', category: 'interaction', icon: '✉️', hint: 'Reach out', hintId: 'Jangkau keluar', rarity: 'common' },
    { id: 'supporter', title: 'Supporter', titleId: 'Pendukung', description: 'Reacted with emoji in Chat', descriptionId: 'Memberi reaksi emoji di Chat', category: 'interaction', icon: '⭐', hint: 'Show some love', hintId: 'Tunjukkan dukungan', rarity: 'uncommon' },
    { id: 'curious_cat', title: 'Curious Cat', titleId: 'Kucing Penasaran', description: 'Clicked "View All" on any section', descriptionId: 'Klik "Lihat Semua" di section manapun', category: 'interaction', icon: '🔮', hint: 'Want to see more?', hintId: 'Ingin lihat lebih?', rarity: 'common' },

    // ── SECRET (4) ──
    { id: 'gamer', title: 'Gamer', titleId: 'Gamer', description: 'Found the Konami Code', descriptionId: 'Menemukan Konami Code', category: 'secret', icon: '🎮', hint: '↑↑↓↓←→←→BA', hintId: '↑↑↓↓←→←→BA', rarity: 'legendary' },
    { id: 'shape_shifter', title: 'Shape Shifter', titleId: 'Pengubah Bentuk', description: 'Switched theme (dark/light)', descriptionId: 'Mengganti tema (gelap/terang)', category: 'secret', icon: '🌓', hint: 'Change your perspective', hintId: 'Ubah sudut pandangmu', rarity: 'common' },
    { id: 'polyglot', title: 'Polyglot', titleId: 'Poliglot', description: 'Switched language', descriptionId: 'Mengganti bahasa', category: 'secret', icon: '🌐', hint: 'Speak another language', hintId: 'Bicara bahasa lain', rarity: 'common' },
    { id: 'scroll_master', title: 'Scroll Master', titleId: 'Master Scroll', description: 'Scrolled to the bottom of homepage', descriptionId: 'Scroll sampai bawah beranda', category: 'secret', icon: '📜', hint: 'Keep scrolling...', hintId: 'Terus scroll...', rarity: 'common' },

    // ── DEDICATION (2) ──
    { id: 'completionist', title: 'Completionist', titleId: 'Sang Penakluk', description: 'Unlocked all other badges', descriptionId: 'Membuka semua badge lainnya', category: 'dedication', icon: '🏆', hint: 'Collect them all', hintId: 'Kumpulkan semuanya', rarity: 'legendary' },
    { id: 'loyal_visitor', title: 'Loyal Visitor', titleId: 'Pengunjung Setia', description: 'Visited on 3 different days', descriptionId: 'Mengunjungi di 3 hari berbeda', category: 'dedication', icon: '❤️', hint: 'Come back another day', hintId: 'Kembali di hari lain', rarity: 'epic' },
];

export const CATEGORY_LABELS: Record<string, { en: string; id: string; color: string }> = {
    exploration: { en: 'Exploration', id: 'Eksplorasi', color: 'blue' },
    content: { en: 'Content', id: 'Konten', color: 'emerald' },
    interaction: { en: 'Interaction', id: 'Interaksi', color: 'amber' },
    secret: { en: 'Secret', id: 'Rahasia', color: 'purple' },
    dedication: { en: 'Dedication', id: 'Dedikasi', color: 'rose' },
};

export const RARITY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    common:    { bg: 'bg-neutral-500/10', text: 'text-neutral-400', border: 'border-neutral-500/20', glow: '' },
    uncommon:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: '' },
    rare:      { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
    epic:      { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/15' },
    legendary: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' },
};

/* ═══════════════════════════════════════════
   STORAGE HELPERS
   ═══════════════════════════════════════════ */
interface StoredAchievement {
    id: string;
    unlockedAt: string; // ISO date
}

function loadUnlocked(): StoredAchievement[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('portfolio_badges_v2') || '[]'); }
    catch { return []; }
}

function saveUnlocked(list: StoredAchievement[]) {
    localStorage.setItem('portfolio_badges_v2', JSON.stringify(list));
}

function loadVisitDays(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('portfolio_visit_days') || '[]'); }
    catch { return []; }
}

function trackVisitDay() {
    const today = new Date().toISOString().split('T')[0];
    const days = loadVisitDays();
    if (!days.includes(today)) {
        days.push(today);
        localStorage.setItem('portfolio_visit_days', JSON.stringify(days));
    }
    return days;
}

function loadPageVisits(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('portfolio_visited_pages') || '[]'); }
    catch { return []; }
}

function trackPageVisit(path: string): string[] {
    const pages = loadPageVisits();
    const base = path.split('?')[0].split('#')[0];
    if (!pages.includes(base)) {
        pages.push(base);
        localStorage.setItem('portfolio_visited_pages', JSON.stringify(pages));
    }
    return pages;
}

function getHomeVisitCount(): number {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('portfolio_home_visits') || '0', 10);
}

function trackHomeVisit(): number {
    const count = getHomeVisitCount() + 1;
    localStorage.setItem('portfolio_home_visits', count.toString());
    return count;
}

function getBlogsRead(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('portfolio_blogs_read') || '[]'); }
    catch { return []; }
}

export function trackBlogRead(slug: string): string[] {
    const blogs = getBlogsRead();
    if (!blogs.includes(slug)) {
        blogs.push(slug);
        localStorage.setItem('portfolio_blogs_read', JSON.stringify(blogs));
    }
    return blogs;
}

function getProjectsViewed(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('portfolio_projects_viewed') || '[]'); }
    catch { return []; }
}

export function trackProjectView(slug: string): string[] {
    const projects = getProjectsViewed();
    if (!projects.includes(slug)) {
        projects.push(slug);
        localStorage.setItem('portfolio_projects_viewed', JSON.stringify(projects));
    }
    return projects;
}

function getAiQuestionCount(): number {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('portfolio_ai_questions') || '0', 10);
}

export function trackAiQuestion(): number {
    const count = getAiQuestionCount() + 1;
    localStorage.setItem('portfolio_ai_questions', count.toString());
    return count;
}

/* ═══════════════════════════════════════════
   ACHIEVEMENT CONTEXT (Global state)
   ═══════════════════════════════════════════ */
interface AchievementContextType {
    unlocked: StoredAchievement[];
    unlock: (id: string) => void;
    isUnlocked: (id: string) => boolean;
    toast: Achievement | null;
    progress: number; // 0-100
    totalUnlocked: number;
    totalBadges: number;
}

const AchievementContext = createContext<AchievementContextType>({
    unlocked: [],
    unlock: () => {},
    isUnlocked: () => false,
    toast: null,
    progress: 0,
    totalUnlocked: 0,
    totalBadges: ACHIEVEMENTS.length,
});

export function AchievementProvider({ children }: { children: ReactNode }) {
    const [unlocked, setUnlocked] = useState<StoredAchievement[]>(loadUnlocked);
    const [toast, setToast] = useState<Achievement | null>(null);
    const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

    // Process toast queue
    useEffect(() => {
        if (!toast && toastQueue.length > 0) {
            setToast(toastQueue[0]);
            setToastQueue(prev => prev.slice(1));
        }
    }, [toast, toastQueue]);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const isUnlocked = useCallback((id: string) => unlocked.some(a => a.id === id), [unlocked]);

    const unlock = useCallback((id: string) => {
        setUnlocked(prev => {
            if (prev.some(a => a.id === id)) return prev;
            const next = [...prev, { id, unlockedAt: new Date().toISOString() }];
            saveUnlocked(next);

            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) setToastQueue(q => [...q, ach]);

            // Check completionist
            const nonCompletionist = ACHIEVEMENTS.filter(a => a.id !== 'completionist');
            if (next.filter(a => a.id !== 'completionist').length >= nonCompletionist.length) {
                if (!next.some(a => a.id === 'completionist')) {
                    const comp = { id: 'completionist', unlockedAt: new Date().toISOString() };
                    const withComp = [...next, comp];
                    saveUnlocked(withComp);
                    const compAch = ACHIEVEMENTS.find(a => a.id === 'completionist');
                    if (compAch) setTimeout(() => setToastQueue(q => [...q, compAch]), 500);
                    return withComp;
                }
            }

            return next;
        });
    }, []);

    const totalUnlocked = unlocked.length;
    const progress = Math.round((totalUnlocked / ACHIEVEMENTS.length) * 100);

    return (
        <AchievementContext.Provider value={{ unlocked, unlock, isUnlocked, toast, progress, totalUnlocked, totalBadges: ACHIEVEMENTS.length }}>
            {children}
        </AchievementContext.Provider>
    );
}

export function useAchievements() {
    return useContext(AchievementContext);
}

/* ═══════════════════════════════════════════
   AUTO-TRIGGERS HOOK
   Called once in PublicLayout to auto-detect achievements
   ═══════════════════════════════════════════ */
export function useAutoAchievements(pathname: string) {
    const { unlock, isUnlocked } = useAchievements();

    useEffect(() => {
        // Track page visit
        const pages = trackPageVisit(pathname);

        // Explorer: 3 pages
        if (pages.length >= 3) unlock('explorer');

        // Wanderer: all main pages
        const mainPages = ['/', '/about', '/blog', '/projects', '/certificates', '/testimonials', '/contact'];
        if (mainPages.every(p => pages.includes(p))) unlock('wanderer');

        // Globe Trotter
        if (pages.includes('/linkedin') && pages.includes('/instagram')) unlock('globe_trotter');

        // Badge Hunter
        if (pathname === '/badges') unlock('badge_hunter');

        // Certified
        if (pathname === '/certificates') unlock('certified');

        // Connector
        if (pathname === '/contact') unlock('connector');

        // Homecoming
        if (pathname === '/') {
            const homeCount = trackHomeVisit();
            if (homeCount >= 5) unlock('homecoming');
        }

        // Time-based
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) unlock('night_owl');
        if (hour >= 5 && hour < 7) unlock('early_bird');

        // Loyal visitor
        const days = trackVisitDay();
        if (days.length >= 3) unlock('loyal_visitor');

    }, [pathname, unlock, isUnlocked]);
}

/* ═══════════════════════════════════════════
   ACHIEVEMENT TOAST COMPONENT
   ═══════════════════════════════════════════ */
export function AchievementToast({ achievement }: { achievement: Achievement | null }) {
    if (!achievement) return null;

    const rarity = RARITY_COLORS[achievement.rarity];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -60, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -60, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed top-6 left-1/2 z-[250] -translate-x-1/2"
            >
                <div className={`flex items-center gap-4 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl ${rarity.border} bg-neutral-950/90`}
                    style={{ boxShadow: `0 20px 40px -8px rgba(0,0,0,0.4)` }}
                >
                    {/* Icon */}
                    <div className="relative">
                        <span className="text-4xl block animate-bounce">{achievement.icon}</span>
                        <div className={`absolute inset-0 blur-lg opacity-30 ${rarity.bg}`} />
                    </div>

                    {/* Text */}
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${rarity.text}`}>
                            🏅 Achievement Unlocked!
                        </p>
                        <p className="text-sm font-bold text-white mt-0.5">{achievement.title}</p>
                        <p className="text-[11px] text-neutral-400">{achievement.description}</p>
                    </div>

                    {/* Rarity badge */}
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
                        {achievement.rarity}
                    </span>

                    {/* Auto-dismiss progress bar */}
                    <motion.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left rounded-b-2xl ${rarity.text.replace('text-', 'bg-')}`}
                        style={{ opacity: 0.4 }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
