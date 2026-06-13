import { motion } from 'framer-motion';
import { useApp } from '@/hooks/useApp';
import { ReactIconRender } from '@/components/ReactIconRender';

import { Brain } from 'lucide-react';

interface SoftSkill {
    id: number;
    name_id: string;
    name_en: string;
    description_id: string | null;
    description_en: string | null;
    icon: string | null;
}

interface Props { softSkills: SoftSkill[]; }

export function AboutSoftSkills({ softSkills }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    if (softSkills.length === 0) return null;

    return (
        <section className="py-20">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Brain className="h-6 w-6 text-violet-500" />
                        <h2 className="text-3xl font-black">{t('Soft Skills', 'Kemampuan Non-Teknis')}</h2>
                    </div>
                    <p className={`mt-1 text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{t('Personal attributes and professional competencies.', 'Atribut personal dan kompetensi profesional saya.')}</p>
                </motion.div>

                <div className="mt-10 flex flex-col gap-4">
                    {softSkills.map((ss, i) => {
                        const name = lang === 'id' ? (ss.name_id || ss.name_en) : (ss.name_en || ss.name_id);
                        const desc = lang === 'id' ? (ss.description_id || ss.description_en) : (ss.description_en || ss.description_id);

                        return (
                            <motion.div
                                key={ss.id}
                                initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                viewport={{ once: true, margin: '-20px' }}
                                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                className={`group relative flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl border p-5 transition-all duration-300 ${dk ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-white border-neutral-100 hover:bg-neutral-50 shadow-sm'}`}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${dk ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                    {ss.icon ? (
                                        <ReactIconRender name={ss.icon} className="h-6 w-6" />
                                    ) : (
                                        <Brain className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3 className={`font-bold text-lg ${dk ? 'text-neutral-200' : 'text-neutral-800'}`}>{name}</h3>
                                    {desc && (
                                        <p className={`mt-2 text-sm leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            {desc}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
