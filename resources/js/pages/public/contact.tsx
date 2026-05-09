import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, ArrowUpRight, MapPin } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAchievements } from '@/hooks/useGimmicks';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp, FadeLeft, MagneticButton } from '@/components/animations';
import { ContactForm } from '@/components/landing/ContactForm';

interface Profile { key: string; value_id: string | null; value_en: string | null; }

export default function Contact({ profiles }: { profiles: Record<string, Profile> }) {
    const { lang, theme: appTheme, t } = useApp();
    const { unlock } = useAchievements();
    const dk = appTheme === 'dark';
    const pv = (key: string) => lang === 'id' ? (profiles[key]?.value_id || profiles[key]?.value_en || '') : (profiles[key]?.value_en || profiles[key]?.value_id || '');
    const socials = [
        pv('email') && { icon: Mail, label: pv('email'), href: `mailto:${pv('email')}`, color: '#ef4444' },
        pv('github_url') && { icon: Github, label: 'GitHub', href: pv('github_url'), color: '#6366f1' },
        pv('linkedin_url') && { icon: Linkedin, label: 'LinkedIn', href: pv('linkedin_url'), color: '#0077b5' },
    ].filter(Boolean) as { icon: any; label: string; href: string; color: string }[];

    return (
        <PublicLayout>
            <Head title={t('Contact', 'Kontak')} />
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-6xl px-5 sm:px-8">
                    <div className="grid gap-16 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <FadeUp><p className={`text-xs font-bold uppercase tracking-[0.25em] ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>{t('Contact', 'Kontak')}</p></FadeUp>
                            <TextReveal className="mt-3 text-4xl font-black sm:text-5xl" delay={0.2}>{t("Let's talk.", 'Mari bicara.')}</TextReveal>
                            <FadeUp delay={0.5}><p className={`mt-6 text-lg leading-relaxed ${dk ? 'text-white/40' : 'text-gray-500'}`}>{t("Got a project idea? I'd love to hear from you.", 'Punya ide proyek? Saya senang mendengar dari Anda.')}</p></FadeUp>
                            {socials.length > 0 && (
                                <div className="mt-8 space-y-3">
                                    {socials.map((s, i) => (
                                        <motion.a key={i} href={s.href} target={s.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener"
                                            onClick={() => unlock('connector')}
                                            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                            transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: [0.25,0.4,0.25,1] }}
                                            whileHover={{ x: 5, scale: 1.02 }}
                                            className={`group flex items-center gap-4 rounded-2xl p-4 transition-all ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/15' : 'bg-white border border-gray-100 hover:shadow-lg'}`}>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.color}15` }}>
                                                <s.icon className="h-4 w-4" style={{ color: s.color }} />
                                            </div>
                                            <span className={`flex-1 text-sm font-medium ${dk ? 'text-white/60' : 'text-gray-600'}`}>{s.label}</span>
                                            <ArrowUpRight className={`h-4 w-4 opacity-0 transition-all group-hover:opacity-60 ${dk ? 'text-white/40' : 'text-gray-400'}`} />
                                        </motion.a>
                                    ))}
                                </div>
                            )}
                        </div>
                        <FadeLeft delay={0.4} className="lg:col-span-3">
                            <div className={`rounded-3xl p-8 sm:p-10 ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-white border border-gray-100 shadow-xl'}`}>
                                <h2 className="mb-8 text-xl font-bold">{t('Send a Message', 'Kirim Pesan')}</h2>
                                <ContactForm />
                            </div>
                        </FadeLeft>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
