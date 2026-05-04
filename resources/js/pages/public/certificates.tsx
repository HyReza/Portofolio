import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Award } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp, StaggerChildren, StaggerItem } from '@/components/animations';

interface Certificate { id: number; name: string; issuer: string; credential_url: string | null; image: string | null; issued_at: string | null; }

export default function Certificates({ certificates }: { certificates: Certificate[] }) {
    const { theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    return (
        <PublicLayout>
            <Head title={t('Certificates', 'Sertifikat')} />
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <FadeUp><p className={`text-xs font-bold uppercase tracking-[0.25em] ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>{t('Credentials', 'Kredensial')}</p></FadeUp>
                    <TextReveal className="mt-3 text-4xl font-black sm:text-5xl">{t('Certificates', 'Sertifikat')}</TextReveal>

                    {certificates.length === 0 ? <FadeUp delay={0.3}><p className={`mt-20 text-center text-lg ${dk ? 'text-white/20' : 'text-gray-300'}`}>{t('No certificates yet.', 'Belum ada sertifikat.')}</p></FadeUp> : (
                        <StaggerChildren className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
                            {certificates.map((c) => (
                                <StaggerItem key={c.id}>
                                    <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.3 }}
                                        className={`group overflow-hidden rounded-3xl ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/15' : 'bg-white border border-gray-100 hover:shadow-2xl'}`}>
                                        {c.image ? <div className="aspect-[4/3] overflow-hidden"><img src={`/storage/${c.image}`} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div> :
                                            <div className={`flex aspect-[4/3] items-center justify-center ${dk ? 'bg-gradient-to-br from-indigo-500/5 to-purple-500/5' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}><Award className="h-16 w-16 text-indigo-500/15" /></div>}
                                        <div className="p-6">
                                            <h3 className="font-bold">{c.name}</h3>
                                            <p className={`mt-1 text-sm ${dk ? 'text-white/30' : 'text-gray-400'}`}>{c.issuer}</p>
                                            <div className="mt-4 flex items-center justify-between">
                                                {c.issued_at && <span className={`text-xs ${dk ? 'text-white/15' : 'text-gray-300'}`}>{new Date(c.issued_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                                                {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300">{t('Verify', 'Verifikasi')} <ArrowUpRight className="h-3 w-3" /></a>}
                                            </div>
                                        </div>
                                    </motion.div>
                                </StaggerItem>
                            ))}
                        </StaggerChildren>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
