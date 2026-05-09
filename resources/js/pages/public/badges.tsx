import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Sparkles, Filter } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { SeoHead } from '@/components/SeoHead';
import { useAchievements, ACHIEVEMENTS, CATEGORY_LABELS, RARITY_COLORS, type Achievement } from '@/hooks/useGimmicks';

/* ─── Badge Card ─── */
function BadgeCard({ achievement, unlocked, unlockedAt, dk, lang }: {
    achievement: Achievement; unlocked: boolean; unlockedAt?: string; dk: boolean; lang: string;
}) {
    const rarity = RARITY_COLORS[achievement.rarity];
    const cat = CATEGORY_LABELS[achievement.category];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={unlocked ? { y: -4, scale: 1.02 } : {}}
            className={`group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 ${
                unlocked
                    ? dk
                        ? `bg-neutral-900/80 border-neutral-700/50 hover:border-neutral-600 ${rarity.glow ? 'shadow-lg ' + rarity.glow : ''}`
                        : `bg-white border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md ${rarity.glow ? 'shadow-lg ' + rarity.glow : ''}`
                    : dk
                        ? 'bg-neutral-900/30 border-neutral-800/50'
                        : 'bg-neutral-50 border-neutral-200/50'
            }`}
        >
            {/* Rarity indicator line */}
            <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full ${unlocked ? rarity.text.replace('text-', 'bg-') : 'bg-transparent'}`} style={{ opacity: 0.4 }} />

            {/* Badge icon */}
            <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl text-3xl mb-3 transition-all duration-300 ${
                unlocked
                    ? `${rarity.bg} ${rarity.border} border`
                    : dk ? 'bg-neutral-800/50 grayscale opacity-40' : 'bg-neutral-200/50 grayscale opacity-40'
            }`}>
                {unlocked ? (
                    <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{achievement.icon}</span>
                ) : (
                    <Lock size={20} className={dk ? 'text-neutral-600' : 'text-neutral-400'} />
                )}
            </div>

            {/* Title */}
            <h3 className={`text-sm font-bold mb-1 ${
                unlocked
                    ? dk ? 'text-white' : 'text-neutral-900'
                    : dk ? 'text-neutral-600' : 'text-neutral-400'
            }`}>
                {unlocked ? (lang === 'id' ? achievement.titleId : achievement.title) : '???'}
            </h3>

            {/* Description or hint */}
            <p className={`text-[11px] leading-relaxed mb-2 ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {unlocked
                    ? (lang === 'id' ? achievement.descriptionId : achievement.description)
                    : (lang === 'id' ? achievement.hintId : achievement.hint)
                }
            </p>

            {/* Meta: rarity + category */}
            <div className="flex items-center gap-1.5 mt-auto">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${unlocked ? `${rarity.bg} ${rarity.text}` : dk ? 'bg-neutral-800 text-neutral-600' : 'bg-neutral-200 text-neutral-400'}`}>
                    {unlocked ? achievement.rarity : '???'}
                </span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${dk ? 'bg-neutral-800/50 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}>
                    {lang === 'id' ? cat.id : cat.en}
                </span>
            </div>

            {/* Unlock date */}
            {unlocked && unlockedAt && (
                <p className={`text-[9px] mt-2 ${dk ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    {new Date(unlockedAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
            )}
        </motion.div>
    );
}

/* ─── Badges Page ─── */
export default function Badges() {
    const { dk, t, lang } = useApp();
    const { unlocked, isUnlocked, progress, totalUnlocked, totalBadges } = useAchievements();
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const categories = Object.keys(CATEGORY_LABELS);

    const filteredBadges = ACHIEVEMENTS.filter(a => {
        if (filter === 'unlocked' && !isUnlocked(a.id)) return false;
        if (filter === 'locked' && isUnlocked(a.id)) return false;
        if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
        return true;
    });

    const getUnlockedAt = (id: string) => unlocked.find(u => u.id === id)?.unlockedAt;

    return (
        <PublicLayout>
            <SeoHead title={t('Badges', 'Badge')} description={t('My achievement badges collection', 'Koleksi badge pencapaian saya')} />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                            <Trophy size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{t('Badges', 'Badge')}</h1>
                            <p className={`text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {t('Explore the portfolio to unlock achievements!', 'Jelajahi portofolio untuk membuka achievement!')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className={`rounded-xl border p-4 ${dk ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${dk ? 'text-neutral-200' : 'text-neutral-700'}`}>
                            {t('Progress', 'Progres')}
                        </span>
                        <span className={`text-sm font-bold ${dk ? 'text-amber-400' : 'text-amber-600'}`}>
                            {totalUnlocked}/{totalBadges}
                        </span>
                    </div>
                    <div className={`h-2.5 rounded-full overflow-hidden ${dk ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        />
                    </div>
                    {totalUnlocked === totalBadges && (
                        <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                            <Sparkles size={12} /> {t('All badges unlocked! You\'re amazing!', 'Semua badge terbuka! Kamu luar biasa!')}
                        </p>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Status filter */}
                    <div className="flex gap-1.5">
                        {([['all', t('All', 'Semua')], ['unlocked', t('Unlocked', 'Terbuka')], ['locked', t('Locked', 'Terkunci')]] as [string, string][]).map(([key, label]) => (
                            <button key={key} onClick={() => setFilter(key as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    filter === key
                                        ? dk ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : dk ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-neutral-300' : 'bg-neutral-50 text-neutral-500 border border-neutral-200 hover:text-neutral-700'
                                }`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Category filter */}
                    <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setCategoryFilter('all')}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                categoryFilter === 'all'
                                    ? dk ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-white'
                                    : dk ? 'bg-neutral-900 text-neutral-500 hover:text-neutral-300' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-700'
                            }`}>
                            <Filter size={10} className="inline mr-1" />{t('All', 'Semua')}
                        </button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                    categoryFilter === cat
                                        ? dk ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-white'
                                        : dk ? 'bg-neutral-900 text-neutral-500 hover:text-neutral-300' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-700'
                                }`}>
                                {lang === 'id' ? CATEGORY_LABELS[cat].id : CATEGORY_LABELS[cat].en}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Badge Grid */}
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredBadges.map(badge => (
                            <BadgeCard
                                key={badge.id}
                                achievement={badge}
                                unlocked={isUnlocked(badge.id)}
                                unlockedAt={getUnlockedAt(badge.id)}
                                dk={dk}
                                lang={lang}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredBadges.length === 0 && (
                    <div className={`text-center py-12 rounded-xl border ${dk ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'}`}>
                        <Lock size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">{t('No badges match this filter', 'Tidak ada badge yang sesuai filter')}</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
