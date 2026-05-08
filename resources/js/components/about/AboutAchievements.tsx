import { motion } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { FadeUp, StaggerChildren, StaggerItem } from '@/components/animations';
import { Trophy } from 'lucide-react';

interface Achievement { id: number; title_en: string; title_id: string; description_en: string | null; description_id: string | null; date: string | null; type: string; }
interface Props { achievements: Achievement[]; }

export function AboutAchievements({ achievements }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const bi = (id: string | null, en: string | null) => lang === 'id' ? (id || en || '') : (en || id || '');

    if (achievements.length === 0) return null;

    return (
        <section className="py-20">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <FadeUp>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                            <Trophy size={22} />
                        </div>
                        <h2 className="text-3xl font-black">{t('Achievements', 'Pencapaian')}</h2>
                    </div>
                </FadeUp>
                <StaggerChildren className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
                    {achievements.map((a) => (
                        <StaggerItem key={a.id}>
                            <motion.div whileHover={{ y: -5, scale: 1.02 }} className={`rounded-2xl p-7 ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-white border border-gray-100 hover:shadow-xl'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">🏆</span>
                                    <span className={`text-xs ${dk ? 'text-white/20' : 'text-gray-300'}`}>{a.date || ''}</span>
                                </div>
                                <h3 className="mt-3 font-bold">{bi(a.title_id, a.title_en)}</h3>
                                {bi(a.description_id, a.description_en) && (
                                    <p className={`mt-2 text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>{bi(a.description_id, a.description_en)}</p>
                                )}
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerChildren>
            </div>
        </section>
    );
}
