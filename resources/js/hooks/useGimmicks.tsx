import { useEffect, useState, useCallback } from 'react';

/* Konami: ↑↑↓↓←→←→BA */
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

/* God Mode overlay */
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

/* Achievement system */
interface Achievement { id: string; title: string; icon: string; }

const ACHIEVEMENTS: Achievement[] = [
    { id: 'explorer', title: 'Explorer — Visited 3 pages', icon: '🧭' },
    { id: 'konami', title: 'Gamer — Found the Konami Code', icon: '🎮' },
    { id: 'searcher', title: 'Detective — Used Spotlight Search', icon: '🔍' },
    { id: 'night_owl', title: 'Night Owl — Visited after midnight', icon: '🦉' },
    { id: 'scroller', title: 'Reader — Scrolled to the bottom', icon: '📖' },
];

export function useAchievements() {
    const [unlocked, setUnlocked] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try { return JSON.parse(localStorage.getItem('achievements') || '[]'); } catch { return []; }
        }
        return [];
    });
    const [toast, setToast] = useState<Achievement | null>(null);

    const unlock = useCallback((id: string) => {
        setUnlocked(prev => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            localStorage.setItem('achievements', JSON.stringify(next));
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) setToast(ach);
            return next;
        });
    }, []);

    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

    return { unlocked, unlock, toast, achievements: ACHIEVEMENTS };
}

export function AchievementToast({ achievement }: { achievement: { title: string; icon: string } | null }) {
    if (!achievement) return null;
    return (
        <div className="fixed top-24 left-1/2 z-[250] -translate-x-1/2 animate-[slideDown_0.5s_ease-out] rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-6 py-3 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-500/60">Achievement Unlocked!</p>
                    <p className="text-sm font-semibold text-yellow-200">{achievement.title}</p>
                </div>
            </div>
            <style>{`@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
        </div>
    );
}
