import { motion } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { FadeUp, StaggerChildren, StaggerItem } from '@/components/animations';
import { ReactIconRender } from '@/components/ReactIconRender';
import { Wrench } from 'lucide-react';

interface Skill { id: number; name_id: string; name_en: string; icon: string | null; description_id?: string | null; description_en?: string | null; }
interface SkillCategory { id: number; name_en: string; name_id: string; skills: Skill[]; }

const getBrandStyle = (name: string, dk: boolean) => {
    const s = name.toLowerCase();
    if (s.includes('html') || s.includes('laravel')) return { text: 'text-orange-500', pillBg: dk ? 'bg-orange-500/10' : 'bg-orange-50', border: dk ? 'border-orange-500/20' : 'border-orange-200' };
    if (s.includes('css') || s.includes('react') || s.includes('tailwind') || s.includes('go')) return { text: 'text-blue-500', pillBg: dk ? 'bg-blue-500/10' : 'bg-blue-50', border: dk ? 'border-blue-500/20' : 'border-blue-200' };
    if (s.includes('js') || s.includes('javascript') || s.includes('python')) return { text: 'text-yellow-500', pillBg: dk ? 'bg-yellow-500/10' : 'bg-yellow-50', border: dk ? 'border-yellow-500/20' : 'border-yellow-200' };
    if (s.includes('ts') || s.includes('typescript')) return { text: 'text-blue-600', pillBg: dk ? 'bg-blue-600/10' : 'bg-blue-100', border: dk ? 'border-blue-600/20' : 'border-blue-300' };
    if (s.includes('node') || s.includes('vue')) return { text: 'text-green-500', pillBg: dk ? 'bg-green-500/10' : 'bg-green-50', border: dk ? 'border-green-500/20' : 'border-green-200' };
    if (s.includes('php') || s.includes('bootstrap')) return { text: 'text-indigo-500', pillBg: dk ? 'bg-indigo-500/10' : 'bg-indigo-50', border: dk ? 'border-indigo-500/20' : 'border-indigo-200' };
    if (s.includes('docker') || s.includes('mysql') || s.includes('postgres') || s.includes('sql')) return { text: 'text-sky-500', pillBg: dk ? 'bg-sky-500/10' : 'bg-sky-50', border: dk ? 'border-sky-500/20' : 'border-sky-200' };
    if (s.includes('git') || s.includes('github') || s.includes('next') || s.includes('bun')) return { text: dk ? 'text-white' : 'text-black', pillBg: dk ? 'bg-white/10' : 'bg-black/5', border: dk ? 'border-white/20' : 'border-gray-200' };
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return { text: `text-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]`, pillBg: `bg-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]/10`, border: `border-[hsl(${hue},${dk ? '80%' : '70%'},${dk ? '70%' : '40%'})]/20` };
};

interface Props { skillCategories: SkillCategory[]; }

export function AboutSkills({ skillCategories }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    if (skillCategories.length === 0) return null;

    return (
        <section className={`py-20 ${dk ? 'bg-white/[0.01]' : 'bg-gray-50/50'}`}>
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <FadeUp>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dk ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                            <Wrench size={22} />
                        </div>
                        <h2 className="text-3xl font-black">{t('Skills & Tools', 'Keahlian')}</h2>
                    </div>
                </FadeUp>
                <StaggerChildren className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
                    {skillCategories.map((cat) => (
                        <StaggerItem key={cat.id}>
                            <motion.div whileHover={{ y: -5 }} className={`rounded-2xl p-7 transition-all ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/20' : 'bg-white border border-gray-100 hover:shadow-xl'}`}>
                                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-indigo-400">{lang === 'id' ? (cat.name_id || cat.name_en) : cat.name_en}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {cat.skills.map(s => {
                                        const sName = lang === 'id' ? (s.name_id || s.name_en) : (s.name_en || s.name_id);
                                        const style = getBrandStyle(sName, dk);
                                        return (
                                            <div key={s.id} className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${style.pillBg} ${style.border} ${style.text}`}>
                                                <span className="font-bold opacity-80 transition-opacity group-hover:opacity-100">
                                                    {s.icon ? <ReactIconRender name={s.icon} className="h-4 w-4" /> : <div className="flex h-5 w-5 items-center justify-center rounded-full bg-current/20 text-[9px]">{sName.charAt(0).toUpperCase()}</div>}
                                                </span>
                                                {sName}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerChildren>
            </div>
        </section>
    );
}
